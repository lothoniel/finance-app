import ExcelJS from 'exceljs'
import { calculateSettlement } from './settlement'
import { sortByDateDesc } from './filters'
import { today } from './formatters'
import type {
  Expense,
  Paycheck,
  ManualTax,
  Transfer,
  DebtPayment,
  Portfolio,
  InvestmentMovement,
  Settlement,
  CashEntry,
  MortgageConfig,
  MortgagePayment,
  MortgageContribution,
  AppSettings,
} from '../store/types'

const PURPLE = 'FF7C3AED'
const WHITE = 'FFFFFFFF'
const LIGHT_GRAY = 'FFF2F2F2'
const LIGHT_PURPLE = 'FFF3F0FD'
const GREEN_FILL = 'FFD4EDDA'
const RED_FILL = 'FFFDE8E8'
const MXN_FMT = '#,##0.00'
const DATE_FMT = 'yyyy-mm-dd'
const NUM_FMT = '0.00'

export interface ExportData {
  expenses: Expense[]
  paychecks: Paycheck[]
  manualTaxes: ManualTax[]
  transfers: Transfer[]
  debtPayments: DebtPayment[]
  portfolios: Portfolio[]
  investmentMovements: InvestmentMovement[]
  settlements: Settlement[]
  cashEntries: CashEntry[]
  mortgageConfig?: MortgageConfig
  mortgagePayments?: MortgagePayment[]
  mortgageContributions?: MortgageContribution[]
  settings: AppSettings
}

type CellValue = string | number | Date | null | undefined

type ColDef = {
  header: string
  width: number
  numFmt?: string
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function resolveUser(id: 'user1' | 'user2', settings: AppSettings): string {
  return id === 'user1' ? settings.user1Name : settings.user2Name
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 22
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
}

function addDataSheet(
  wb: ExcelJS.Workbook,
  name: string,
  cols: ColDef[],
  rows: CellValue[][],
  totalsColIndices?: number[]
) {
  const ws = wb.addWorksheet(name)
  ws.columns = cols.map((c) => ({ width: c.width }))

  const headerRow = ws.addRow(cols.map((c) => c.header))
  styleHeaderRow(headerRow)

  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } }

  rows.forEach((rowData, rowIdx) => {
    const row = ws.addRow(rowData)

    if (rowIdx % 2 === 1) {
      for (let c = 1; c <= cols.length; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } }
      }
    }

    cols.forEach((col, i) => {
      if (!col.numFmt) return
      const cell = row.getCell(i + 1)
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        cell.numFmt = col.numFmt
      }
    })
  })

  if (totalsColIndices && totalsColIndices.length > 0) {
    const totalsData: CellValue[] = cols.map((_, colIdx) => {
      if (colIdx === 0) return 'TOTAL'
      if (!totalsColIndices.includes(colIdx)) return ''
      return rows.reduce((sum, row) => sum + (typeof row[colIdx] === 'number' ? (row[colIdx] as number) : 0), 0)
    })
    const totalRow = ws.addRow(totalsData)
    for (let c = 1; c <= cols.length; c++) {
      const cell = totalRow.getCell(c)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_PURPLE } }
    }
    totalsColIndices.forEach((colIdx) => {
      const col = cols[colIdx]
      if (col.numFmt) totalRow.getCell(colIdx + 1).numFmt = col.numFmt
    })
  }
}

function getDateRange(data: ExportData): string {
  const dates = [
    ...data.expenses.map((e) => e.date),
    ...data.paychecks.map((p) => p.date),
    ...data.transfers.map((t) => t.date),
    ...data.debtPayments.map((d) => d.date),
    ...data.investmentMovements.map((m) => m.date),
    ...data.settlements.map((s) => s.date),
    ...data.cashEntries.map((c) => c.date),
    ...(data.mortgagePayments ?? []).map((p) => p.date),
  ].filter(Boolean).sort()

  if (dates.length === 0) return '—'
  return dates.length === 1 ? dates[0] : `${dates[0]} → ${dates[dates.length - 1]}`
}

