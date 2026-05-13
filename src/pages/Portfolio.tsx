import { useState, useMemo } from 'react'
import { Plus, TrendingUp, Calendar, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/charts/DonutChart'
import PeriodSelector from '../components/ui/PeriodSelector'
import PortfolioForm from '../components/forms/PortfolioForm'
import InvestmentMovementForm from '../components/forms/InvestmentMovementForm'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { sortByDateDesc } from '../lib/filters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Portfolio, InvestmentMovement } from '../store/types'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'

const portfolioColors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6']

export default function PortfolioPage() {
  const [portfolioModal, setPortfolioModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | undefined>()
  const [editMovement, setEditMovement] = useState<InvestmentMovement | undefined>()

  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const deleteInvestmentMovement = useStore((s) => s.deleteInvestmentMovement)
  const updatePortfolio = useStore((s) => s.updatePortfolio)

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: filteredMovements } = usePeriodFilter(investmentMovements)

  const totalGains = filteredMovements.filter((m) => m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
  const totalDeposits = filteredMovements.filter((m) => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
  const totalNetWorth = portfolios.reduce((s, p) => s + p.balance, 0)

  const donutData = portfolios.map((p, i) => ({
    name: p.name,
    value: p.balance,
    color: portfolioColors[i % portfolioColors.length],
  }))

  const returnPct = useMemo(() => {
    const result: Record<string, string> = {}
    for (const p of portfolios) {
      const gains = investmentMovements.filter((m) => m.portfolioId === p.id && m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
      const deposits = investmentMovements.filter((m) => m.portfolioId === p.id && m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
      const transfersIn = investmentMovements.filter((m) => m.type === 'TRANSFER' && m.destinationPortfolioId === p.id).reduce((s, m) => s + m.amount, 0)
      const basis = deposits + transfersIn
      result[p.id] = basis > 0 ? (gains / basis * 100).toFixed(2) + '%' : '—'
    }
    return result
  }, [portfolios, investmentMovements])

  const lastGain = useMemo(() => {
    const result: Record<string, number> = {}
    const gains = investmentMovements.filter((m) => m.type === 'GAIN')
    sortByDateDesc(gains).forEach((m) => { if (!result[m.portfolioId]) result[m.portfolioId] = m.amount })
    return result
  }, [investmentMovements])

  const sortedMovements = useMemo(
    () => sortByDateDesc(filteredMovements),
    [filteredMovements]
  )

  function handleDeleteMovement(m: InvestmentMovement) {
    if (m.type === 'TRANSFER') {
      const src = portfolios.find((p) => p.id === m.portfolioId)
      const dst = m.destinationPortfolioId ? portfolios.find((p) => p.id === m.destinationPortfolioId) : undefined
      if (src) updatePortfolio(src.id, { balance: src.balance + m.amount })
      if (dst) updatePortfolio(dst.id, { balance: dst.balance - m.amount })
    } else {
      const portfolio = portfolios.find((p) => p.id === m.portfolioId)
      if (portfolio) {
        const delta = m.type === 'WITHDRAWAL' ? m.amount : -m.amount
        updatePortfolio(portfolio.id, { balance: portfolio.balance + delta })
      }
    }
    deleteInvestmentMovement(m.id)
  }

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Investments</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} />
          <button
            onClick={() => { setEditMovement(undefined); setMovementModal(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e8e8e8] dark:border-[#2d3347] text-[13px] font-medium text-[#41454d] dark:text-[#9297a0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />Movement
          </button>
          <button
            onClick={() => { setEditPortfolio(undefined); setPortfolioModal(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />Portfolio
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {[
          { label: 'TOTAL VALUE', value: formatMXNCompact(totalNetWorth), color: '#181d26' },
          { label: 'TOTAL YIELD', value: formatMXN(totalGains), sub: 'In selected period', color: totalGains >= 0 ? '#1a7a3c' : '#c0392b' },
          { label: 'TOTAL DEPOSITS', value: formatMXN(totalDeposits), sub: 'In selected period', color: '#181d26' },
          { label: 'PORTFOLIOS', value: String(portfolios.length), color: '#181d26' },
        ].map((kpi) => (
          <div key={kpi.label} className="flex-1 px-6 py-4 min-w-0">
            <div className="text-[22px] font-bold dark:text-[#e8eaf0]" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
            {'sub' in kpi && kpi.sub && <div className="text-[11px] text-[#9297a0] mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Asset Allocation + Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Asset Allocation */}
        <div className={`${CARD} p-5`}>
          <p className={SECTION_LABEL}>Asset Allocation</p>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel="Total" centerValue={formatMXNCompact(totalNetWorth)} height={220} />
          ) : (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No portfolios yet</p>
          )}
        </div>

        {/* Holdings */}
        <div className={`${CARD} p-5`}>
          <p className={SECTION_LABEL}>Holdings</p>
          {portfolios.length === 0 && (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No portfolios yet. Add one to get started.</p>
          )}
          <div className="space-y-3">
            {portfolios.map((p, i) => {
              const color = portfolioColors[i % portfolioColors.length]
              const gain = lastGain[p.id]
              const alloc = totalNetWorth > 0 ? (p.balance / totalNetWorth * 100) : 0
              return (
                <div
                  key={p.id}
                  className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-4 cursor-pointer hover:border-[#181d26] dark:hover:border-[#9297a0] transition-colors overflow-hidden"
                  onClick={() => { setEditPortfolio(p); setPortfolioModal(true) }}
                >
                  {/* Top row: name+badges left, value+alloc right */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 mr-4">
                      <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#eef8f4] text-[#2e7d65]">{p.type}</span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px]"
                          style={{ backgroundColor: p.apy >= 10 ? '#eef8f4' : '#fff1ec', color: p.apy >= 10 ? '#2e7d65' : '#aa2d00' }}
                        >
                          {p.apy}% APY
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[20px] font-bold text-[#181d26] dark:text-[#e8eaf0] leading-tight">{formatMXNCompact(p.balance)}</p>
                      <p className="text-[11px] text-[#9297a0] mt-0.5">{alloc.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Secondary row: Return % + last gain */}
                  <div className="flex items-center gap-5 mb-3">
                    <div>
                      <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">Return</p>
                      <p className="text-[13px] font-semibold text-[#1a7a3c]">{returnPct[p.id]}</p>
                    </div>
                    {gain !== undefined && (
                      <div>
                        <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">Last gain</p>
                        <p className="text-[13px] font-semibold text-[#1a7a3c]">+{formatMXN(gain)}</p>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between pt-2 border-t border-[#e8e8e8] dark:border-[#2d3347] mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#41454d] dark:text-[#9297a0]">
                      <Calendar className="w-3.5 h-3.5" />Updated: {formatDate(p.updatedDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#41454d] dark:text-[#9297a0]">
                      <RefreshCw className="w-3.5 h-3.5" />Renews: {formatDate(p.renewsDate)}
                    </div>
                  </div>

                  {/* Colored bottom bar */}
                  <div className="-mx-4 -mb-4 h-[4px] rounded-b-[8px]" style={{ backgroundColor: color }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Transaction History</span>
          <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
        </div>
        <div className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Portfolio', 'Description', 'Type', 'Amount', ''].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMovements.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No movements in this period</td></tr>
                )}
                {sortedMovements.map((m, i, arr) => {
                  const portfolio = portfolios.find((p) => p.id === m.portfolioId)
                  const destPortfolio = m.type === 'TRANSFER' && m.destinationPortfolioId
                    ? portfolios.find((p) => p.id === m.destinationPortfolioId)
                    : null
                  const amtColor = m.type === 'GAIN' ? '#1a7a3c' : m.type === 'WITHDRAWAL' ? '#c0392b' : '#333840'
                  const amtSign = m.type === 'WITHDRAWAL' ? '-' : m.type === 'TRANSFER' ? '' : '+'
                  const border = i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''
                  return (
                    <tr key={m.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${border}`}>{formatDate(m.date)}</td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${border}`}>
                        {portfolio?.name ?? m.portfolioId}
                        {destPortfolio && <span className="text-[#9297a0]"> → {destPortfolio.name}</span>}
                      </td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{m.description}</td>
                      <td className={`px-4 py-[11px] ${border}`}><Badge type={m.type.toLowerCase()} /></td>
                      <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${border}`} style={{ color: amtColor }}>
                        {amtSign}{formatMXN(m.amount)}
                      </td>
                      <td className={`px-4 py-[11px] ${border}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setEditMovement(m); setMovementModal(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteMovement(m) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
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

      <PortfolioForm open={portfolioModal} onClose={() => setPortfolioModal(false)} portfolio={editPortfolio} />
      <InvestmentMovementForm open={movementModal} onClose={() => setMovementModal(false)} movement={editMovement} />
    </div>
  )
}
