import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Camera } from 'lucide-react'
import { addMonths, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import DonutChart from '../components/charts/DonutChart'
import ExpenseForm from '../components/forms/ExpenseForm'
import ScreenshotImportModal from '../components/forms/ScreenshotImportModal'
import PeriodSelector from '../components/ui/PeriodSelector'
import InfoTooltip from '../components/ui/InfoTooltip'
import { formatMoney, formatMoneyCompact, formatDate } from '../lib/formatters'
import { sortByDateDesc } from '../lib/filters'
import { PERIOD_SCALE } from '../lib/constants'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Expense, RecurringExpense, Language } from '../store/types'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'

type BottomTab = 'transactions' | 'recurring'

const FREQ_MONTHS: Record<string, number> = { monthly: 1, bimonthly: 2, annual: 12 }

function calcNextDate(lastDate: string, frequency: string, language: Language): string {
  try {
    const next = addMonths(parseISO(lastDate), FREQ_MONTHS[frequency] ?? 1)
    return formatDate(next.toISOString().slice(0, 10), language)
  } catch {
    return '—'
  }
}

export default function Expenses() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'shared' | 'personal'>('all')
  const [bottomTab, setBottomTab] = useState<BottomTab>('transactions')
  const [expenseModal, setExpenseModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | undefined>()
  const [editRecurring, setEditRecurring] = useState<RecurringExpense | undefined>()
  const [importModal, setImportModal] = useState(false)

  const language = useStore((s) => s.settings.language)
  const currency = useStore((s) => s.settings.currencyDisplay)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.settings.expenseCategories)
  const recurringExpenses = useStore((s) => s.recurringExpenses)
  const deleteExpense = useStore((s) => s.deleteExpense)
  const deleteRecurringExpense = useStore((s) => s.deleteRecurringExpense)

  const { mode, value, onChange, filtered: periodFiltered } = usePeriodFilter(expenses, 'month')

  const displayed = useMemo(() => {
    return sortByDateDesc(periodFiltered.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || e.category === catFilter
      const matchType = typeFilter === 'all' || (typeFilter === 'shared' ? e.shared : !e.shared)
      return matchSearch && matchCat && matchType
    }))
  }, [periodFiltered, search, catFilter, typeFilter])

  // KPIs
  const total = periodFiltered.reduce((s, e) => s + e.amount, 0)

  const topCategory = useMemo(() => {
    const totals: Record<string, number> = {}
    periodFiltered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    const topId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const cat = categories.find((c) => c.id === topId)
    return { name: cat?.name ?? '—', total: topId ? (totals[topId] ?? 0) : 0 }
  }, [periodFiltered, categories])

  const activeCategories = useMemo(() => {
    const ids = new Set(periodFiltered.map((e) => e.category))
    return ids.size
  }, [periodFiltered])

  // Chart data
  const donutData = useMemo(() => {
    const totals: Record<string, number> = {}
    periodFiltered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return categories
      .filter((c) => (totals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: totals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [periodFiltered, categories])

  const maxCatValue = donutData[0]?.value ?? 1

  // Budget data
  const catTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    periodFiltered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return totals
  }, [periodFiltered])

  const scale = PERIOD_SCALE[mode] ?? 1

  const budgetCats = useMemo(() => {
    return categories.filter((c) => c.budget && c.budget > 0)
  }, [categories])

  function openAddExpense() {
    setEditExpense(undefined)
    setEditRecurring(undefined)
    setExpenseModal(true)
  }

  function openEditExpense(e: Expense) {
    setEditRecurring(undefined)
    setEditExpense(e)
    setExpenseModal(true)
  }

  function openEditRecurring(r: RecurringExpense) {
    setEditExpense(undefined)
    setEditRecurring(r)
    setExpenseModal(true)
  }

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('expenses.title')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector mode={mode} value={value} modes={['month', 'quarter', 'year', 'all', 'range']} onChange={onChange} />
          <button
            onClick={() => setImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />{t('expenses.import')}
          </button>
          <button
            onClick={openAddExpense}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />{t('expenses.addExpense')}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {(() => {
          const labelWithTip = (text: string, tipKey: string) => (
            <span className="inline-flex items-center gap-1 align-middle">
              {text}
              <InfoTooltip content={t(tipKey)} />
            </span>
          )
          const tiles: Array<{ key: string; label: React.ReactNode; value: string; color: string }> = [
            { key: 'total', label: labelWithTip(t('expenses.kpis.total'), 'tooltips.expenses.total'), value: formatMoneyCompact(total, currency), color: '#ef4444' },
            { key: 'topCategory', label: t('expenses.kpis.topCategory'), value: topCategory.name, color: '#181d26' },
            { key: 'topAmount', label: t('expenses.kpis.topAmount'), value: formatMoneyCompact(topCategory.total, currency), color: '#ef4444' },
            { key: 'activeCategories', label: t('expenses.kpis.activeCategories'), value: t('expenses.kpis.activeCount', { count: activeCategories }), color: '#22c55e' },
          ]
          return tiles.map((kpi) => (
          <div key={kpi.key} className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold dark:text-[#e8eaf0]" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
          </div>
          ))
        })()}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">
        {/* Spending by Category */}
        <div className={CARD}>
          <div className="p-5">
            <div className={SECTION_LABEL}>{t('expenses.sections.spendingByCategory')}</div>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} centerLabel={t('expenses.sections.donutTotal')} centerValue={formatMoneyCompact(total, currency)} height={180} />
            ) : (
              <p className="text-[13px] text-[#9297a0] py-8 text-center">{t('expenses.empty.noExpensesPeriod')}</p>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={CARD}>
          <div className="p-5">
            <div className={SECTION_LABEL}>{t('expenses.sections.categoryBreakdown')}</div>
            {donutData.length > 0 ? (
              <div className="space-y-3">
                {donutData.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0] truncate">{d.name}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] ml-2 flex-shrink-0">
                        {formatMoneyCompact(d.value, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f4f5f7] dark:bg-[#252a38] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.value / maxCatValue) * 100}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#9297a0] py-8 text-center">{t('expenses.empty.noDataPeriod')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      {budgetCats.length > 0 && (
        <div className={`${CARD} mb-5`}>
          <div className="p-5">
            <div className={SECTION_LABEL}>
              <span className="inline-flex items-center gap-1 align-middle">
                {t('expenses.sections.categoryBudgets')}
                <InfoTooltip content={t('tooltips.expenses.categoryBudgets')} />
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {budgetCats.map((c) => {
                const actual = catTotals[c.id] ?? 0
                const budget = c.budget! * scale
                const pct = Math.min((actual / budget) * 100, 100)
                const over = actual > budget
                const diff = Math.abs(actual - budget)
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: over ? '#ef4444' : c.color }} />
                        <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{c.name}</span>
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: over ? '#ef4444' : '#41454d' }}>
                        {formatMoneyCompact(actual, currency)} / {formatMoneyCompact(budget, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f4f5f7] dark:bg-[#252a38] rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : c.color }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#9297a0]">{t('dashboard.budget.percentUsed', { pct: pct.toFixed(0) })}</span>
                      <span style={{ color: over ? '#ef4444' : '#22c55e' }}>
                        {over
                          ? t('dashboard.budget.over', { amount: formatMoneyCompact(diff, currency) })
                          : t('dashboard.budget.left', { amount: formatMoneyCompact(diff, currency) })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tabs */}
      <div className={CARD}>
        {/* Tab bar */}
        <div className="flex border-b border-[#e8e8e8] dark:border-[#2d3347]">
          {(['transactions', 'recurring'] as BottomTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`px-4 py-2.5 text-[14px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                bottomTab === tab
                  ? 'border-[#181d26] dark:border-[#e8eaf0] text-[#181d26] dark:text-[#e8eaf0]'
                  : 'border-transparent text-[#6b7280] hover:text-[#374151] dark:hover:text-[#9297a0]'
              }`}
            >
              {t(`expenses.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {bottomTab === 'transactions' && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap p-4 border-b border-[#e8e8e8] dark:border-[#2d3347]">
              {/* Type filter */}
              <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-1 gap-1">
                {(['all', 'shared', 'personal'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTypeFilter(tf)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      typeFilter === tf
                        ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                        : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
                    }`}
                  >
                    {t(`expenses.filters.${tf}`)}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]" />
                <input
                  type="text"
                  placeholder={t('expenses.filters.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] focus:outline-none focus:border-[#181d26]"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
              >
                <option value="all">{t('expenses.filters.allCategories')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="text-[12px] text-[#9297a0] ml-auto tabular-nums">
                {displayed.length === 1
                  ? t('expenses.filters.expenseOne', { count: displayed.length })
                  : t('expenses.filters.expenseOther', { count: displayed.length })}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {([
                      { key: 'date', label: t('expenses.table.date') as React.ReactNode },
                      { key: 'category', label: t('expenses.table.category') as React.ReactNode },
                      { key: 'description', label: t('expenses.table.description') as React.ReactNode },
                      {
                        key: 'type',
                        label: (
                          <span className="inline-flex items-center gap-1 align-middle">
                            {t('expenses.table.type')}
                            <InfoTooltip content={t('tooltips.expenses.typeColumn')} />
                          </span>
                        ) as React.ReactNode,
                      },
                      { key: 'amount', label: t('expenses.table.amount') as React.ReactNode },
                      { key: 'actions', label: '' as React.ReactNode },
                    ]).map((h) => (
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
                    <tr><td colSpan={6} className="text-center py-8 text-[13px] text-[#9297a0]">{t('expenses.empty.noExpensesFound')}</td></tr>
                  )}
                  {displayed.map((e, i) => {
                    const cat = categories.find((c) => c.id === e.category)
                    const isLast = i === displayed.length - 1
                    const border = isLast ? '' : 'border-b border-[#f4f5f7] dark:border-[#252a38]'
                    return (
                      <tr key={e.id} className="group hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                        <td className={`px-4 py-3 text-[13px] text-[#9297a0] whitespace-nowrap ${border}`}>{formatDate(e.date, language)}</td>
                        <td className={`px-4 py-3 ${border}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color ?? '#9297a0' }} />
                            <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{cat?.name ?? e.category}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{e.description}</td>
                        <td className={`px-4 py-3 ${border}`}>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            e.shared
                              ? 'bg-[#eff6ff] dark:bg-[#1e3a5f] text-[#3b82f6]'
                              : 'bg-[#f4f5f7] dark:bg-[#252b3b] text-[#9297a0]'
                          }`}>
                            {e.shared ? t('expenses.badges.shared') : t('expenses.badges.personal')}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-[13px] font-semibold text-[#ef4444] ${border}`}>{formatMoney(e.amount, currency)}</td>
                        <td className={`px-4 py-3 ${border}`}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditExpense(e)}
                              className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteExpense(e.id)}
                              className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#ef4444] hover:bg-[#fdecea] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recurring */}
        {bottomTab === 'recurring' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {[
                    { key: 'name', label: t('expenses.table.name') },
                    { key: 'frequency', label: t('expenses.table.frequency') },
                    { key: 'nextDate', label: t('expenses.table.nextDate') },
                    { key: 'amount', label: t('expenses.table.amount') },
                    { key: 'status', label: t('expenses.table.status') },
                    { key: 'actions', label: '' },
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
                {recurringExpenses.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[13px] text-[#9297a0]">{t('expenses.empty.noRecurringYet')}</td></tr>
                )}
                {recurringExpenses.map((r, i) => {
                  const isLast = i === recurringExpenses.length - 1
                  const border = isLast ? '' : 'border-b border-[#f4f5f7] dark:border-[#252a38]'
                  return (
                    <tr key={r.id} className="group hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-3 text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{r.name}</td>
                      <td className={`px-4 py-3 text-[13px] text-[#9297a0] ${border}`}>{t(`expenses.frequency.${r.frequency}`)}</td>
                      <td className={`px-4 py-3 text-[13px] text-[#9297a0] ${border}`}>{calcNextDate(r.lastDate, r.frequency, language)}</td>
                      <td className={`px-4 py-3 text-right text-[13px] font-semibold text-[#ef4444] ${border}`}>{formatMoney(r.amount, currency)}</td>
                      <td className={`px-4 py-3 ${border}`}>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          r.status === 'active'
                            ? 'bg-[#f0fdf4] dark:bg-[#14532d]/30 text-[#22c55e]'
                            : 'bg-[#f4f5f7] dark:bg-[#252b3b] text-[#9297a0]'
                        }`}>
                          {r.status === 'active' ? t('expenses.badges.active') : t('expenses.badges.paused')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${border}`}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditRecurring(r)}
                            className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRecurringExpense(r.id)}
                            className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#ef4444] hover:bg-[#fdecea] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseForm
        open={expenseModal}
        onClose={() => { setExpenseModal(false); setEditRecurring(undefined) }}
        expense={editExpense}
        editRecurring={editRecurring}
      />
      <ScreenshotImportModal open={importModal} onClose={() => setImportModal(false)} />
    </div>
  )
}
