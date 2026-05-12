import { generateId } from '../lib/id'
import { useState, useMemo } from 'react'
import LZString from 'lz-string'
import { Plus, Trash2, Search, Share2, Check } from 'lucide-react'
import { useStore } from '../store'
import Modal from '../components/ui/Modal'
import SettlementModal from '../components/forms/SettlementModal'
import DonutChart from '../components/charts/DonutChart'
import { formatMXN, formatMXNCompact, formatDate, today } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import { sortByDateAsc, sortByDateDesc } from '../lib/filters'
import { inputClass } from '../lib/styles'
import { renderIcon } from '../lib/iconRenderer'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

function resolveOrigin(): Promise<string> {
  const { protocol, hostname, port } = window.location
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return Promise.resolve(window.location.origin)
  }
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] })
    pc.createDataChannel('')
    pc.createOffer().then((o) => pc.setLocalDescription(o))
    const fallback = setTimeout(() => { pc.close(); resolve(window.location.origin) }, 1000)
    pc.onicecandidate = (e) => {
      if (!e.candidate) return
      const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
      if (match && !match[1].startsWith('127.')) {
        clearTimeout(fallback)
        pc.close()
        resolve(`${protocol}//${match[1]}${port ? `:${port}` : ''}`)
      }
    }
  })
}

