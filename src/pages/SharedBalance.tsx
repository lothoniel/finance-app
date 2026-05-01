import { generateId } from '../lib/id'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import SectionTitle from '../components/ui/SectionTitle'
import Modal from '../components/ui/Modal'
import SettlementModal from '../components/forms/SettlementModal'
import { formatMXN, formatMXNCompact, formatDate, today } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import { inputClass } from '../lib/styles'

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

  const lastSettlement = settlements.length > 0
    ? settlements.reduce((latest, s) => s.date > latest.date ? s : latest)
    : null
  const lastSettlementDate = lastSettlement?.date ?? null

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
  const recentShared = [...sharedExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

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

  const cardBase = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

  return (
    <div>
      <HeroBand color="#f5e9d4" light>
        <div className="flex justify-end gap-2 mb-4 md:mb-0 md:absolute md:top-7 md:right-10">
          <HeroAction variant="ghost-dark" onClick={() => setCashOpen(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Cash
          </HeroAction>
          <HeroAction variant="ghost-dark" onClick={() => setSettleOpen(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Record Settlement
          </HeroAction>
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi
            label="Total Shared"
            value={formatMXNCompact(settlement.totalShared)}
            sub={lastSettlementDate ? `Since ${formatDate(lastSettlementDate)}` : 'All time'}
            light
          />
          <HeroKpi label="Per Person" value={formatMXNCompact(settlement.perPerson)} sub="50% split" light />
          <HeroKpi
            label="Net Settlement"
            value={formatMXN(settlement.netSettlement)}
            sub={netLabel}
            light
          />
        </div>
      </HeroBand>

      {/* Individual Ledgers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {[
          {
            name: user1Name,
            paid: settlement.user1Paid,
            owes: settlement.user1Owes,
            counterOwes: settlement.user2Owes,
          },
          {
            name: user2Name,
            paid: settlement.user2Paid,
            owes: settlement.user2Owes,
            counterOwes: settlement.user1Owes,
          },
        ].map(({ name, paid, owes, counterOwes }) => (
          <div key={name} className={`${cardBase} p-5`}>
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

      {/* Recent Shared Expenses */}
      <div className="mb-8">
        <SectionTitle>Recent Shared Expenses</SectionTitle>
        <div className={`${cardBase} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Description', 'Paid By', 'Amount'].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentShared.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No shared expenses yet</td></tr>
                )}
                {recentShared.map((e, i, arr) => (
                  <tr key={e.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(e.date)}</td>
                    <td className={`px-4 py-[11px] text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{e.description}</td>
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      {e.paidBy === 'user1' ? user1Name : user2Name}
                    </td>
                    <td className={`px-4 py-[11px] text-right text-[13px] font-medium text-[#c0392b] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatMXN(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cash Entries */}
      {cashEntriesSinceLastSettlement.length > 0 && (
        <div className="mb-8">
          <SectionTitle>Cash Entries</SectionTitle>
          <div className={`${cardBase} divide-y divide-[#e8e8e8]`}>
            {[...cashEntriesSinceLastSettlement].sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
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
        <SectionTitle>Settlement History</SectionTitle>
        <div className={`${cardBase} divide-y divide-[#e8e8e8]`}>
          {settlements.length === 0 && (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No settlements recorded yet</p>
          )}
          {[...settlements].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
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
