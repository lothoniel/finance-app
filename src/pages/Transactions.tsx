import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import PeriodSelector from '../components/ui/PeriodSelector'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import { sortByDateDesc } from '../lib/filters'
import { formatDate, formatMoneyCompact } from '../lib/formatters'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

type TxType = 'income' | 'shared' | 'personal' | 'debt'

interface TxRow {
  id: string
  date: string
  description: string
  categoryLabel: string
  categoryColor: string
  type: TxType
  amount: number
}

const TYPE_FILTERS = ['all', 'income', 'expenses', 'shared', 'personal', 'debt'] as const
type FilterOption = typeof TYPE_FILTERS[number]

const pillStyle: Record<TxType, string> = {
  income:   'bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#16a34a] dark:text-[#4ade80]',
  shared:   'bg-[#eff6ff] dark:bg-[#1e3a5f] text-[#3b82f6]',
  personal: 'bg-[#f4f5f7] dark:bg-[#252b3b] text-[#9297a0]',
  debt:     'bg-[#fffbeb] dark:bg-[#451a03]/40 text-[#d97706] dark:text-[#fbbf24]',
}

const amountStyle: Record<TxType, string> = {
  income:   'text-[#16a34a]',
  shared:   'text-[#ef4444]',
  personal: 'text-[#ef4444]',
  debt:     'text-[#d97706]',
}

export default function Transactions() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterOption>('all')

  const language = useStore((s) => s.settings.language)
  const currency = useStore((s) => s.settings.currencyDisplay)
  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const categories = useStore((s) => s.settings.expenseCategories)
  const paycheckLabel = t('dashboard.recurring.paycheck')

  const allRows = useMemo<TxRow[]>(() => {
    const rows: TxRow[] = []

    expenses.forEach((e) => {
      const cat = categories.find((c) => c.id === e.category)
      rows.push({
        id: e.id,
        date: e.date,
        description: e.description,
        categoryLabel: cat?.name ?? e.category,
        categoryColor: cat?.color ?? '#9297a0',
        type: e.shared ? 'shared' : 'personal',
        amount: e.amount,
      })
    })

    paychecks.forEach((p) => {
      rows.push({
        id: p.id,
        date: p.date,
        description: paycheckLabel,
        categoryLabel: paycheckLabel,
        categoryColor: '#16a34a',
        type: 'income',
        amount: p.mxnAmount,
      })
    })

    transfers.forEach((t) => {
      rows.push({
        id: t.id,
        date: t.date,
        description: t.description,
        categoryLabel: t.category,
        categoryColor: '#3b82f6',
        type: 'income',
        amount: t.amount,
      })
    })

    debtPayments.forEach((d) => {
      rows.push({
        id: d.id,
        date: d.date,
        description: d.description,
        categoryLabel: d.card,
        categoryColor: '#d97706',
        type: 'debt',
        amount: d.amount,
      })
    })

    return rows
  }, [expenses, paychecks, transfers, debtPayments, categories, paycheckLabel])

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: periodFiltered } =
    usePeriodFilter(allRows, 'month')

  const displayed = useMemo(() => {
    let rows = periodFiltered
    if (typeFilter === 'expenses') rows = rows.filter((r) => r.type === 'shared' || r.type === 'personal')
    else if (typeFilter !== 'all') rows = rows.filter((r) => r.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => r.description.toLowerCase().includes(q) || r.categoryLabel.toLowerCase().includes(q))
    }
    return sortByDateDesc(rows)
  }, [periodFiltered, typeFilter, search])

  const totalIncome = useMemo(
    () => periodFiltered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
    [periodFiltered]
  )
  const totalExpenses = useMemo(
    () => periodFiltered.filter((r) => r.type === 'shared' || r.type === 'personal').reduce((s, r) => s + r.amount, 0),
    [periodFiltered]
  )
  const totalDebt = useMemo(
    () => periodFiltered.filter((r) => r.type === 'debt').reduce((s, r) => s + r.amount, 0),
    [periodFiltered]
  )

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('nav.items.transactions')}</h1>
        <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} modes={['month', 'quarter', 'year']} />
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-6 overflow-x-auto`}>
        <div className="flex-1 min-w-[120px] px-5 py-4">
          <div className="text-[22px] font-bold leading-tight text-[#181d26] dark:text-[#e8eaf0]">{periodFiltered.length}</div>
          <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{t('transactions.kpis.totalEntries')}</div>
        </div>
        <div className="flex-1 min-w-[120px] px-5 py-4">
          <div className="text-[22px] font-bold leading-tight" style={{ color: '#16a34a' }}>{formatMoneyCompact(totalIncome, currency)}</div>
          <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{t('transactions.kpis.income')}</div>
        </div>
        <div className="flex-1 min-w-[120px] px-5 py-4">
          <div className="text-[22px] font-bold leading-tight" style={{ color: '#ef4444' }}>{formatMoneyCompact(totalExpenses, currency)}</div>
          <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{t('transactions.kpis.expenses')}</div>
        </div>
        <div className="flex-1 min-w-[120px] px-5 py-4">
          <div className="text-[22px] font-bold leading-tight" style={{ color: '#d97706' }}>{formatMoneyCompact(totalDebt, currency)}</div>
          <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{t('transactions.kpis.debtPaid')}</div>
        </div>
      </div>

      {/* Table Card */}
      <div className={CARD}>
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-[#e8e8e8] dark:border-[#2d3347]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]" />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] focus:outline-none focus:border-[#181d26]"
            />
          </div>
          <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-1 gap-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  typeFilter === f
                    ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                    : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
                }`}
              >
                {t(`transactions.filters.${f}`)}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-[#9297a0] ml-auto tabular-nums">
            {displayed.length === 1
              ? t('transactions.resultOne', { count: displayed.length })
              : t('transactions.resultOther', { count: displayed.length })}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  { key: 'date', label: t('expenses.table.date') },
                  { key: 'description', label: t('expenses.table.description') },
                  { key: 'category', label: t('expenses.table.category') },
                  { key: 'type', label: t('expenses.table.type') },
                  { key: 'amount', label: t('expenses.table.amount') },
                ].map((h) => (
                  <th
                    key={h.key}
                    className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${h.key === 'amount' ? 'text-right' : 'text-left'}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[13px] text-[#9297a0]">{t('transactions.noTransactions')}</td>
                </tr>
              )}
              {displayed.map((row, i) => {
                const isLast = i === displayed.length - 1
                const border = isLast ? '' : 'border-b border-[#f4f5f7] dark:border-[#252a38]'
                const isIncome = row.type === 'income'
                const amountStr = `${isIncome ? '+' : '−'}${formatMoneyCompact(row.amount, currency)}`
                return (
                  <tr key={row.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-3 text-[13px] text-[#9297a0] whitespace-nowrap ${border}`}>{formatDate(row.date, language)}</td>
                    <td className={`px-4 py-3 text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{row.description}</td>
                    <td className={`px-4 py-3 ${border}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.categoryColor }} />
                        <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{row.categoryLabel}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${border}`}>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pillStyle[row.type]}`}>
                        {t(`transactions.types.${row.type}`)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right text-[13px] font-semibold tabular-nums ${amountStyle[row.type]} ${border}`}>
                      {amountStr}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
