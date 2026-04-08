import { generateId } from '../lib/id'
import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { renderIcon } from '../lib/iconRenderer'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/charts/DonutChart'
import BarChart from '../components/charts/BarChart'
import ExpenseForm from '../components/forms/ExpenseForm'
import { filterByPeriod, groupByMonth, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import type { Expense } from '../store/types'
import Modal from '../components/ui/Modal'

function now(): PeriodValue {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export default function Expenses() {
  const [tab, setTab] = useState('overview')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(now())
  const [typeFilter, setTypeFilter] = useState<'all' | 'shared' | 'personal'>('all')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [expenseModal, setExpenseModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | undefined>()
  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleDesc, setSettleDesc] = useState('')
  const [settlePaidBy, setSettlePaidBy] = useState<'user1' | 'user2'>('user2')

  const expenses = useStore((s) => s.expenses)
  const settlements = useStore((s) => s.settlements)
  const categories = useStore((s) => s.settings.expenseCategories)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const deleteExpense = useStore((s) => s.deleteExpense)
  const addSettlement = useStore((s) => s.addSettlement)

  const filtered = useMemo(() => {
    let result = filterByPeriod(expenses, periodMode, periodValue)
    if (typeFilter === 'shared') result = result.filter((e) => e.shared)
    if (typeFilter === 'personal') result = result.filter((e) => !e.shared)
    return result
  }, [expenses, periodMode, periodValue, typeFilter])

  const displayed = useMemo(() => {
    return filtered.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || e.category === catFilter
      return matchSearch && matchCat
    })
  }, [filtered, search, catFilter])

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

  const settlement = calculateSettlement(filtered, settlements)


  function handleSettle(e: React.FormEvent) {
    e.preventDefault()
    addSettlement({
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      amount: parseFloat(settleAmount) || 0,
      paidBy: settlePaidBy,
      description: settleDesc,
    })
    setSettleOpen(false)
    setSettleAmount('')
    setSettleDesc('')
    setSettlePaidBy('user2')
  }

  const grouped = useMemo(() => groupByMonth(displayed), [displayed])
  const groupedKeys = Object.keys(grouped).sort().reverse()

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'analysis', label: 'Analysis' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Shared controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <PeriodSelector mode={periodMode} value={periodValue} onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }} />
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
          {(['all', 'shared', 'personal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                typeFilter === t ? 'bg-[#6B3FA0] text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <>
            <button
              onClick={() => { setEditExpense(undefined); setExpenseModal(true) }}
              className="flex items-center gap-2 bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Expenses" value={formatMXNCompact(total)} accent="#EF4444" />
        <KpiCard title="Avg per Month" value={formatMXNCompact(avgPerMonth)} accent="#F59E0B" />
        <KpiCard
          title="Top Category"
          value={topCategory.name}
          subtitle={formatMXN(topCategory.total)}
          accent="#6B3FA0"
        />
      </div>

      {tab === 'overview' && (
        <>
          {/* Category Budgets */}
          {(() => {
            const catTotals: Record<string, number> = {}
            filtered.forEach((e) => { catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount })
            const budgetCats = categories.filter((c) => c.budget && c.budget > 0 && (catTotals[c.id] ?? 0) > 0)
            if (budgetCats.length === 0) return null
            return (
              <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Category Budgets</p>
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
            )
          })()}

          {/* Search + filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-[#2D3448] rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

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
                  {displayed.sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                    const cat = categories.find((c) => c.id === e.category)
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                            <span className="text-gray-700 dark:text-gray-300 text-xs">{cat?.name ?? e.category}</span>
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
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#6B3FA0] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
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
        </>
      )}

      {tab === 'analysis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut */}
            <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Spending by Category</p>
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

            {/* Settlement Card */}
            <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Settlement Breakdown</p>
              <div className="space-y-3">
                {[
                  { label: `${user1Name} Paid`, value: settlement.user1Paid, color: '#6B3FA0' },
                  { label: `${user2Name} Paid`, value: settlement.user2Paid, color: '#3B82F6' },
                  { label: 'Each Owes', value: settlement.perPerson, color: '#F59E0B' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{formatMXN(value)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Settlement</span>
                    <span className="text-lg font-bold text-[#6B3FA0]">{formatMXN(settlement.netSettlement)}</span>
                  </div>
                  {settlement.creditor !== 'even' && (
                    <p className="text-xs text-gray-400 mt-1">
                      {settlement.creditor === 'user1' ? user2Name : user1Name} owes{' '}
                      {settlement.creditor === 'user1' ? user1Name : user2Name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSettleOpen(true)}
                className="w-full mt-4 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#5a3490] transition-colors"
              >
                Settle Up
              </button>
            </div>
          </div>

          {/* Horizontal Bar */}
          {barData.length > 0 && (
            <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Spending Trends by Category</p>
              <BarChart
                data={barData}
                bars={[{ key: 'Amount', color: '#6B3FA0', name: 'Amount' }]}
                xKey="name"
                height={Math.max(200, barData.length * 36)}
                horizontal
                colorKey="color"
              />
            </div>
          )}

          {/* Date grouped list */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-[#2D3448] rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {groupedKeys.map((month) => {
            const items = grouped[month] ?? []
            const monthTotal = items.reduce((s, e) => s + e.amount, 0)
            const [y, m] = month.split('-').map(Number)
            const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
            return (
              <div key={month} className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#2D3448] bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm font-bold text-red-500">{formatMXN(monthTotal)}</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                  {[...items].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                    const cat = categories.find((c) => c.id === e.category)
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat?.color}20` }}>
                          {cat ? renderIcon(cat.icon, 'w-4 h-4', cat.color) : null}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{e.description}</p>
                          <p className="text-xs text-gray-400">{formatDate(e.date)} · {cat?.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-red-500">{formatMXN(e.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ExpenseForm open={expenseModal} onClose={() => setExpenseModal(false)} expense={editExpense} />

      <Modal open={settleOpen} onClose={() => setSettleOpen(false)} title="Record Settlement">
        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid By</label>
            <select value={settlePaidBy} onChange={(e) => setSettlePaidBy(e.target.value as 'user1' | 'user2')}
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]">
              <option value="user1">{user1Name}</option>
              <option value="user2">{user2Name}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (MXN)</label>
            <input type="number" min="0" step="0.01" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} required
              placeholder={formatMXN(settlement.netSettlement)}
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" value={settleDesc} onChange={(e) => setSettleDesc(e.target.value)}
              placeholder="Settlement description"
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSettleOpen(false)} className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium">Record</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
