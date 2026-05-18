import Tesseract from 'tesseract.js'
import type { Category } from '../store/types'
import { today } from './formatters'

export type Bank = 'banamex' | 'banorte'

export interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  suggestedCategoryId: string | null
}

export interface ExtractionResult {
  transactions: ExtractedTransaction[]
  excludedCredits: number
}

const MONTH_MAP: Record<string, string> = {
  ene: '01', jan: '01', enero: '01', january: '01',
  feb: '02', febrero: '02', february: '02',
  mar: '03', marzo: '03', march: '03',
  abr: '04', apr: '04', abril: '04', april: '04',
  may: '05', mayo: '05',
  jun: '06', junio: '06', june: '06',
  jul: '07', julio: '07', july: '07',
  ago: '08', aug: '08', agosto: '08', august: '08',
  sep: '09', sept: '09', septiembre: '09', september: '09',
  oct: '10', octubre: '10', october: '10',
  nov: '11', noviembre: '11', november: '11',
  dic: '12', dec: '12', diciembre: '12', december: '12',
}

const SECTION_HEADER_RE = [
  /^esta\s+semana$/i,
  /^este\s+mes$/i,
  /^mes\s+anterior$/i,
  /^anteriores?$/i,
  /^tus\s+movimientos$/i,
  /^movimientos$/i,
  /^periodo\s+(actual|anterior|previo)/i,
]

const ROW_NOISE_RE = [
  /tarjeta\s+titular/i,
  /(?:^|\s)en\s+proceso\b/i,
  /^procesad[oa]$/i,
  /^pendiente$/i,
  /^usd$/i,
  /^\s*[<>►◄→←|•]+\s*$/,
  /^\s*\d{1,2}:\d{2}\s*$/,
]

const CREDIT_KEYWORDS_RE = /SU\s+ABONO|GRACIAS|PAGO\s+RECIBIDO|ABONO\s+PAGO/i

function isSectionHeader(line: string) {
  return SECTION_HEADER_RE.some((r) => r.test(line.trim()))
}

function isRowNoise(line: string) {
  return ROW_NOISE_RE.some((r) => r.test(line.trim()))
}

// Match a money pattern anywhere in the line.
// Returns the parsed amount and the printed sign ('+' / '-' / '').
function matchMoney(line: string): { amount: number; sign: '+' | '-' | '' } | null {
  const m = line.match(/([+-])?\s*\$\s*([\d,]+\.\d{2})/)
  if (!m) return null
  const n = parseFloat(m[2].replace(/,/g, ''))
  if (!(n > 0)) return null
  return { amount: n, sign: (m[1] as '+' | '-' | undefined) ?? '' }
}

// True when a line is a bare DD-MM-YYYY (or DD/MM/YYYY) date header.
function matchBareNumericDate(line: string): string | null {
  const t = line.trim()
  const m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\.?$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// "16 May", "16 May En proceso e" — match a day + month abbr at the start of a line.
// Trailing text (status pill OCR residue) is allowed and ignored.
function matchShortDate(line: string): { day: number; monthIdx: number } | null {
  const m = line.trim().match(/^(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3,12})\b/)
  if (!m) return null
  const month = MONTH_MAP[m[2].toLowerCase().replace(/\./g, '')]
  if (!month) return null
  return { day: parseInt(m[1], 10), monthIdx: parseInt(month, 10) }
}

// If the inferred date sits more than ~2 months in the future relative to today,
// assume the screenshot is from late last year.
function inferYear(monthIdx: number, day: number, now: Date = new Date()): number {
  const currentYear = now.getFullYear()
  const candidate = new Date(currentYear, monthIdx - 1, day)
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() + 2)
  return candidate > cutoff ? currentYear - 1 : currentYear
}

