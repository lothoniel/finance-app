import { generateId } from '../lib/id'
import { useState, useMemo } from 'react'
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  BarChart2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ArrowRightLeft,
} from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import BarChart from '../components/charts/BarChart'
import AreaChart from '../components/charts/AreaChart'
import Modal from '../components/ui/Modal'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate, formatShortMonth } from '../lib/formatters'
import { calculateSettlement } from '../lib/settlement'
import type { Settlement } from '../store/types'

function getCurrentMonthValue(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export default function Dashboard() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(getCurrentMonthValue())
  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleDesc, setSettleDesc] = useState('')
  const [settlePaidBy, setSettlePaidBy] = useState<'user1' | 'user2'>('user2')

  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const debtPayments = useStore((s) => s.debtPayments)
  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const settlements = useStore((s) => s.settlements)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addSettlement = useStore((s) => s.addSettlement)

  // Current month KPIs
  const currMonth = getCurrentMonthValue()
  const monthPaychecks = filterByPeriod(paychecks, 'month', currMonth)
  const monthTransfers = filterByPeriod(transfers, 'month', currMonth)
  const monthExpenses = filterByPeriod(expenses, 'month', currMonth)
  const monthDebt = filterByPeriod(debtPayments, 'month', currMonth)
  const monthGains = filterByPeriod(investmentMovements, 'month', currMonth).filter(
    (m) => m.type === 'GAIN'
  )

  const monthlyInflow =
    monthPaychecks.reduce((s, p) => s + p.mxnAmount, 0) +
    monthTransfers.reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const monthlyDebt = monthDebt.reduce((s, d) => s + d.amount, 0)
  const totalPortfolioBalance = portfolios.reduce((s, p) => s + p.balance, 0)
  const monthlyGains = monthGains.reduce((s, m) => s + m.amount, 0)

  // Period-filtered data for snapshot
  const filteredPaychecks = filterByPeriod(paychecks, periodMode, periodValue)
  const filteredTransfers = filterByPeriod(transfers, periodMode, periodValue)
  const filteredExpenses = filterByPeriod(expenses, periodMode, periodValue)
  const filteredDebt = filterByPeriod(debtPayments, periodMode, periodValue)

  const periodIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
  const periodTransfers = filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const periodExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const periodDebt = filteredDebt.reduce((s, d) => s + d.amount, 0)
  const periodNetFlow = periodIncome + periodTransfers - periodDebt

  // Last 6 months chart data
  const last6Months = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  const trendData = useMemo(() => {
    return last6Months.map((month) => {
      const [y, m] = month.split('-').map(Number)
      const val: PeriodValue = { year: y, month: m }
      const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0) +
        filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
      const exp = filterByPeriod(expenses, 'month', val).reduce((s, e) => s + e.amount, 0)
      const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' })
      return { month: `${label}`, Income: inc, Expenses: exp }
    })
  }, [last6Months, paychecks, transfers, expenses])

  // Income vs Debt bar chart for last 6 months
  const barData = useMemo(() => {
    return last6Months.map((month) => {
      const [y, m] = month.split('-').map(Number)
      const val: PeriodValue = { year: y, month: m }
      const inc = filterByPeriod(paychecks, 'month', val).reduce((s, p) => s + p.mxnAmount, 0) +
        filterByPeriod(transfers, 'month', val).reduce((s, t) => s + t.amount, 0)
      const debt = filterByPeriod(debtPayments, 'month', val).reduce((s, d) => s + d.amount, 0)
      const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' })
      return { month: label, Income: inc, Debt: debt }
    })
  }, [last6Months, paychecks, transfers, debtPayments])

  // Settlement
  const settlement = calculateSettlement(expenses, settlements)

  // Recent activity
  const recentActivity = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: -e.amount,
        type: 'expense' as const,
        sub: e.category,
      })),
      ...paychecks.map((p) => ({
        id: p.id,
        date: p.date,
        description: 'Paycheck',
        amount: p.mxnAmount,
        type: 'income' as const,
        sub: 'paycheck',
      })),
      ...transfers.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: 'transfer' as const,
        sub: t.category,
      })),
      ...debtPayments.map((d) => ({
        id: d.id,
        date: d.date,
        description: d.description,
        amount: -d.amount,
        type: 'debt' as const,
        sub: d.card,
      })),
    ]
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [expenses, paychecks, transfers, debtPayments])

  const typeColors = {
    expense: '#EF4444',
    income: '#22C55E',
    transfer: '#3B82F6',
    debt: '#F59E0B',
  }

  const typeIcons = {
    expense: ShoppingCart,
    income: DollarSign,
    transfer: ArrowRightLeft,
    debt: CreditCard,
  }

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
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monthly Inflow"
          value={formatMXNCompact(monthlyInflow)}
          subtitle="Income + Transfers"
          icon={<TrendingUp className="w-5 h-5" />}
          accent="#22C55E"
        />
        <KpiCard
          title="Monthly Expenses"
          value={formatMXNCompact(monthlyExpenses)}
          subtitle="All spending"
          icon={<ShoppingCart className="w-5 h-5" />}
          accent="#EF4444"
        />
        <KpiCard
          title="Monthly Debt Pay"
          value={formatMXNCompact(monthlyDebt)}
          subtitle="Card payments"
          icon={<CreditCard className="w-5 h-5" />}
          accent="#F59E0B"
        />
        <KpiCard
          title="Investments"
          value={formatMXNCompact(totalPortfolioBalance)}
          subtitle={`Includes +${formatMXNCompact(monthlyGains)} gains this month`}
          icon={<BarChart2 className="w-5 h-5" />}
          accent="#6B3FA0"
        />
      </div>

      {/* Cash Flow Summary */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cash Flow Summary</h2>
          <PeriodSelector
            mode={periodMode}
            value={periodValue}
            onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Snapshot panel */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Snapshot
            </p>
            <div className="space-y-3">
              {[
                { label: 'Total Income', value: periodIncome, color: '#22C55E' },
                { label: 'Transfers', value: periodTransfers, color: '#3B82F6' },
                { label: 'Expenses', value: periodExpenses, color: '#EF4444' },
                { label: 'Debt Pay', value: periodDebt, color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatMXN(value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6B3FA0' }} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Flow</span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: periodNetFlow >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {formatMXN(periodNetFlow)}
                </span>
              </div>
            </div>
          </div>

          {/* Income vs Debt bar chart */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Income vs Debt Pay
            </p>
            <BarChart
              data={barData}
              bars={[
                { key: 'Income', color: '#6B3FA0', name: 'Income' },
                { key: 'Debt', color: '#F59E0B', name: 'Debt Pay' },
              ]}
              xKey="month"
              height={220}
            />
          </div>
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          Cash Flow Trend (Last 6 Months)
        </p>
        <AreaChart
          data={trendData}
          areas={[
            { key: 'Income', color: '#6B3FA0', name: 'Income' },
            { key: 'Expenses', color: '#6B7280', name: 'Expenses' },
          ]}
          xKey="month"
          height={240}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shared Balance */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#6B3FA0]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Shared Balance
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
            </div>
          </div>

          <div className="text-center py-3">
            {settlement.creditor === 'even' ? (
              <p className="text-2xl font-bold text-green-500">All settled up!</p>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {settlement.creditor === 'user1'
                    ? `${user2Name} owes ${user1Name}`
                    : `${user1Name} owes ${user2Name}`}
                </p>
                <p className="text-3xl font-bold text-[#6B3FA0] mt-1">
                  {formatMXN(settlement.netSettlement)}
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => setSettleOpen(true)}
            className="w-full mt-3 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#5a3490] transition-colors"
          >
            Settle Up
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Recent Activity
          </p>
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const Icon = typeIcons[item.type]
              const color = typeColors[item.type]
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(item.date)} · {item.sub}
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: item.amount >= 0 ? '#22C55E' : '#EF4444' }}
                  >
                    {item.amount >= 0 ? '+' : ''}
                    {formatMXNCompact(item.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Settlement Modal */}
      <Modal open={settleOpen} onClose={() => setSettleOpen(false)} title="Record Settlement">
        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paid By
            </label>
            <select
              value={settlePaidBy}
              onChange={(e) => setSettlePaidBy(e.target.value as 'user1' | 'user2')}
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
            >
              <option value="user1">{user1Name}</option>
              <option value="user2">{user2Name}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (MXN)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              required
              placeholder={formatMXN(settlement.netSettlement)}
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={settleDesc}
              onChange={(e) => setSettleDesc(e.target.value)}
              placeholder="Settlement description"
              className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSettleOpen(false)}
              className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium"
            >
              Record Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
