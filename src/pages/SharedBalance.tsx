import { useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import Modal from '../components/ui/Modal'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'

export default function SharedBalance() {
  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleDesc, setSettleDesc] = useState('')
  const [settlePaidBy, setSettlePaidBy] = useState<'user1' | 'user2'>('user2')

  const expenses = useStore((s) => s.expenses)
  const settlements = useStore((s) => s.settlements)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addSettlement = useStore((s) => s.addSettlement)

  const settlement = calculateSettlement(expenses, settlements)

  const sharedExpenses = expenses.filter((e) => e.shared)
  const user1Recent = sharedExpenses
    .filter((e) => e.paidBy === 'user1')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
  const user2Recent = sharedExpenses
    .filter((e) => e.paidBy === 'user2')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  function handleSettle(e: React.FormEvent) {
    e.preventDefault()
    addSettlement({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      amount: parseFloat(settleAmount) || 0,
      paidBy: settlePaidBy,
      description: settleDesc,
    })
    setSettleOpen(false)
    setSettleAmount('')
    setSettleDesc('')
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Shared"
          value={formatMXNCompact(settlement.totalShared)}
          subtitle="All shared expenses"
          icon={<Users className="w-5 h-5" />}
          accent="#3B82F6"
        />
        <KpiCard
          title="Per Person"
          value={formatMXNCompact(settlement.perPerson)}
          subtitle="50% split"
          accent="#6B3FA0"
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
        <div
          className="bg-[#6B3FA0] rounded-2xl p-5 border border-[#6B3FA0] shadow-sm cursor-pointer hover:bg-[#5a3490] transition-colors flex flex-col items-center justify-center gap-2"
          onClick={() => setSettleOpen(true)}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-semibold text-white text-center">Record Settlement</p>
        </div>
      </div>

      {/* Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User 1 Ledger */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#6B3FA0]/20 flex items-center justify-center">
              <span className="text-sm font-bold text-[#6B3FA0]">{user1Name.charAt(0)}</span>
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

      {/* Settlement Modal */}
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
              placeholder="e.g. Monthly settlement"
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSettleOpen(false)}
              className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium">
              Record Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