function formatShortDate(d: { day: number; monthIdx: number }): string {
  const year = inferYear(d.monthIdx, d.day)
  return `${year}-${String(d.monthIdx).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

// Strip known OCR residue from a description line. Returns '' for lines that
// don't survive cleanup (require ≥3 alphanumeric chars to keep).
function cleanDescription(s: string): string {
  let cleaned = s
    .replace(/[~©®•↗↘↑↓→←▪►◄]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Strip leading single-char OCR-icon tokens (e.g. "O > ...", "o > ...", "> ...").
  cleaned = cleaned.replace(/^[<>oO0]\s+(?=[A-Za-z*#])/g, '')
  cleaned = cleaned.replace(/^[<>]+\s*/g, '')
  // Strip trailing ">"-only OCR residue (e.g. "HE. >", "matriz >").
  cleaned = cleaned.replace(/\s*>+\s*$/g, '')
  cleaned = cleaned.trim()
  const alnum = cleaned.replace(/[^A-Za-z0-9]/g, '')
  if (alnum.length < 3) return ''
  return cleaned
}

// Strip the arrow-icon glyph that Banorte OCR renders as a stray "7" between
// description and a "-$amount" on the same line.
function stripArrowPlaceholder(line: string): string {
  return line.replace(/\s+[↗→7]\s+(?=-\$)/g, ' ')
}

// Extract the description portion that appears before a money pattern on the same line.
function descriptionBeforeMoney(line: string): string {
  const m = line.match(/^(.*?)\s*[+-]?\$\s*[\d,]+\.\d{2}/)
  return m ? cleanDescription(m[1]) : ''
}

type ParsedTx = { date: string; description: string; amount: number }

interface ParseOutcome {
  transactions: ParsedTx[]
  excludedCredits: number
}

interface Pending {
  amount: number
  isCredit: boolean
  parts: string[]
}

function dedupePush(parts: string[], next: string): void {
  if (parts.some((p) => p === next || p.includes(next) || next.includes(p))) return
  parts.push(next)
}

// ── Banamex ──────────────────────────────────────────────────────────────
// Real OCR shape: `description $amount` on one line, then `DD Mon En proceso e`
// on the next. Occasional continuation lines (logo OCR duplicates, wrapped
// descriptions) may appear between the money line and the date line.
function parseBanamex(lines: string[]): ParseOutcome {
  const txs: ParsedTx[] = []
  let excludedCredits = 0
  let pending: Pending | null = null
  let prevLine: string | null = null

  const flushOnDate = (d: { day: number; monthIdx: number }) => {
    if (pending) {
      const desc = pending.parts.join(' ').trim()
      if (pending.isCredit) {
        excludedCredits++
      } else if (desc) {
        txs.push({ date: formatShortDate(d), description: desc, amount: pending.amount })
      }
    }
    pending = null
    prevLine = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (isSectionHeader(line)) continue

    const dateMatch = matchShortDate(line)
    if (dateMatch) {
      flushOnDate(dateMatch)
      continue
    }

    if (isRowNoise(line)) continue

    const money = matchMoney(line)
    if (money) {
      // New row starts — discard any prior pending without a date.
      pending = null
      let desc = descriptionBeforeMoney(line)
      if (!desc && prevLine) desc = cleanDescription(prevLine)
      const isCredit =
        money.sign === '+' || CREDIT_KEYWORDS_RE.test(line) || CREDIT_KEYWORDS_RE.test(desc)
      pending = { amount: money.amount, isCredit, parts: desc ? [desc] : [] }
      prevLine = null
      continue
    }

    // Non-date, non-money, non-noise line.
    if (pending) {
      const cleaned = cleanDescription(line)
      if (cleaned) dedupePush(pending.parts, cleaned)
    } else {
      prevLine = line
    }
  }

  return { transactions: txs, excludedCredits }
}

// ── Banorte ──────────────────────────────────────────────────────────────
// Real OCR shape: bare `DD-MM-YYYY` header, then one or more rows where the
// money line carries `descriptionPart1 ↗ -$amount` and 1-3 continuation lines
// hold the rest of the description (prefixed with `~`, `©`, `o >`, etc.).
function parseBanorte(lines: string[]): ParseOutcome {
  const txs: ParsedTx[] = []
  let excludedCredits = 0
  let currentDate: string | null = null
  let pending: Pending | null = null

  const flush = () => {
    if (pending && currentDate) {
      const desc = pending.parts.join(' ').replace(/\s+/g, ' ').trim()
      if (pending.isCredit) {
        excludedCredits++
      } else if (desc) {
        txs.push({ date: currentDate, description: desc, amount: pending.amount })
      }
    }
    pending = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (isSectionHeader(line)) continue

    const bareDate = matchBareNumericDate(line)
    if (bareDate) {
      flush()
      currentDate = bareDate
      continue
    }

    if (isRowNoise(line)) continue

    const stripped = stripArrowPlaceholder(line)
    const money = matchMoney(stripped)
    if (money) {
      flush()
      const desc1 = descriptionBeforeMoney(stripped)
      const isCredit =
        money.sign === '+' || CREDIT_KEYWORDS_RE.test(line) || CREDIT_KEYWORDS_RE.test(desc1)
      pending = { amount: money.amount, isCredit, parts: desc1 ? [desc1] : [] }
      continue
    }

    if (pending) {
      const cleaned = cleanDescription(line)
      if (cleaned) dedupePush(pending.parts, cleaned)
    }
  }

  flush()
  return { transactions: txs, excludedCredits }
}

const CATEGORY_KEYWORDS: [string[], string][] = [
  [['GASOL', 'GAS ', 'PEMEX', 'BP '], 'gasolina'],
  [['UBER', 'DIDI', 'CABIFY', 'INDRIVER'], 'uber'],
  [['FARMA', 'MEDIC', 'CLINIC', 'DOCTOR', 'HOSP', 'LAB ', 'CLINPOD'], 'medicos'],
  [['NETFLIX', 'SPOTIFY', 'HBO', 'DISNEY', 'APPLE', 'AMAZON PR', 'SUBSCR'], 'subscriptions'],
  [['COSTCO', 'WALMART', 'SORIANA', 'HEB ', 'CHEDRAUI', 'SUPER ', 'MERCADO'], 'mandado'],
  [['RESTAUR', 'TAQUERIA', 'PANADERIA', 'COCINA', 'SUSHI', 'PIZZA', 'BURGER', 'CAFE ', 'HONORE', "CARL'S"], 'salidas'],
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

export function parseLinesForBank(lines: string[], bank: Bank): ParseOutcome {
  const cleaned = lines.map((l) => l.trim()).filter((l) => l.length > 0)
  return bank === 'banamex' ? parseBanamex(cleaned) : parseBanorte(cleaned)
}

export async function extractTransactionsFromScreenshots(
  images: Array<{ base64: string; mediaType: string }>,
  bank: Bank,
  categories: Category[],
  onProgress?: (msg: string) => void,
): Promise<ExtractionResult> {
  const all: ExtractedTransaction[] = []
  let excludedCredits = 0

  for (let i = 0; i < images.length; i++) {
    onProgress?.(`Reading image ${i + 1} of ${images.length}…`)

    const { data: { text } } = await Tesseract.recognize(
      `data:${images[i].mediaType};base64,${images[i].base64}`,
      'eng+spa',
    )

    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)

    const { transactions, excludedCredits: excluded } = parseLinesForBank(rawLines, bank)
    excludedCredits += excluded
    for (const tx of transactions) {
      all.push({
        ...tx,
        date: tx.date || today(),
        suggestedCategoryId: suggestCategory(tx.description, categories),
      })
    }
  }

  return { transactions: all, excludedCredits }
}
