import Tesseract from 'tesseract.js'
import type { Category } from '../store/types'
import { today } from './formatters'

export interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  suggestedCategoryId: string | null
}

const MONTH_MAP: Record<string, string> = {
  ene: '01', jan: '01',
  feb: '02',
  mar: '03',
  abr: '04', apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08', aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12', dec: '12',
}

const NOISE_RE = [
  /tarjeta\s+titular/i,
  /tus\s+movimientos/i,
  /periodo\s+(actual|anterior|previo)/i,
  /previo\s+al\s+anterior/i,
  /^\s*anteriores\s*$/i,
  /movimientos/i,
  /usd/i,
  /^\s*[<>►◄→←|]\s*$/,
  /^\s*\+?\$?0+\.00\s*$/,
  /^\s*\d{1,2}:\d{2}\s*$/,
]

function isNoise(line: string) {
  return NOISE_RE.some((r) => r.test(line))
}

// Return the numeric amount if the line contains a $X.XX pattern, else null
function parseAmount(line: string): number | null {
  const m = line.match(/\$\s*([\d,]+\.\d{2})/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return n > 0 ? n : null
}

// Text that appears on the same line before the amount — used as fallback merchant
function inlineMerchant(line: string): string {
  return line.replace(/[+-]?\s*\$[\d,\s]+\.\d{2}.*$/, '').replace(/[►◄→←>|]/g, '').trim()
}

// DD-MM-YYYY or DD/MM/YYYY anywhere in the line
function parseDate1(line: string): string | null {
  const m = line.match(/(\d{2})[-/](\d{2})[-/](\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

// "18 Abr" anywhere in the line
function parseDate2(line: string): string | null {
  const m = line.match(/(\d{1,2})\s+([A-Za-z]{3})/)
  if (!m) return null
  const month = MONTH_MAP[m[2].toLowerCase()]
  if (!month) return null
  const year = new Date().getFullYear()
  return `${year}-${month}-${m[1].padStart(2, '0')}`
}

type ParsedTx = { date: string; description: string; amount: number }

function parseLayout1(lines: string[]): ParsedTx[] {
  // BBVA-style: date header → merchant text (may be multiple lines, or on the same line as amount) → amount
  const results: ParsedTx[] = []
  let currentDate: string | null = null
  const merchantParts: string[] = []

  for (const line of lines) {
    const date = parseDate1(line)
    if (date) {
      currentDate = date
      merchantParts.length = 0
      continue
    }

    const amount = parseAmount(line)
    if (amount !== null && currentDate) {
      // Prefer accumulated merchant lines; fall back to text on the same line as the amount
      const desc = merchantParts.length > 0
        ? merchantParts.join(' ')
        : inlineMerchant(line)

      if (desc) {
        results.push({ date: currentDate, description: desc, amount })
      }
      merchantParts.length = 0
      continue
    }

    // Accumulate non-date, non-amount lines as merchant name parts
    if (currentDate && amount === null) {
      merchantParts.push(line)
    }
  }

  return results
}

function parseLayout2(lines: string[]): ParsedTx[] {
  // Banamex-style: merchant line → "18 Abr" line → amount line
  const results: ParsedTx[] = []

  for (let i = 0; i < lines.length - 2; i++) {
    const date = parseDate2(lines[i + 1])
    if (!date) continue
    const amount = parseAmount(lines[i + 2])
    if (amount === null) continue
    const merchant = lines[i]
    if (isNoise(merchant) || parseDate1(merchant) || parseAmount(merchant) !== null) continue
    results.push({ date, description: merchant, amount })
    i += 2
  }

  return results
}

// Last-resort: for each amount line, pair it with the nearest preceding date
function parseFallback(lines: string[]): ParsedTx[] {
  const results: ParsedTx[] = []
  let lastDate: string | null = null

  for (const line of lines) {
    const date = parseDate1(line)
    if (date) { lastDate = date; continue }

    const amount = parseAmount(line)
    if (amount !== null) {
      const desc = inlineMerchant(line)
      results.push({ date: lastDate ?? today(), description: desc || 'Unknown', amount })
    }
  }

  return results
}

function parseTransactions(text: string): ParsedTx[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !isNoise(l))

  const r1 = parseLayout1(lines)
  const r2 = parseLayout2(lines)

  // Pick whichever structured parser found more results
  const best = r1.length >= r2.length ? r1 : r2

  // If structured parsers found nothing but there are dates and amounts, use fallback
  if (best.length === 0) {
    return parseFallback(lines)
  }

  return best
}

const CATEGORY_KEYWORDS: [string[], string][] = [
  [['GASOL', 'GAS ', 'PEMEX', 'BP '], 'gasolina'],
  [['UBER', 'DIDI', 'CABIFY', 'INDRIVER'], 'uber'],
  [['FARMA', 'MEDIC', 'CLINIC', 'DOCTOR', 'HOSP', 'LAB ', 'CLINPOD'], 'medicos'],
  [['NETFLIX', 'SPOTIFY', 'HBO', 'DISNEY', 'APPLE', 'AMAZON PR', 'SUBSCR'], 'subscriptions'],
  [['COSTCO', 'WALMART', 'SORIANA', 'HEB ', 'CHEDRAUI', 'SUPER ', 'MERCADO'], 'mandado'],
  [['RESTAUR', 'TAQUERIA', 'PANADERIA', 'COCINA', 'SUSHI', 'PIZZA', 'BURGER', 'CAFE ', 'HONORE'], 'salidas'],
  [['TELMEX', 'TELCEL', 'AT&T', 'TOTALPLAY', 'MEGACABLE', 'CABLE', 'INTERNET', 'MOVISTAR'], 'cable'],
  [['AIRBNB', 'VUELO', 'HOTEL', 'BOOKING', 'FLIGHT'], 'viajes'],
  [['CFE', 'LUZ '], 'luz'],
  [['AGUA', 'SACMEX', 'ODAPAS'], 'agua'],
]

function suggestCategory(description: string, categories: Category[]): string | null {
  const upper = description.toUpperCase()
  for (const [keywords, catId] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => upper.includes(kw))) {
      return categories.find((c) => c.id === catId)?.id ?? null
    }
  }
  return null
}

export async function extractTransactionsFromScreenshots(
  images: Array<{ base64: string; mediaType: string }>,
  categories: Category[],
  onProgress?: (msg: string) => void,
): Promise<{ transactions: ExtractedTransaction[]; debugLines: string[] }> {
  const all: ExtractedTransaction[] = []
  const allDebugLines: string[] = []

  for (let i = 0; i < images.length; i++) {
    onProgress?.(`Reading image ${i + 1} of ${images.length}…`)

    const { data: { text } } = await Tesseract.recognize(
      `data:${images[i].mediaType};base64,${images[i].base64}`,
      'eng',
    )

    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    allDebugLines.push(...rawLines)

    const parsed = parseTransactions(text)
    for (const tx of parsed) {
      all.push({ ...tx, suggestedCategoryId: suggestCategory(tx.description, categories) })
    }
  }

  return { transactions: all, debugLines: allDebugLines }
}
