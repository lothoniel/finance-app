import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { renderIcon } from '../lib/iconRenderer'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import PeriodTabs from '../components/ui/PeriodTabs'
import SectionTitle from '../components/ui/SectionTitle'
import DebtPaymentForm from '../components/forms/DebtPaymentForm'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { DebtPayment } from '../store/types'

export default function DebtPaymentPage() {
  const [cardFilter, setCardFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDebt, setEditDebt] = useState<DebtPayment | undefined>()

  const debtPayments = useStore((s) => s.debtPayments)
  const creditCards = useStore((s) => s.settings.creditCards)
  const deleteDebtPayment = useStore((s) => s.deleteDebtPayment)

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: periodFiltered } = usePeriodFilter(debtPayments)

  const filtered = useMemo(() => {
    if (cardFilter === 'all') return periodFiltered
    return periodFiltered.filter((d) => d.card === cardFilter)
  }, [periodFiltered, cardFilter])

  const totalPaid = filtered.reduce((s, d) => s + d.amount, 0)
  const paymentCount = filtered.length

  const topCard = useMemo(() => {
    const totals: Record<string, number> = {}
    periodFiltered.forEach((d) => { totals[d.card] = (totals[d.card] ?? 0) + d.amount })
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]
    return top ? { name: top[0], amount: top[1] } : null
  }, [periodFiltered])

  const sortedPayments = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  )

  return (
    <div>
      <HeroBand color="#c8912a">
        <div className="flex justify-end gap-2 mb-4 md:mb-0 md:absolute md:top-7 md:right-10">
          <HeroAction variant="primary" onClick={() => { setEditDebt(undefined); setModalOpen(true) }}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />Record Payment
          </HeroAction>
        </div>
        <div className="mb-6">
          <PeriodTabs mode={periodMode} value={periodValue} onChange={onPeriodChange} variant="light" modes={['month', 'quarter', 'year', 'all']} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi label="Total Paid" value={formatMXN(totalPaid)} />
          <HeroKpi label="Payments" value={String(paymentCount)} sub="in selected period" />
          {topCard && <HeroKpi label="Top Card" value={topCard.name} sub={formatMXNCompact(topCard.amount)} />}
        </div>
      </HeroBand>

      {/* Card breakdown */}
      {creditCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {creditCards.map((card) => {
            const total = periodFiltered.filter((d) => d.card === card.name).reduce((s, d) => s + d.amount, 0)
            return (
              <div key={card.name} className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4" style={{ borderLeftWidth: 3, borderLeftColor: card.color }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ color: card.color }}>{renderIcon(card.icon, 14)}</span>
                  <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] truncate">{card.name}</p>
                </div>
                <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] tabular-nums">{formatMXNCompact(total)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Payments table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <SectionTitle>Recent Payments</SectionTitle>
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="ml-auto border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-1.5 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
          >
            <option value="all">All Cards</option>
            {creditCards.map((card) => (
              <option key={card.name} value={card.name}>{card.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Card', 'Description', 'Amount', ''].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-[13px] text-[#41454d] dark:text-[#9297a0]">
                      No debt payments in this period
                    </td>
                  </tr>
                )}
                {sortedPayments.map((d, i, arr) => {
                  const cardColor = creditCards.find((c) => c.name === d.card)?.color ?? '#9297a0'
                  return (
                    <tr key={d.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(d.date)}</td>
                      <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cardColor }} />
                          <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{d.card}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{d.description}</td>
                      <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#1a7a3c' }}>{formatMXN(d.amount)}</td>
                      <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditDebt(d); setModalOpen(true) }}
                            className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteDebtPayment(d.id)}
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

      <DebtPaymentForm open={modalOpen} onClose={() => setModalOpen(false)} debtPayment={editDebt} />
    </div>
  )
}
