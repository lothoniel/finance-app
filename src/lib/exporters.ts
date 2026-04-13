import * as XLSX from 'xlsx'
import { formatDate, today } from './formatters'
import type {
  Expense,
  Paycheck,
  ManualTax,
  Transfer,
  DebtPayment,
  Portfolio,
  InvestmentMovement,
  Settlement,
  MortgageConfig,
  MortgagePayment,
  MortgageContribution,
} from '../store/types'

interface ExportData {
  expenses: Expense[]
  paychecks: Paycheck[]
  manualTaxes: ManualTax[]
  transfers: Transfer[]
  debtPayments: DebtPayment[]
  portfolios: Portfolio[]
  investmentMovements: InvestmentMovement[]
  settlements: Settlement[]
  mortgageConfig?: MortgageConfig
  mortgagePayments?: MortgagePayment[]
  mortgageContributions?: MortgageContribution[]
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((w) => ({ wch: w }))
}

export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new()

  const expenses = data.expenses.map((e) => ({
    Date: formatDate(e.date),
    Description: e.description,
    Amount: e.amount,
    Category: e.category,
    'Sub-Category': e.subCategory ?? '',
    'Paid By': e.paidBy,
    Shared: e.shared ? 'Yes' : 'No',
  }))

  const paychecks = data.paychecks.map((p) => ({
    Date: formatDate(p.date),
    'MXN Amount': p.mxnAmount,
    'USD Amount': p.usdAmount ?? '',
    'Exchange Rate': p.exchangeRate ?? '',
    'Gross Amount': p.grossAmount ?? '',
  }))

  const manualTaxes = data.manualTaxes.map((t) => ({
    Date: formatDate(t.date),
    Description: t.description,
    Amount: t.amount,
  }))

  const transfers = data.transfers.map((t) => ({
    Date: formatDate(t.date),
    Category: t.category,
    Description: t.description,
    Amount: t.amount,
  }))

  const debtPayments = data.debtPayments.map((d) => ({
    Date: formatDate(d.date),
    Card: d.card,
    Description: d.description,
    Amount: d.amount,
  }))

  const portfolios = data.portfolios.map((p) => ({
    Name: p.name,
    Type: p.type,
    'APY (%)': p.apy,
    Balance: p.balance,
    'Updated Date': formatDate(p.updatedDate),
    'Renews Date': formatDate(p.renewsDate),
  }))

  const portfolioMap = Object.fromEntries(data.portfolios.map((p) => [p.id, p.name]))
  const movements = data.investmentMovements.map((m) => ({
    Date: formatDate(m.date),
    Portfolio: portfolioMap[m.portfolioId] ?? m.portfolioId,
    Description: m.description,
    Type: m.type,
    Amount: m.amount,
  }))

  const settlements = data.settlements.map((s) => ({
    Date: formatDate(s.date),
    Amount: s.amount,
    'Paid By': s.paidBy,
    Description: s.description,
  }))

  const mortgagePayments = (data.mortgagePayments ?? []).map((p) => ({
    Date: formatDate(p.date),
    'Total Paid': p.totalPaid,
    'Extra Capital': p.extraCapital,
    'Balance After': p.balanceAfter,
    Note: p.note ?? '',
  }))

  const mortgageContributions = (data.mortgageContributions ?? []).map((c) => ({
    Date: formatDate(c.date),
    By: c.by,
    Description: c.description,
    Amount: c.amount,
  }))

  type SheetDef = { name: string; rows: object[]; widths: number[]; emptyHeaders?: string[] }
  const sheets: SheetDef[] = [
    { name: 'Expenses',             rows: expenses,             widths: [12, 30, 12, 18, 18, 10, 8] },
    { name: 'Paychecks',            rows: paychecks,            widths: [12, 14, 12, 14, 14] },
    { name: 'Manual Taxes',         rows: manualTaxes,          widths: [12, 30, 12] },
    { name: 'Transfers',            rows: transfers,            widths: [12, 18, 30, 12] },
    { name: 'Debt Payments',        rows: debtPayments,         widths: [12, 20, 30, 12] },
    { name: 'Portfolios',           rows: portfolios,           widths: [20, 12, 8, 14, 14, 14] },
    { name: 'Investment Movements', rows: movements,            widths: [12, 20, 30, 10, 12] },
    { name: 'Settlements',          rows: settlements,          widths: [12, 12, 10, 30] },
    { name: 'Mortgage Payments',    rows: mortgagePayments,     widths: [12, 14, 14, 14, 30], emptyHeaders: ['Date', 'Total Paid', 'Extra Capital', 'Balance After', 'Note'] },
    { name: 'Mortgage Contributions', rows: mortgageContributions, widths: [12, 14, 30, 12], emptyHeaders: ['Date', 'By', 'Description', 'Amount'] },
  ]

  for (const { name, rows, widths, emptyHeaders } of sheets) {
    const ws = (emptyHeaders && rows.length === 0)
      ? XLSX.utils.aoa_to_sheet([emptyHeaders])
      : XLSX.utils.json_to_sheet(rows)
    setColWidths(ws, widths)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `finance-app-${today()}.xlsx`)
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
