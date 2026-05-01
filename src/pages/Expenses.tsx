import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Camera } from 'lucide-react'
import { renderIcon } from '../lib/iconRenderer'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import PeriodTabs from '../components/ui/PeriodTabs'
import SectionTitle from '../components/ui/SectionTitle'
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
    <div>
      <HeroBand color="#aa2d00">
        <div className="flex justify-end gap-2 mb-4 md:mb-0 md:absolute md:top-7 md:right-10">
          <HeroAction variant="ghost" onClick={() => setImportModal(true)}>
            <Camera className="w-3.5 h-3.5 inline mr-1.5" />Import
          </HeroAction>
          <HeroAction variant="primary" onClick={() => { setEditExpense(undefined); setExpenseModal(true) }}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Expense
          </HeroAction>
        </div>
        <div className="mb-6">
          <PeriodTabs mode={periodMode} value={periodValue} onChange={onPeriodChange} variant="light" modes={['month', 'quarter', 'year', 'all', 'range']} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi label="Total Expenses" value={formatMXN(total)} />
          <HeroKpi label="Avg per Month" value={formatMXN(avgPerMonth)} />
          <HeroKpi label="Top Category" value={topCategory.name} sub={formatMXN(topCategory.total)} />
        </div>
      </HeroBand>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
          <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Spending by Category</p>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel="Total" centerValue={formatMXNCompact(total)} height={220} />
          ) : (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No expenses in this period</p>
          )}
        </div>
        {barData.length > 0 ? (
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
            <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">By Category</p>
            <BarChart
              data={barData}
              bars={[{ key: 'Amount', color: '#aa2d00', name: 'Amount' }]}
              xKey="name"
              height={Math.max(200, barData.length * 36)}
              horizontal
              colorKey="color"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5 flex items-center justify-center">
            <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">No data available</p>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      {budgetCats.length > 0 && (
        <div className="mb-8">
          <SectionTitle>Category Budgets</SectionTitle>
          <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5 space-y-3">
            {budgetCats.map((c) => {
              const actual = catTotals[c.id] ?? 0
              const budget = c.budget!
              const pct = Math.min(actual / budget * 100, 100)
              const over = actual > budget
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}18` }}>
                        {renderIcon(c.icon, 'w-3.5 h-3.5', c.color)}
                      </span>
                      <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{c.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: over ? '#c0392b' : '#41454d' }}>
                      {formatMXN(actual)} / {formatMXN(budget)}
                    </span>
                  </div>
                  <div className="h-[6px] rounded-full bg-[#f0f2f5] dark:bg-[#252b3b] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? '#c0392b' : c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters + table */}
      <div className="mb-4">
        <SectionTitle>Transactions</SectionTitle>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {/* Type filter */}
          <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-1 gap-1">
            {(['all', 'shared', 'personal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors capitalize ${
                  typeFilter === t ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm' : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d]" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] focus:outline-none focus:border-[#181d26]"
            />
          </div>

          {/* Category filter */}
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setSubCatFilter('all') }}
            className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {availableSubCats.length > 0 && (
            <select
              value={subCatFilter}
              onChange={(e) => setSubCatFilter(e.target.value)}
              className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
            >
              <option value="all">All Sub-categories</option>
              {availableSubCats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          <span className="text-[12px] text-[#41454d] dark:text-[#9297a0] ml-auto tabular-nums">
            {displayed.length} {displayed.length === 1 ? 'expense' : 'expenses'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Category', 'Description', 'Type', 'Paid By', 'Amount', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No expenses found</td></tr>
                )}
                {displayed.map((e, i) => {
                  const cat = categories.find((c) => c.id === e.category)
                  return (
                    <tr key={e.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-[11px] text-[13px] text-[#41454d] dark:text-[#9297a0] whitespace-nowrap ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(e.date)}</td>
                      <td className={`px-4 py-[11px] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          {renderIcon(cat?.icon ?? 'Tag', 'w-3.5 h-3.5 flex-shrink-0', cat?.color ?? '#9297a0')}
                          <div>
                            <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{cat?.name ?? e.category}</span>
                            {e.subCategory && <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">{e.subCategory}</p>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{e.description}</td>
                      <td className={`px-4 py-[11px] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}><Badge type={e.shared ? 'shared' : 'personal'} /></td>
                      <td className={`px-4 py-[11px] text-[12px] text-[#41454d] dark:text-[#9297a0] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{e.paidBy === 'user1' ? user1Name : user2Name}</td>
                      <td className={`px-4 py-[11px] text-right text-[13px] font-medium text-[#c0392b] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatMXN(e.amount)}</td>
                      <td className={`px-4 py-[11px] ${i < displayed.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditExpense(e); setExpenseModal(true) }}
                            className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExpense(e.id)}
                            className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors"
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
      </div>

      <ExpenseForm open={expenseModal} onClose={() => setExpenseModal(false)} expense={editExpense} />
      <ScreenshotImportModal open={importModal} onClose={() => setImportModal(false)} />
    </div>
  )
}
