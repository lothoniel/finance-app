import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Camera } from 'lucide-react'
import { renderIcon } from '../lib/iconRenderer'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/charts/DonutChart'
import BarChart from '../components/charts/BarChart'
import ExpenseForm from '../components/forms/ExpenseForm'
import ScreenshotImportModal from '../components/forms/ScreenshotImportModal'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Expense } from '../store/types'

export default function Expenses() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'shared' | 'personal'>('all')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [subCatFilter, setSubCatFilter] = useState('all')
  const [expenseModal, setExpenseModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | undefined>()
  const [importModal, setImportModal] = useState(false)

  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.settings.expenseCategories)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const deleteExpense = useStore((s) => s.deleteExpense)

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: periodFiltered } = usePeriodFilter(expenses)

  const filtered = useMemo(() => {
    if (typeFilter === 'shared') return periodFiltered.filter((e) => e.shared)
    if (typeFilter === 'personal') return periodFiltered.filter((e) => !e.shared)
    return periodFiltered
  }, [periodFiltered, typeFilter])

  const availableSubCats = useMemo(() => {
    const subs = filtered
      .filter((e) => catFilter === 'all' || e.category === catFilter)
      .flatMap((e) => e.subCategory ? [e.subCategory] : [])
    return [...new Set(subs)].sort()
  }, [filtered, catFilter])

  const displayed = useMemo(() => {
    return filtered.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || e.category === catFilter
      const matchSubCat = subCatFilter === 'all' || e.subCategory === subCatFilter
      return matchSearch && matchCat && matchSubCat
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [filtered, search, catFilter, subCatFilter])

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const monthCount = useMemo(() => {
    const months = new Set(filtered.map((e) => e.date.slice(0, 7)))
    return Math.max(1, months.size)
  }, [filtered])
  const avgPerMonth = total / monthCount

  const topCategory = useMemo(() => {
    const totals: Record<string, number> = {}
    filtered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    const topId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const cat = categories.find((c) => c.id === topId)
    return { name: cat?.name ?? topId ?? '—', total: topId ? (totals[topId] ?? 0) : 0 }
  }, [filtered, categories])

  const donutData = useMemo(() => {
    const totals: Record<string, number> = {}
    filtered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return categories
      .filter((c) => (totals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: totals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [filtered, categories])

  const barData = useMemo(() => {
    return donutData.map((d) => ({ name: d.name, Amount: d.value, color: d.color }))
  }, [donutData])

  const catTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    filtered.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return totals
  }, [filtered])

  const budgetCats = useMemo(() => {
    return categories.filter((c) => c.budget && c.budget > 0 && (catTotals[c.id] ?? 0) > 0)
  }, [categories, catTotals])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} modes={['month', 'quarter', 'year', 'all', 'range']} />
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
          {(['all', 'shared', 'personal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                typeFilter === t ? 'bg-[#7C3AED] text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setImportModal(true)}
            className="flex items-center gap-2 border border-[#7C3AED] text-[#7C3AED] rounded-full px-4 py-2 text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => { setEditExpense(undefined); setExpenseModal(true) }}
            className="flex items-center gap-2 bg-[#7C3AED] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Expenses" value={formatMXNCompact(total)} accent="#EF4444" />
        <KpiCard title="Avg per Month" value={formatMXNCompact(avgPerMonth)} accent="#F59E0B" />
        <KpiCard
          title="Top Category"
          value={topCategory.name}
          subtitle={formatMXN(topCategory.total)}
          accent="#7C3AED"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-0.5 h-4 rounded-full bg-[#7C3AED]" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Spending by Category</p>
          </div>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              centerLabel="Total"
              centerValue={formatMXNCompact(total)}
              height={220}
            />
          ) : (
            <p className="text-center py-8 text-sm text-gray-400">No expenses in this period</p>
          )}
        </div>

        {barData.length > 0 ? (
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-0.5 h-4 rounded-full bg-[#7C3AED]" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">By Category</p>
            </div>
            <BarChart
              data={barData}
              bars={[{ key: 'Amount', color: '#7C3AED', name: 'Amount' }]}
              xKey="name"
              height={Math.max(200, barData.length * 36)}
              horizontal
              colorKey="color"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm flex items-center justify-center">
            <p className="text-sm text-gray-400">No data available</p>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      {budgetCats.length > 0 && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-0.5 h-4 rounded-full bg-[#7C3AED]" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Category Budgets</p>
          </div>
          <div className="space-y-3">
            {budgetCats.map((c) => {
              const actual = catTotals[c.id] ?? 0
              const budget = c.budget!
              const pct = Math.min(actual / budget * 100, 100)
              const over = actual > budget
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                        {renderIcon(c.icon, 'w-3.5 h-3.5', c.color)}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    </div>
                    <span className={`text-xs font-semibold ${over ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatMXN(actual)} / {formatMXN(budget)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: over ? '#EF4444' : c.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-[#2D3448] rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setSubCatFilter('all') }}
          className="border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {availableSubCats.length > 0 && (
          <select
            value={subCatFilter}
            onChange={(e) => setSubCatFilter(e.target.value)}
            className="border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Sub-categories</option>
            {availableSubCats.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        <span className="text-sm text-gray-400 ml-auto tabular-nums">
          {displayed.length} {displayed.length === 1 ? 'expense' : 'expenses'}
        </span>
      </div>

      {/* Expense table */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Paid By</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
              {displayed.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No expenses found</td></tr>
              )}
              {displayed.map((e) => {
                const cat = categories.find((c) => c.id === e.category)
                return (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color }} />
                        <div>
                          <span className="text-gray-700 dark:text-gray-300 text-xs">{cat?.name ?? e.category}</span>
                          {e.subCategory && (
                            <p className="text-xs text-gray-400">{e.subCategory}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-white">{e.description}</td>
                    <td className="px-5 py-3"><Badge type={e.shared ? 'shared' : 'personal'} /></td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {e.paidBy === 'user1' ? user1Name : user2Name}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-red-500">{formatMXN(e.amount)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditExpense(e); setExpenseModal(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      <ExpenseForm open={expenseModal} onClose={() => setExpenseModal(false)} expense={editExpense} />
      <ScreenshotImportModal open={importModal} onClose={() => setImportModal(false)} />
    </div>
  )
}
