import { useState, useMemo } from 'react'
import { Plus, CreditCard, Pencil } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import DebtPaymentForm from '../components/forms/DebtPaymentForm'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import type { DebtPayment } from '../store/types'

function now(): PeriodValue {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export default function DebtPaymentPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(now())
  const [cardFilter, setCardFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDebt, setEditDebt] = useState<DebtPayment | undefined>()

  const debtPayments = useStore((s) => s.debtPayments)
  const creditCards = useStore((s) => s.settings.creditCards)

  const filtered = useMemo(() => {
    const period = filterByPeriod(debtPayments, periodMode, periodValue)
    if (cardFilter === 'all') return period
    return period.filter((d) => d.card === cardFilter)
  }, [debtPayments, periodMode, periodValue, cardFilter])

  const totalPaid = filtered.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector
            mode={periodMode}
            value={periodValue}
            onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }}
            modes={['month', 'quarter', 'year', 'all']}
          />
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2D3448] bg-white dark:bg-[#1A1F2E] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
          >
            <option value="all">All Cards</option>
            {creditCards.map((card) => (
              <option key={card.name} value={card.name}>{card.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setEditDebt(undefined); setModalOpen(true) }}
          className="flex items-center gap-2 bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 items-start">
        <KpiCard
          title="Total Paid"
          value={formatMXNCompact(totalPaid)}
          subtitle={formatMXN(totalPaid)}
          icon={<CreditCard className="w-5 h-5" />}
          accent="#F59E0B"
        />
        <div className="col-span-2 grid grid-cols-2 gap-3">
          {creditCards.map((card) => {
            const color = card.color
            const total = filterByPeriod(debtPayments, periodMode, periodValue)
              .filter((d) => d.card === card.name)
              .reduce((s, d) => s + d.amount, 0)
            return (
              <div
                key={card.name}
                className="bg-white dark:bg-[#1A1F2E] rounded-xl p-3 border border-gray-200 dark:border-[#2D3448] shadow-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.name}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMXNCompact(total)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-8 border border-gray-200 dark:border-[#2D3448] text-center">
            <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No debt payments in this period</p>
          </div>
        )}
        {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((d) => {
          const color = creditCards.find((c) => c.name === d.card)?.color ?? '#6B3FA0'
          return (
            <div
              key={d.id}
              className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-4 border border-gray-200 dark:border-[#2D3448] shadow-sm flex items-center gap-4"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <CreditCard className="w-5 h-5" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {d.card}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {d.description} · {formatDate(d.date)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-green-600">
                  {formatMXN(d.amount)}
                </span>
                <button
                  onClick={() => { setEditDebt(d); setModalOpen(true) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#6B3FA0] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <DebtPaymentForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        debtPayment={editDebt}
      />
    </div>
  )
}