export default function SharedBalance() {
  const [settleOpen, setSettleOpen] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [paidByFilter, setPaidByFilter] = useState<'all' | 'user1' | 'user2'>('all')
  const [cashAmount, setCashAmount] = useState('')
  const [cashNote, setCashNote] = useState('')
  const [cashPaidBy, setCashPaidBy] = useState<'user1' | 'user2'>('user1')
  const [cashDate, setCashDate] = useState(today())

  const expenses = useStore((s) => s.expenses)
  const settlements = useStore((s) => s.settlements)
  const cashEntries = useStore((s) => s.cashEntries)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const categories = useStore((s) => s.settings.expenseCategories)
  const splitRatio = useStore((s) => s.settings.splitRatio)
  const addCashEntry = useStore((s) => s.addCashEntry)
  const deleteCashEntry = useStore((s) => s.deleteCashEntry)
  const deleteSettlement = useStore((s) => s.deleteSettlement)

  const lastSettlementDate = useMemo(() => {
    if (settlements.length === 0) return null
    const sorted = sortByDateAsc(settlements)
    let lastZeroDate: string | null = null
    for (const s of sorted) {
      const expBefore = expenses.filter((e) => e.shared && e.date <= s.date)
      const stlBefore = settlements.filter((st) => st.date <= s.date)
      const ceBefore = cashEntries.filter((c) => c.date <= s.date)
      if (calculateSettlement(expBefore, stlBefore, ceBefore, splitRatio).netSettlement < 1) {
        lastZeroDate = s.date
      }
    }
    return lastZeroDate
  }, [settlements, expenses, cashEntries, splitRatio])

  const expensesSinceLastSettlement = lastSettlementDate
    ? expenses.filter((e) => e.date > lastSettlementDate)
    : expenses
  const cashEntriesSinceLastSettlement = lastSettlementDate
    ? cashEntries.filter((c) => c.date > lastSettlementDate)
    : cashEntries
  const settlementsSinceLastSettlement = lastSettlementDate
    ? settlements.filter((s) => s.date > lastSettlementDate)
    : settlements

  const settlement = calculateSettlement(
    expensesSinceLastSettlement,
    settlementsSinceLastSettlement,
    cashEntriesSinceLastSettlement,
    splitRatio
  )

  const sharedExpenses = expensesSinceLastSettlement.filter((e) => e.shared)
  const recentShared = sortByDateDesc(sharedExpenses)

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
    const totals: Record<string, number> = {}
    displayedShared.forEach((e) => { totals[e.category] = (totals[e.category] ?? 0) + e.amount })
    return categories
      .filter((c) => (totals[c.id] ?? 0) > 0)
      .map((c) => ({ name: c.name, value: totals[c.id] ?? 0, color: c.color }))
      .sort((a, b) => b.value - a.value)
  }, [displayedShared, categories])

  const chartTotal = displayedShared.reduce((s, e) => s + e.amount, 0)
  const maxChartValue = chartData[0]?.value ?? 1

  async function copyToClipboard(text: string) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return
    }
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }

  async function handleShare() {
    const snapshot = {
      v: 1,
      createdAt: new Date().toISOString(),
      user1Name,
      user2Name,
      splitRatio,
      lastSettlementDate,
      expenses: expensesSinceLastSettlement.map(({ date, description, amount, category, paidBy, shared, splitRatio: sr }) => ({
        date, description, amount, category, paidBy, shared,
        ...(sr !== undefined ? { splitRatio: sr } : {}),
      })),
      cashEntries: cashEntriesSinceLastSettlement.map(({ date, amount, paidBy, note }) => ({ date, amount, paidBy, note })),
      settlements: settlementsSinceLastSettlement.map(({ date, amount, paidBy, description }) => ({ date, amount, paidBy, description })),
      categories: categories.map(({ id, name, icon, color }) => ({ id, name, icon, color })),
    }
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(snapshot))
    const origin = await resolveOrigin()
    const url = `${origin}/shared-balance/view?d=${compressed}`

    if (navigator.share) {
      try {
        await navigator.share({ url })
      } catch {
        // user cancelled
      }
      return
    }

    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleAddCash(e: React.FormEvent) {
    e.preventDefault()
    addCashEntry({
      id: generateId(),
      date: cashDate,
      amount: parseFloat(cashAmount) || 0,
      paidBy: cashPaidBy,
      note: cashNote,
    })
    setCashOpen(false)
    setCashAmount('')
    setCashNote('')
    setCashPaidBy('user1')
    setCashDate(today())
  }

  const netLabel = settlement.creditor === 'even'
    ? 'All settled up!'
    : settlement.creditor === 'user1'
    ? `${user2Name} owes ${user1Name}`
    : `${user1Name} owes ${user2Name}`

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Shared Balance</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e8e8e8] dark:border-[#2d3347] text-[13px] font-medium text-[#41454d] dark:text-[#9297a0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={() => setCashOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e8e8e8] dark:border-[#2d3347] text-[13px] font-medium text-[#41454d] dark:text-[#9297a0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Cash
          </button>
          <button
            onClick={() => setSettleOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />Record Settlement
          </button>
        </div>
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

      {/* Shared Expenses Since Last Settlement */}
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
                    <tr key={e.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
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
      {cashEntriesSinceLastSettlement.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Cash Entries</span>
            <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
          </div>
          <div className={`${CARD} divide-y divide-[#e8e8e8] dark:divide-[#2d3347]`}>
            {sortByDateDesc(cashEntriesSinceLastSettlement).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{c.note || 'Cash'}</p>
                  <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                    {formatDate(c.date)} · Paid by {c.paidBy === 'user1' ? user1Name : user2Name}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                  <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{formatMXN(c.amount)}</span>
                  <button onClick={() => deleteCashEntry(c.id)} className="p-1 text-[#41454d] hover:text-[#c0392b] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement History */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Settlement History</span>
          <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
        </div>
        <div className={`${CARD} divide-y divide-[#e8e8e8] dark:divide-[#2d3347]`}>
          {settlements.length === 0 && (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No settlements recorded yet</p>
          )}
          {sortByDateDesc(settlements).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
              <div>
                <p className="text-[13px] text-[#181d26] dark:text-[#e8eaf0]">{s.description || 'Settlement'}</p>
                <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">
                  {formatDate(s.date)} · Paid by {s.paidBy === 'user1' ? user1Name : user2Name}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                <span className="text-[13px] font-semibold text-[#1a7a3c]">{formatMXN(s.amount)}</span>
                <button onClick={() => deleteSettlement(s.id)} className="p-1 text-[#41454d] hover:text-[#c0392b] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SettlementModal open={settleOpen} onClose={() => setSettleOpen(false)} netSettlement={settlement.netSettlement} creditor={settlement.creditor} />

      <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Add Cash Entry">
        <form onSubmit={handleAddCash} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1">Date</label>
            <input type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1">Paid By</label>
            <select value={cashPaidBy} onChange={(e) => setCashPaidBy(e.target.value as 'user1' | 'user2')} className={inputClass}>
              <option value="user1">{user1Name}</option>
              <option value="user2">{user2Name}</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1">Amount (MXN)</label>
            <input type="number" min="0" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} required placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1">Note</label>
            <input type="text" value={cashNote} onChange={(e) => setCashNote(e.target.value)} placeholder="e.g. Cash for groceries" className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCashOpen(false)} className="flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[#181d26] text-white rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218]">
              Add Cash Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
