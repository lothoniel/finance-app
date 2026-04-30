import { generateId } from '../lib/id'
import { useState } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
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
  const user1Recent = sharedExpenses
    .filter((e) => e.paidBy === 'user1')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
  const user2Recent = sharedExpenses
    .filter((e) => e.paidBy === 'user2')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

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

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Shared"
          value={formatMXNCompact(settlement.totalShared)}
          subtitle={lastSettlementDate ? `Since ${formatDate(lastSettlementDate)}` : 'All time'}
          icon={<Users className="w-5 h-5" />}
          accent="#3B82F6"
        />
        <KpiCard
          title="Per Person"
          value={formatMXNCompact(settlement.perPerson)}
          subtitle="50% split"
          accent="#7C3AED"
        />
        <KpiCard
          title="Net Settlement"
          value={formatMXN(settlement.netSettlement)}
          subtitle={
            settlement.creditor === 'even'
              ? 'All settled up!'
              : settlement.creditor === 'user1'
              ? `${user2Name} owes ${user1Name}`
              : `${user1Name} owes ${user2Name}`
          }
          accent={settlement.creditor === 'even' ? '#22C55E' : '#F59E0B'}
        />
        <div className="flex flex-col gap-2">
          <div
            className="flex-1 bg-[#7C3AED] rounded-2xl p-4 border border-[#7C3AED] shadow-sm cursor-pointer hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2"
            onClick={() => setSettleOpen(true)}
          >
            <Plus className="w-4 h-4 text-white" />
            <p className="text-sm font-semibold text-white">Record Settlement</p>
          </div>
          <div
            className="flex-1 bg-white dark:bg-[#1A1F2E] rounded-2xl p-4 border border-gray-200 dark:border-[#2D3448] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            onClick={() => setCashOpen(true)}
          >
            <Plus className="w-4 h-4 text-[#7C3AED]" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">+ Cash</p>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User 1 Ledger */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
              <span className="text-sm font-bold text-[#7C3AED]">{user1Name.charAt(0)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{user1Name}'s Ledger</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Paid (Shared)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMXN(settlement.user1Paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Share (50%)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMXN(settlement.perPerson)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-[#2D3448] pt-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {settlement.user1Owes > 0 ? 'Still Owes' : 'Is Owed'}
              </span>
              <span className={`text-sm font-bold ${settlement.user1Owes > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatMXN(settlement.user1Owes > 0 ? settlement.user1Owes : settlement.user2Owes)}
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Recent Shared Payments</p>
          <div className="space-y-2">
            {user1Recent.length === 0 && (
              <p className="text-sm text-gray-400">No recent shared payments</p>
            )}
            {user1Recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                </div>
                <span className="text-sm font-semibold text-red-500 ml-2 flex-shrink-0">{formatMXN(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User 2 Ledger */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">{user2Name.charAt(0)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{user2Name}'s Ledger</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Paid (Shared)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMXN(settlement.user2Paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Share (50%)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMXN(settlement.perPerson)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-[#2D3448] pt-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {settlement.user2Owes > 0 ? 'Still Owes' : 'Is Owed'}
              </span>
              <span className={`text-sm font-bold ${settlement.user2Owes > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatMXN(settlement.user2Owes > 0 ? settlement.user2Owes : settlement.user1Owes)}
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Recent Shared Payments</p>
          <div className="space-y-2">
            {user2Recent.length === 0 && (
              <p className="text-sm text-gray-400">No recent shared payments</p>
            )}
            {user2Recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                </div>
                <span className="text-sm font-semibold text-red-500 ml-2 flex-shrink-0">{formatMXN(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Entries */}
      {cashEntriesSinceLastSettlement.length > 0 && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3448]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cash Entries</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#2D3448]">
            {cashEntriesSinceLastSettlement.sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{c.note || 'Cash'}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(c.date)} · Paid by {c.paidBy === 'user1' ? user1Name : user2Name}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-[#7C3AED]">{formatMXN(c.amount)}</span>
                  <button
                    onClick={() => deleteCashEntry(c.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement History */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3448]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Settlement History</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#2D3448]">
          {settlements.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No settlements recorded yet</div>
          )}
          {settlements.sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-gray-900 dark:text-white">{s.description || 'Settlement'}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(s.date)} · Paid by {s.paidBy === 'user1' ? user1Name : user2Name}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-600">{formatMXN(s.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <SettlementModal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        netSettlement={settlement.netSettlement}
      />

      {/* Cash Entry Modal */}
      <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Add Cash Entry">
        <form onSubmit={handleAddCash} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} required
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid By</label>
            <select value={cashPaidBy} onChange={(e) => setCashPaidBy(e.target.value as 'user1' | 'user2')}
              className={inputClass}>
              <option value="user1">{user1Name}</option>
              <option value="user2">{user2Name}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (MXN)</label>
            <input type="number" min="0" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} required
              placeholder="0.00"
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
            <input type="text" value={cashNote} onChange={(e) => setCashNote(e.target.value)}
              placeholder="e.g. Cash for groceries"
              className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCashOpen(false)}
              className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium">
              Add Cash Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
