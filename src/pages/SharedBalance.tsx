import { generateId } from '../lib/id'
import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import Modal from '../components/ui/Modal'
import SettlementModal from '../components/forms/SettlementModal'
import { formatMXN, formatMXNCompact, formatDate, today } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import { sortByDateAsc, sortByDateDesc } from '../lib/filters'
import { inputClass } from '../lib/styles'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

export default function SharedBalance() {
  const [settleOpen, setSettleOpen] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [cashNote, setCashNote] = useState('')
  const [cashPaidBy, setCashPaidBy] = useState<'user1' | 'user2'>('user1')
  const [cashDate, setCashDate] = useState(today())

  const expenses = useStore((s) => s.expenses)
  const settlements = useStore((s) => s.settlements)
  const cashEntries = useStore((s) => s.cashEntries)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addCashEntry = useStore((s) => s.addCashEntry)
  const deleteCashEntry = useStore((s) => s.deleteCashEntry)

  const lastSettlementDate = useMemo(() => {
    if (settlements.length === 0) return null
    const sorted = sortByDateAsc(settlements)
    let lastZeroDate: string | null = null
    for (const s of sorted) {
      const expBefore = expenses.filter((e) => e.shared && e.date <= s.date)
      const stlBefore = settlements.filter((st) => st.date <= s.date)
      const ceBefore = cashEntries.filter((c) => c.date <= s.date)
      if (calculateSettlement(expBefore, stlBefore, ceBefore).netSettlement < 1) {
        lastZeroDate = s.date
      }
    }
    return lastZeroDate
  }, [settlements, expenses, cashEntries])

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
    cashEntriesSinceLastSettlement
  )

  const sharedExpenses = expensesSinceLastSettlement.filter((e) => e.shared)
  const recentShared = sortByDateDesc(sharedExpenses)

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
          <div className="text-[22px] font-bold text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(settlement.perPerson)}</div>
          <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">PER PERSON</div>
          <div className="text-[11px] text-[#9297a0] mt-0.5">50% split</div>
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
          { name: user1Name, paid: settlement.user1Paid, owes: settlement.user1Owes, counterOwes: settlement.user2Owes },
          { name: user2Name, paid: settlement.user2Paid, owes: settlement.user2Owes, counterOwes: settlement.user1Owes },
        ].map(({ name, paid, owes, counterOwes }) => (
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
                { label: 'Share (50%)', value: formatMXN(settlement.perPerson) },
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

      {/* Shared Expenses Since Last Settlement */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Shared Expenses Since Last Settlement</span>
          <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
        </div>
        <div className={`${CARD} overflow-hidden`}>
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
                {recentShared.map((e, i, arr) => {
                  const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                  return (
                    <tr key={e.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${border}`}>{formatDate(e.date)}</td>
                      <td className={`px-4 py-3 text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>{e.description}</td>
                      <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{e.category}</td>
                      <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>
                        {e.paidBy === 'user1' ? user1Name : user2Name}
                      </td>
                      <td className={`px-4 py-3 text-right text-[13px] font-medium text-[#c0392b] ${border}`}>{formatMXN(e.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
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
              <span className="text-[13px] font-semibold text-[#1a7a3c]">{formatMXN(s.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <SettlementModal open={settleOpen} onClose={() => setSettleOpen(false)} netSettlement={settlement.netSettlement} />

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