function calcProjectedPayoff(config: MortgageConfig, balance: number): string {
  if (balance <= 0) return 'Paid off'
  const monthlyRate = config.interestRate / 100 / 12
  const months = monthlyRate === 0
    ? Math.ceil(balance / config.minimumPayment)
    : Math.ceil(-Math.log(1 - (balance * monthlyRate) / config.minimumPayment) / Math.log(1 + monthlyRate))

  const payoff = new Date()
  payoff.setMonth(payoff.getMonth() + months)
  return payoff.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

function addSummarySheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('Summary')
  ws.columns = [{ width: 38 }, { width: 28 }]

  function addSectionHeader(title: string) {
    const row = ws.addRow([title, ''])
    ws.mergeCells(`A${row.number}:B${row.number}`)
    const cell = row.getCell(1)
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    row.height = 22
  }

  function addKV(label: string, value: CellValue, numFmt?: string) {
    const row = ws.addRow([`   ${label}`, value])
    row.getCell(1).font = { size: 10 }
    if (numFmt && typeof value === 'number') {
      row.getCell(2).numFmt = numFmt
    }
  }

  const blank = () => ws.addRow(['', ''])

  // --- Export Metadata ---
  addSectionHeader('Export Metadata')
  addKV('Export Date', today())
  addKV('Data Range', getDateRange(data))
  addKV('Expenses', data.expenses.length)
  addKV('Paychecks', data.paychecks.length)
  addKV('Transfers', data.transfers.length)
  addKV('Manual Taxes', data.manualTaxes.length)
  addKV('Debt Payments', data.debtPayments.length)
  addKV('Investment Movements', data.investmentMovements.length)
  addKV('Cash Entries', data.cashEntries.length)
  addKV('Settlements', data.settlements.length)
  blank()

  // --- Net Worth ---
  const totalPortfolio = data.portfolios.reduce((s, p) => s + p.balance, 0)
  const lastMortgagePayment = sortByDateDesc(data.mortgagePayments ?? [])[0]
  const mortgageBalance = lastMortgagePayment?.balanceAfter ?? data.mortgageConfig?.principal ?? 0
  const netWorth = totalPortfolio - mortgageBalance

  addSectionHeader('Net Worth')
  addKV('Portfolio Balance', totalPortfolio, MXN_FMT)
  addKV('Mortgage Balance', mortgageBalance, MXN_FMT)
  addKV('Net Worth (Portfolio − Mortgage)', netWorth, MXN_FMT)
  blank()

  // --- Current Month Snapshot ---
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyIncome =
    data.paychecks.filter((p) => p.date.startsWith(currentMonth)).reduce((s, p) => s + p.mxnAmount, 0) +
    data.transfers.filter((t) => t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = data.expenses.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0)
  const monthlyDebt = data.debtPayments.filter((d) => d.date.startsWith(currentMonth)).reduce((s, d) => s + d.amount, 0)
  const netFlow = monthlyIncome - monthlyExpenses - monthlyDebt

  addSectionHeader(`Current Month (${currentMonth})`)
  addKV('Income', monthlyIncome, MXN_FMT)
  addKV('Expenses', monthlyExpenses, MXN_FMT)
  addKV('Debt Payments', monthlyDebt, MXN_FMT)
  addKV('Net Flow', netFlow, MXN_FMT)
  blank()

  // --- Shared Balance ---
  const lastSettlement = sortByDateDesc(data.settlements)[0]
  const cutoff = lastSettlement?.date ?? '1970-01-01'
  const result = calculateSettlement(
    data.expenses.filter((e) => e.date >= cutoff),
    data.settlements.filter((s) => s.date >= cutoff),
    data.cashEntries.filter((c) => c.date >= cutoff)
  )
  const u1 = data.settings.user1Name
  const u2 = data.settings.user2Name
  const debtorName = result.creditor === 'even' ? '' : resolveUser(result.creditor === 'user1' ? 'user2' : 'user1', data.settings)
  const creditorName = result.creditor === 'even' ? '' : resolveUser(result.creditor, data.settings)
  const statusLabel = result.creditor === 'even' ? 'All settled up' : `${debtorName} owes ${creditorName}`

  addSectionHeader('Shared Balance')
  addKV('Status', statusLabel)
  addKV('Amount Outstanding', result.netSettlement, MXN_FMT)
  addKV(`${u1} Paid (shared)`, result.user1Paid, MXN_FMT)
  addKV(`${u2} Paid (shared)`, result.user2Paid, MXN_FMT)
  addKV('Last Settlement Date', lastSettlement?.date ?? '—')
  blank()

  // --- Top 3 Expense Categories ---
  const categoryTotals = data.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const totalExp = data.expenses.reduce((s, e) => s + e.amount, 0)
  const top3 = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 3)

  addSectionHeader('Top 3 Expense Categories (All Time)')
  for (const [cat, amount] of top3) {
    const pct = totalExp > 0 ? ((amount / totalExp) * 100).toFixed(1) : '0.0'
    addKV(`${cat} (${pct}%)`, amount, MXN_FMT)
  }
  blank()

  // --- Mortgage Snapshot ---
  if (data.mortgageConfig) {
    addSectionHeader('Mortgage Snapshot')
    addKV('Remaining Balance', mortgageBalance, MXN_FMT)
    addKV('Projected Payoff', calcProjectedPayoff(data.mortgageConfig, mortgageBalance))
    addKV('Monthly Minimum', data.mortgageConfig.minimumPayment, MXN_FMT)
    addKV('Interest Rate', data.mortgageConfig.interestRate, '0.00"%"')
  }
}

