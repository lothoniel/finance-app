import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import PeriodSelector from '../components/ui/PeriodSelector'
import InfoTooltip from '../components/ui/InfoTooltip'
import AreaChart from '../components/charts/AreaChart'
import DebtPaymentForm from '../components/forms/DebtPaymentForm'
import { filterByPeriod, sortByDateDesc } from '../lib/filters'
import { formatMoney, formatMoneyCompact, formatDate, formatShortMonth } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { DebtPayment } from '../store/types'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'

export default function DebtPaymentPage() {
  const { t } = useTranslation()
  const [cardFilter, setCardFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDebt, setEditDebt] = useState<DebtPayment | undefined>()

  const debtPayments = useStore((s) => s.debtPayments)
  const expenses = useStore((s) => s.expenses)
  const paychecks = useStore((s) => s.paychecks)
  const transfers = useStore((s) => s.transfers)
  const creditCards = useStore((s) => s.settings.creditCards)
  const language = useStore((s) => s.settings.language)
  const currency = useStore((s) => s.settings.currencyDisplay)
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

  const remainingDebt = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const totalPayments = debtPayments.reduce((s, d) => s + d.amount, 0)
    return Math.max(totalExpenses - totalPayments, 0)
  }, [expenses, debtPayments])

  const debtRatio = useMemo(() => {
    const periodIncome =
      filterByPeriod(paychecks, periodMode, periodValue).reduce((s, p) => s + p.mxnAmount, 0) +
      filterByPeriod(transfers, periodMode, periodValue).reduce((s, t) => s + t.amount, 0)
    return periodIncome > 0 ? (totalPaid / periodIncome) * 100 : 0
  }, [paychecks, transfers, periodMode, periodValue, totalPaid])

  const sortedPayments = useMemo(
    () => sortByDateDesc(filtered),
    [filtered]
  )

  const chartData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
    return months.map(({ year, month }) => ({
      name: formatShortMonth(`${year}-${String(month).padStart(2, '0')}-01`, language),
      amount: filterByPeriod(debtPayments, 'month', { year, month }).reduce((s, d) => s + d.amount, 0),
    }))
  }, [debtPayments, language])

  const labelWithTip = (text: string, tipKey: string) => (
    <span className="inline-flex items-center gap-1 align-middle">
      {text}
      <InfoTooltip content={t(tipKey)} />
    </span>
  )

  const kpis: Array<{ key: string; label: React.ReactNode; value: string; sub?: string; color: string | undefined }> = [
    { key: 'paidThisPeriod', label: labelWithTip(t('debt.kpis.paidThisPeriod'), 'tooltips.debt.paidThisPeriod'), value: formatMoneyCompact(totalPaid, currency), color: '#2e7d65' },
    { key: 'remainingDebt', label: labelWithTip(t('debt.kpis.remainingDebt'), 'tooltips.debt.remainingDebt'), value: formatMoneyCompact(remainingDebt, currency), color: '#c0392b' },
    { key: 'debtRatio', label: labelWithTip(t('debt.kpis.debtRatio'), 'tooltips.debt.debtRatio'), value: `${debtRatio.toFixed(1)}%`, color: '#c8912a' },
    { key: 'payments', label: t('debt.kpis.payments'), value: String(paymentCount), sub: t('debt.kpis.inSelectedPeriod'), color: undefined },
    ...(topCard ? [{ key: 'topCard', label: labelWithTip(t('debt.kpis.topCard'), 'tooltips.debt.topCard'), value: topCard.name, sub: formatMoneyCompact(topCard.amount, currency), color: undefined }] : []),
  ]

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('debt.title')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} modes={['month', 'quarter', 'year', 'all']} />
          <button
            onClick={() => { setEditDebt(undefined); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />{t('debt.recordPayment')}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-6 overflow-x-auto`}>
        {kpis.map((kpi) => (
          <div key={kpi.key} className="flex-1 min-w-[120px] px-5 py-4">
            {kpi.color ? (
              <div className="text-[22px] font-bold leading-tight" style={{ color: kpi.color }}>{kpi.value}</div>
            ) : (
              <div className="text-[22px] font-bold leading-tight text-[#181d26] dark:text-[#e8eaf0]">{kpi.value}</div>
            )}
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
            {kpi.sub && <div className="text-[11px] text-[#9297a0] mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Card Balances */}
      {creditCards.length > 0 && (
        <div className="mb-6">
          <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-3">
            <span className="inline-flex items-center gap-1 align-middle">
              {t('debt.sections.cardBalances')}
              <InfoTooltip content={t('tooltips.debt.cardBalances')} />
            </span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {creditCards.map((card) => {
              const total = periodFiltered.filter((d) => d.card === card.name).reduce((s, d) => s + d.amount, 0)
              return (
                <div
                  key={card.name}
                  className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4"
                  style={{ borderTopWidth: 3, borderTopColor: card.color }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4px] truncate mb-2" style={{ color: card.color }}>
                    {card.name}
                  </p>
                  <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] tabular-nums">{formatMoneyCompact(total, currency)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Debt Payments Chart */}
      <div className={`${CARD} p-5 mb-6`}>
        <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">{t('debt.sections.debtPaymentsMonthly')}</p>
        <AreaChart
          data={chartData}
          areas={[{ key: 'amount', color: '#c8912a', name: t('debt.chart.debtPayments') }]}
          xKey="name"
          height={220}
        />
      </div>

      {/* Payments table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('debt.sections.recentPayments')}</p>
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="ml-auto border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-1.5 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
          >
            <option value="all">{t('debt.filters.allCards')}</option>
            {creditCards.map((card) => (
              <option key={card.name} value={card.name}>{card.name}</option>
            ))}
          </select>
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {[
                    { label: t('expenses.table.date'), align: 'text-left' },
                    { label: t('debt.table.card'), align: 'text-left' },
                    { label: t('expenses.table.description'), align: 'text-left' },
                    { label: t('expenses.table.amount'), align: 'text-right' },
                    { label: '', align: 'text-left' },
                  ].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${h.align}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-[13px] text-[#41454d] dark:text-[#9297a0]">
                      {t('debt.empty.noPayments')}
                    </td>
                  </tr>
                )}
                {sortedPayments.map((d, i, arr) => {
                  const cardColor = creditCards.find((c) => c.name === d.card)?.color ?? '#9297a0'
                  const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                  return (
                    <tr key={d.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${border}`}>{formatDate(d.date, language)}</td>
                      <td className={`px-4 py-[11px] ${border}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cardColor }} />
                          <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{d.card}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{d.description}</td>
                      <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${border}`} style={{ color: '#1a7a3c' }}>{formatMoney(d.amount, currency)}</td>
                      <td className={`px-4 py-[11px] ${border}`}>
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
