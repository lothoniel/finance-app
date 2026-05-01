import { useState, useMemo } from 'react'
import { Plus, TrendingUp, Calendar, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import PeriodTabs from '../components/ui/PeriodTabs'
import SectionTitle from '../components/ui/SectionTitle'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/charts/DonutChart'
import PortfolioForm from '../components/forms/PortfolioForm'
import InvestmentMovementForm from '../components/forms/InvestmentMovementForm'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Portfolio, InvestmentMovement } from '../store/types'

const portfolioColors = ['#2e7d65', '#1a7a3c', '#c8912a', '#c0392b', '#181d26', '#41454d']

export default function PortfolioPage() {
  const [portfolioModal, setPortfolioModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | undefined>()
  const [editMovement, setEditMovement] = useState<InvestmentMovement | undefined>()

  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const deleteInvestmentMovement = useStore((s) => s.deleteInvestmentMovement)

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
      result[p.id] = deposits > 0 ? (gains / deposits * 100).toFixed(2) + '%' : '—'
    }
    return result
  }, [portfolios, investmentMovements])

  const lastGain = useMemo(() => {
    const result: Record<string, number> = {}
    investmentMovements
      .filter((m) => m.type === 'GAIN')
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((m) => { if (!result[m.portfolioId]) result[m.portfolioId] = m.amount })
    return result
  }, [investmentMovements])

  const sortedMovements = useMemo(
    () => [...filteredMovements].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredMovements]
  )

  return (
    <div>
      <HeroBand color="#2e7d65">
        <div className="flex justify-end gap-2 mb-4 md:mb-0 md:absolute md:top-7 md:right-10">
          <HeroAction variant="ghost" onClick={() => { setEditMovement(undefined); setMovementModal(true) }}>
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />Add Movement
          </HeroAction>
          <HeroAction variant="primary" onClick={() => { setEditPortfolio(undefined); setPortfolioModal(true) }}>
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Portfolio
          </HeroAction>
        </div>
        <div className="mb-6">
          <PeriodTabs mode={periodMode} value={periodValue} onChange={onPeriodChange} variant="light" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi label="Total Net Worth" value={formatMXN(totalNetWorth)} sub="Current balances" />
          <HeroKpi label="Total Yield" value={formatMXN(totalGains)} sub="In selected period" />
          <HeroKpi label="Total Deposits" value={formatMXN(totalDeposits)} />
        </div>
      </HeroBand>

      {/* Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
          <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Asset Allocation</p>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel="Total" centerValue={formatMXNCompact(totalNetWorth)} height={220} />
          ) : (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No portfolios yet</p>
          )}
        </div>

        <div className="space-y-3">
          {portfolios.length === 0 && (
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-8 text-center">
              <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">No portfolios yet. Add one to get started.</p>
            </div>
          )}
          {portfolios.map((p, i) => {
            const color = portfolioColors[i % portfolioColors.length]
            const gain = lastGain[p.id]
            const alloc = totalNetWorth > 0 ? (p.balance / totalNetWorth * 100) : 0
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4 cursor-pointer hover:border-[#181d26] dark:hover:border-[#9297a0] transition-colors"
                onClick={() => { setEditPortfolio(p); setPortfolioModal(true) }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#eef8f4] text-[#2e7d65]">{p.type}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px]"
                        style={{ backgroundColor: p.apy >= 10 ? '#eef8f4' : '#fff1ec', color: p.apy >= 10 ? '#2e7d65' : '#aa2d00' }}>
                        {p.apy}% APY
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#41454d] dark:text-[#9297a0]">Return</p>
                    <p className="text-[13px] font-semibold text-[#1a7a3c]">{returnPct[p.id]}</p>
                  </div>
                </div>

                <p className="text-[28px] font-normal text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(p.balance)}</p>

                {gain !== undefined && (
                  <p className="text-[12px] text-[#1a7a3c] mt-1">Last gain: +{formatMXN(gain)}</p>
                )}

                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#41454d] dark:text-[#9297a0]">Portfolio allocation</span>
                    <span className="text-[11px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{alloc.toFixed(1)}%</span>
                  </div>
                  <div className="h-[6px] bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${alloc}%`, backgroundColor: color }} />
                  </div>
                </div>

                <div className="flex justify-between mt-3 pt-3 border-t border-[#e8e8e8] dark:border-[#2d3347]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#41454d] dark:text-[#9297a0]">
                    <Calendar className="w-3.5 h-3.5" />Updated: {formatDate(p.updatedDate)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#41454d] dark:text-[#9297a0]">
                    <RefreshCw className="w-3.5 h-3.5" />Renews: {formatDate(p.renewsDate)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <SectionTitle>Transaction History</SectionTitle>
        <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
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
                  const amtColor = m.type === 'GAIN' ? '#1a7a3c' : m.type === 'WITHDRAWAL' ? '#c0392b' : '#333840'
                  return (
                    <tr key={m.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(m.date)}</td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#181d26] dark:text-[#e8eaf0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{portfolio?.name ?? m.portfolioId}</td>
                      <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{m.description}</td>
                      <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}><Badge type={m.type.toLowerCase()} /></td>
                      <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: amtColor }}>
                        {m.type === 'WITHDRAWAL' ? '-' : '+'}{formatMXN(m.amount)}
                      </td>
                      <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditMovement(m); setMovementModal(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteInvestmentMovement(m.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
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