function addMonthlySummarySheet(wb: ExcelJS.Workbook, data: ExportData) {
  const monthSet = new Set<string>()
  const collect = (items: { date: string }[]) => items.forEach((i) => monthSet.add(i.date.slice(0, 7)))
  collect(data.expenses)
  collect(data.paychecks)
  collect(data.transfers)
  collect(data.debtPayments)

  const months = [...monthSet].sort()
  if (months.length === 0) return

  const ws = wb.addWorksheet('Monthly Summary')
  ws.columns = [{ width: 12 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 14 }]

  const headerRow = ws.addRow(['Month', 'Income', 'Expenses', 'Debt Payments', 'Net Flow'])
  styleHeaderRow(headerRow)
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } }

  const rowsData = months.map((month) => {
    const income =
      data.paychecks.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.mxnAmount, 0) +
      data.transfers.filter((t) => t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0)
    const expenses = data.expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
    const debt = data.debtPayments.filter((d) => d.date.startsWith(month)).reduce((s, d) => s + d.amount, 0)
    const netFlow = income - expenses - debt
    return [month, income, expenses, debt, netFlow] as CellValue[]
  })

  rowsData.forEach((rowData, rowIdx) => {
    const row = ws.addRow(rowData)

    if (rowIdx % 2 === 1) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } }
      }
    }

    for (let c = 2; c <= 5; c++) row.getCell(c).numFmt = MXN_FMT

    const netFlowVal = rowData[4] as number
    const netFlowCell = row.getCell(5)
    if (netFlowVal > 0) {
      netFlowCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_FILL } }
    } else if (netFlowVal < 0) {
      netFlowCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } }
    }
  })

  // Totals row
  const totalIncome = rowsData.reduce((s, r) => s + (r[1] as number), 0)
  const totalExpenses = rowsData.reduce((s, r) => s + (r[2] as number), 0)
  const totalDebt = rowsData.reduce((s, r) => s + (r[3] as number), 0)
  const totalNet = rowsData.reduce((s, r) => s + (r[4] as number), 0)

  const totalRow = ws.addRow(['TOTAL', totalIncome, totalExpenses, totalDebt, totalNet])
  for (let c = 1; c <= 5; c++) {
    totalRow.getCell(c).font = { bold: true }
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_PURPLE } }
  }
  for (let c = 2; c <= 5; c++) totalRow.getCell(c).numFmt = MXN_FMT

  const totalNetCell = totalRow.getCell(5)
  if (totalNet > 0) {
    totalNetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_FILL } }
  } else if (totalNet < 0) {
    totalNetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } }
  }
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'FinanceApp'
  wb.created = new Date()

  const u = (id: 'user1' | 'user2') => resolveUser(id, data.settings)
  const portfolioMap = Object.fromEntries(data.portfolios.map((p) => [p.id, p.name]))

  addSummarySheet(wb, data)
  addMonthlySummarySheet(wb, data)

  addDataSheet(wb, 'Expenses', [
    { header: 'Date',         width: 13, numFmt: DATE_FMT },
    { header: 'Category',     width: 20 },
    { header: 'Sub-Category', width: 18 },
    { header: 'Description',  width: 32 },
    { header: 'Paid By',      width: 14 },
    { header: 'Shared',       width: 9 },
    { header: 'Amount',       width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.expenses).map((e) => [
    parseLocalDate(e.date), e.category, e.subCategory ?? '', e.description,
    u(e.paidBy), e.shared ? 'Yes' : 'No', e.amount,
  ]), [6])

  addDataSheet(wb, 'Paychecks', [
    { header: 'Date',          width: 13, numFmt: DATE_FMT },
    { header: 'MXN Amount',    width: 15, numFmt: MXN_FMT },
    { header: 'USD Amount',    width: 13, numFmt: MXN_FMT },
    { header: 'Exchange Rate', width: 15, numFmt: NUM_FMT },
    { header: 'Gross Amount',  width: 15, numFmt: MXN_FMT },
  ], sortByDateDesc(data.paychecks).map((p) => [
    parseLocalDate(p.date), p.mxnAmount, p.usdAmount ?? null, p.exchangeRate ?? null, p.grossAmount ?? null,
  ]), [1])

  addDataSheet(wb, 'Manual Taxes', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'Description', width: 32 },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.manualTaxes).map((t) => [parseLocalDate(t.date), t.description, t.amount]), [2])

  addDataSheet(wb, 'Transfers', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'Category',    width: 20 },
    { header: 'Description', width: 32 },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.transfers).map((t) => [parseLocalDate(t.date), t.category, t.description, t.amount]), [3])

  addDataSheet(wb, 'Debt Payments', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'Card',        width: 22 },
    { header: 'Description', width: 32 },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.debtPayments).map((d) => [parseLocalDate(d.date), d.card, d.description, d.amount]), [3])

  addDataSheet(wb, 'Portfolios', [
    { header: 'Name',         width: 22 },
    { header: 'Type',         width: 14 },
    { header: 'APY (%)',      width: 10, numFmt: NUM_FMT },
    { header: 'Balance',      width: 16, numFmt: MXN_FMT },
    { header: 'Updated Date', width: 14, numFmt: DATE_FMT },
    { header: 'Renews Date',  width: 14, numFmt: DATE_FMT },
  ], data.portfolios.map((p) => [
    p.name, p.type, p.apy, p.balance, parseLocalDate(p.updatedDate), parseLocalDate(p.renewsDate),
  ]), [3])

  addDataSheet(wb, 'Investment Movements', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'Portfolio',   width: 22 },
    { header: 'Description', width: 32 },
    { header: 'Type',        width: 12 },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.investmentMovements).map((m) => [
    parseLocalDate(m.date), portfolioMap[m.portfolioId] ?? m.portfolioId, m.description, m.type, m.amount,
  ]), [4])

  addDataSheet(wb, 'Cash Entries', [
    { header: 'Date',    width: 13, numFmt: DATE_FMT },
    { header: 'Paid By', width: 14 },
    { header: 'Amount',  width: 14, numFmt: MXN_FMT },
    { header: 'Note',    width: 34 },
  ], sortByDateDesc(data.cashEntries).map((c) => [parseLocalDate(c.date), u(c.paidBy), c.amount, c.note]), [2])

  addDataSheet(wb, 'Settlements', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
    { header: 'Paid By',     width: 14 },
    { header: 'Description', width: 32 },
  ], sortByDateDesc(data.settlements).map((s) => [parseLocalDate(s.date), s.amount, u(s.paidBy), s.description]), [1])

  addDataSheet(wb, 'Mortgage Payments', [
    { header: 'Date',          width: 13, numFmt: DATE_FMT },
    { header: 'Total Paid',    width: 14, numFmt: MXN_FMT },
    { header: 'Extra Capital', width: 15, numFmt: MXN_FMT },
    { header: 'Balance After', width: 15, numFmt: MXN_FMT },
    { header: 'Note',          width: 34 },
  ], sortByDateDesc(data.mortgagePayments ?? []).map((p) => [
    parseLocalDate(p.date), p.totalPaid, p.extraCapital, p.balanceAfter, p.note ?? '',
  ]), [1, 2])

  addDataSheet(wb, 'Mortgage Contributions', [
    { header: 'Date',        width: 13, numFmt: DATE_FMT },
    { header: 'By',          width: 16 },
    { header: 'Description', width: 32 },
    { header: 'Amount',      width: 14, numFmt: MXN_FMT },
  ], sortByDateDesc(data.mortgageContributions ?? []).map((c) => [
    parseLocalDate(c.date), c.by, c.description, c.amount,
  ]), [3])

  const buffer = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `finance-app-${today()}.xlsx`
  )
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function exportToXML(data: ExportData) {
  const portfolioMap = Object.fromEntries(data.portfolios.map((p) => [p.id, p.name]))

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<financeApp exportDate="${today()}">`,

    '  <expenses>',
    ...data.expenses.map((e) =>
      `    <expense date="${e.date}" amount="${e.amount}" category="${escapeXml(e.category)}" paidBy="${e.paidBy}" shared="${e.shared}">${escapeXml(e.description)}</expense>`
    ),
    '  </expenses>',

    '  <paychecks>',
    ...data.paychecks.map((p) =>
      `    <paycheck date="${p.date}" mxnAmount="${p.mxnAmount}" usdAmount="${p.usdAmount ?? ''}" exchangeRate="${p.exchangeRate ?? ''}" grossAmount="${p.grossAmount ?? ''}"/>`
    ),
    '  </paychecks>',

    '  <manualTaxes>',
    ...data.manualTaxes.map((t) =>
      `    <manualTax date="${t.date}" amount="${t.amount}">${escapeXml(t.description)}</manualTax>`
    ),
    '  </manualTaxes>',

    '  <transfers>',
    ...data.transfers.map((t) =>
      `    <transfer date="${t.date}" category="${escapeXml(t.category)}" amount="${t.amount}">${escapeXml(t.description)}</transfer>`
    ),
    '  </transfers>',

    '  <debtPayments>',
    ...data.debtPayments.map((d) =>
      `    <debtPayment date="${d.date}" card="${escapeXml(d.card)}" amount="${d.amount}">${escapeXml(d.description)}</debtPayment>`
    ),
    '  </debtPayments>',

    '  <portfolios>',
    ...data.portfolios.map((p) =>
      `    <portfolio name="${escapeXml(p.name)}" type="${escapeXml(p.type)}" apy="${p.apy}" balance="${p.balance}" updatedDate="${p.updatedDate}" renewsDate="${p.renewsDate}"/>`
    ),
    '  </portfolios>',

    '  <investmentMovements>',
    ...data.investmentMovements.map((m) =>
      `    <movement date="${m.date}" portfolio="${escapeXml(portfolioMap[m.portfolioId] ?? m.portfolioId)}" type="${m.type}" amount="${m.amount}">${escapeXml(m.description)}</movement>`
    ),
    '  </investmentMovements>',

    '  <cashEntries>',
    ...data.cashEntries.map((c) =>
      `    <cashEntry date="${c.date}" amount="${c.amount}" paidBy="${c.paidBy}">${escapeXml(c.note)}</cashEntry>`
    ),
    '  </cashEntries>',

    '  <settlements>',
    ...data.settlements.map((s) =>
      `    <settlement date="${s.date}" amount="${s.amount}" paidBy="${s.paidBy}">${escapeXml(s.description)}</settlement>`
    ),
    '  </settlements>',

    ...(data.mortgageConfig ? [
      `  <mortgageConfig principal="${data.mortgageConfig.principal}" interestRate="${data.mortgageConfig.interestRate}" termMonths="${data.mortgageConfig.termMonths}" startDate="${data.mortgageConfig.startDate}" minimumPayment="${data.mortgageConfig.minimumPayment}"/>`,
    ] : []),

    '  <mortgagePayments>',
    ...(data.mortgagePayments ?? []).map((p) =>
      `    <mortgagePayment date="${p.date}" totalPaid="${p.totalPaid}" extraCapital="${p.extraCapital}" balanceAfter="${p.balanceAfter}" note="${escapeXml(p.note ?? '')}"/>`
    ),
    '  </mortgagePayments>',

    '  <mortgageContributions>',
    ...(data.mortgageContributions ?? []).map((c) =>
      `    <contribution date="${c.date}" by="${escapeXml(c.by)}" amount="${c.amount}">${escapeXml(c.description)}</contribution>`
    ),
    '  </mortgageContributions>',

    '</financeApp>',
  ]

  triggerDownload(new Blob([lines.join('\n')], { type: 'application/xml' }), `finance-app-${today()}.xml`)
}
