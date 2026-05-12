import { useState, useMemo } from 'react'
import LZString from 'lz-string'
import { Search } from 'lucide-react'
import DonutChart from '../components/charts/DonutChart'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import { sortByDateDesc } from '../lib/filters'
import { renderIcon } from '../lib/iconRenderer'
import type { Expense, CashEntry, Settlement } from '../store/types'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  budget?: number
}

interface BalanceSnapshot {
  v: 1
  createdAt: string
  user1Name: string
  user2Name: string
  splitRatio: number
  lastSettlementDate: string | null
  expenses: Expense[]
  cashEntries: CashEntry[]
  settlements: Settlement[]
  categories: Category[]
}

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

export default function SharedBalanceView() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [paidByFilter, setPaidByFilter] = useState<'all' | 'user1' | 'user2'>('all')

  const snapshot = useMemo<BalanceSnapshot | null>(() => {
    const raw = new URLSearchParams(window.location.search).get('d') ?? ''
    if (!raw) return null
    try {
      let json = LZString.decompressFromEncodedURIComponent(raw)
      if (!json) {
        try {
          json = LZString.decompressFromEncodedURIComponent(decodeURIComponent(raw))
        } catch {
          // decodeURIComponent threw on malformed input — give up
        }
      }
      if (!json) return null
      return JSON.parse(json) as BalanceSnapshot
    } catch {
      return null
    }
  }, [])

  const settlement = useMemo(() => {
    if (!snapshot) return null
    return calculateSettlement(snapshot.expenses, snapshot.settlements, snapshot.cashEntries, snapshot.splitRatio)
  }, [snapshot])

  const recentShared = useMemo(() => {
    if (!snapshot) return []
    return sortByDateDesc(snapshot.expenses.filter((e) => e.shared))
  }, [snapshot])

  const displayedShared = useMemo(() => {
    return recentShared.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || e.category === catFilter
      const matchPaidBy = paidByFilter === 'all' || e.paidBy === paidByFilter
      return matchSearch && matchCat && matchPaidBy
    })
  }, [recentShared, search, catFilter, paidByFilter])

  const displayedUser1Total = displayedShared.filter(e => e.paidBy === 'user1').reduce((s, e) => s + e.amount, 0)
  const displayedUser2Total = displayedShared.filter(e => e.paidBy === 'user2').reduce((s, e) => s + e.amount, 0)

  const chartData = useMemo(() => {
    if (!snapshot) return []
    const totals: Record<string, number> = {}
    displayedShared.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return snapshot.categories
      .filter((c) => (totals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: totals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [displayedShared, snapshot])

  const chartTotal = displayedShared.reduce((s, e) => s + e.amount, 0)
  const maxChartValue = chartData[0]?.value ?? 1

  if (!snapshot || !settlement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7] dark:bg-[#13161f]">
        <div className="text-center">
          <p className="text-[16px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-2">Invalid or expired snapshot</p>
          <p className="text-[13px] text-[#9297a0]">This link may be corrupted or incomplete.</p>
        </div>
      </div>
    )
  }

  const { user1Name, user2Name, splitRatio, lastSettlementDate, categories, cashEntries, settlements: snapshotSettlements } = snapshot

  const netLabel = settlement.creditor === 'even'
    ? 'All settled up!'
    : settlement.creditor === 'user1'
    ? `${user2Name} owes ${user1Name}`
    : `${user1Name} owes ${user2Name}`

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#13161f]">
      {/* Snapshot banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-6 py-2 text-[12px] text-amber-700 dark:text-amber-300 text-center">
        View-only snapshot · Created {formatDate(snapshot.createdAt.slice(0, 10))}
      </div>

      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Shared Balance</h1>
        </div>

        {/* KPI Strip */}
        <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
          <div className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(settlement.totalShared)}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">TOTAL SHARED</div>
            <div className="text-[11px] text-[#9297a0] mt-0.5">{lastSettlementDate ? `Since ${formatDate(lastSettlementDate)}` : 'All time'}</div>
          </div>
          <div className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{Math.round(splitRatio * 100)}/{Math.round((1 - splitRatio) * 100)}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">SPLIT RATIO</div>
            <div className="text-[11px] text-[#9297a0] mt-0.5">{user1Name} / {user2Name}</div>
          </div>
          <div className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold" style={{ color: settlement.creditor === 'even' ? '#1a7a3c' : '#c0392b' }}>
              {formatMXN(settlement.netSettlement)}
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">NET SETTLEMENT</div>
            <div className="text-[11px] text-[#9297a0] mt-0.5">{netLabel}</div>
          </div>
        </div>

        {/* Individual Ledgers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {[
            { name: user1Name, paid: settlement.user1Paid, owes: settlement.user1Owes, counterOwes: settlement.user2Owes, shouldPay: settlement.user1ShouldPay, pct: Math.round(splitRatio * 100) },
            { name: user2Name, paid: settlement.user2Paid, owes: settlement.user2Owes, counterOwes: settlement.user1Owes, shouldPay: settlement.user2ShouldPay, pct: Math.round((1 - splitRatio) * 100) },
          ].map(({ name, paid, owes, counterOwes, shouldPay, pct }) => (
            <div key={name} className={`${CARD} p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#f0f2f5] dark:bg-[#252b3b] flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{name.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{name}</h3>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Total Paid (Shared)', value: formatMXN(paid) },
                  { label: `Share (${pct}%)`, value: formatMXN(shouldPay) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[13px] text-[#41454d] dark:text-[#9297a0]">{label}</span>
                    <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#e8e8e8] dark:border-[#2d3347] pt-2">
                  <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">
                    {owes > 0 ? 'Still Owes' : 'Is Owed'}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: owes > 0 ? '#c0392b' : '#1a7a3c' }}>
                    {formatMXN(owes > 0 ? owes : counterOwes)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-8">
            <div className={CARD}>
              <div className="p-5">
                <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4">Spending by Category</div>
                <DonutChart data={chartData} centerLabel="Total" centerValue={formatMXNCompact(chartTotal)} height={180} />
              </div>
            </div>
            <div className={CARD}>
              <div className="p-5">
                <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4">Category Breakdown</div>
                <div className="space-y-3">
                  {chartData.map((d) => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0] truncate">{d.name}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] ml-2 flex-shrink-0">
                          {formatMXNCompact(d.value)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#f4f5f7] dark:bg-[#252a38] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / maxChartValue) * 100}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared Expenses */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">
              Shared Expenses Since Last Settlement
              {recentShared.length > 0 && (
                <span className="ml-1.5 text-[12px] font-normal text-[#9297a0]">
                  ({displayedShared.length}{displayedShared.length !== recentShared.length ? `/${recentShared.length}` : ''})
                </span>
              )}
            </span>
            <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
          </div>
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center gap-3 flex-wrap p-4 border-b border-[#e8e8e8] dark:border-[#2d3347]">
              <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full p-1 gap-1">
                {(['all', 'user1', 'user2'] as const).map((v) => (
                  <button key={v} onClick={() => setPaidByFilter(v)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      paidByFilter === v
                        ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                        : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
                    }`}>
                    {v === 'all' ? 'All' : v === 'user1' ? user1Name : user2Name}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]" />
                <input type="text" placeholder="Search expenses..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] focus:outline-none focus:border-[#181d26]"
                />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]">
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="text-[12px] text-[#9297a0] ml-auto tabular-nums">
                {displayedShared.length} {displayedShared.length === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Date', 'Description', 'Category', 'Paid By', 'Amount'].map((h, i) => (
                      <th key={i} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentShared.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No shared expenses since last settlement</td></tr>
                  )}
                  {recentShared.length > 0 && displayedShared.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No expenses match your filters</td></tr>
                  )}
                  {displayedShared.map((e, i, arr) => {
                    const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                    const cat = categories.find(c => c.id === e.category)
                    return (
                      <tr key={i} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                        <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${border}`}>{formatDate(e.date)}</td>
                        <td className={`px-4 py-3 text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{e.description}</td>
                        <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-[4px] flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${cat?.color ?? '#9297a0'}18` }}>
                              {renderIcon(cat?.icon ?? 'Tag', 'w-3 h-3', cat?.color ?? '#9297a0')}
                            </span>
                            <span>{cat?.name ?? e.category}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${border}`}>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            e.paidBy === 'user1'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                          }`}>
                            {e.paidBy === 'user1' ? user1Name : user2Name}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right ${border}`}>
                          <span className={e.amount > 1000
                            ? 'text-[13px] font-bold text-[#c0392b] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full'
                            : 'text-[13px] font-medium text-[#c0392b]'}>
                            {formatMXN(e.amount)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {displayedShared.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#e8e8e8] dark:border-[#2d3347] bg-[#f8fafc] dark:bg-[#1a1f2e]">
                      <td colSpan={3} className="px-4 py-2.5 text-[11px] font-semibold text-[#9297a0] uppercase tracking-wider">Totals</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-blue-600 dark:text-blue-300">{user1Name}: {formatMXN(displayedUser1Total)}</span>
                          <span className="text-[11px] text-violet-600 dark:text-violet-300">{user2Name}: {formatMXN(displayedUser2Total)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[13px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{formatMXN(displayedUser1Total + displayedUser2Total)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Cash Entries */}
        {cashEntries.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Cash Entries</span>
              <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
            </div>
            <div className={`${CARD} divide-y divide-[#e8e8e8] dark:divide-[#2d3347]`}>
              {sortByDateDesc(cashEntries).map((c, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{c.note || 'Cash'}</p>
                    <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                      {formatDate(c.date)} · Paid by {c.paidBy === 'user1' ? user1Name : user2Name}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] ml-2">{formatMXN(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settlement History */}
        {snapshotSettlements.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Settlement History</span>
              <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
            </div>
            <div className={`${CARD} divide-y divide-[#e8e8e8] dark:divide-[#2d3347]`}>
              {sortByDateDesc(snapshotSettlements).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{s.description || 'Settlement'}</p>
                    <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                      {formatDate(s.date)} · Paid by {s.paidBy === 'user1' ? user1Name : user2Name}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#1a7a3c]">{formatMXN(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
