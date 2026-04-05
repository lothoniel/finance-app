import { useState, useMemo } from 'react'
import { Plus, TrendingUp, ArrowUpCircle, BarChart2, Calendar, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import DonutChart from '../components/charts/DonutChart'
import Badge from '../components/ui/Badge'
import PortfolioForm from '../components/forms/PortfolioForm'
import InvestmentMovementForm from '../components/forms/InvestmentMovementForm'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import type { Portfolio, InvestmentMovement } from '../store/types'

function now(): PeriodValue {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

const portfolioColors = ['#6B3FA0', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4']

export default function PortfolioPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(now())
  const [portfolioModal, setPortfolioModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | undefined>()
  const [editMovement, setEditMovement] = useState<InvestmentMovement | undefined>()

  const portfolios = useStore((s) => s.portfolios)
  const investmentMovements = useStore((s) => s.investmentMovements)
  const deleteInvestmentMovement = useStore((s) => s.deleteInvestmentMovement)

  const filteredMovements = filterByPeriod(investmentMovements, periodMode, periodValue)
  const totalGains = filteredMovements.filter((m) => m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
  const totalDeposits = filteredMovements.filter((m) => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
  const totalNetWorth = portfolios.reduce((s, p) => s + p.balance, 0)

  const donutData = portfolios.map((p, i) => ({
    name: p.name,
    value: p.balance,
    color: portfolioColors[i % portfolioColors.length],
  }))

  // Return % per portfolio (all-time gains / all-time deposits)
  const returnPct = useMemo(() => {
    const result: Record<string, string> = {}
    for (const p of portfolios) {
      const gains = investmentMovements.filter((m) => m.portfolioId === p.id && m.type === 'GAIN').reduce((s, m) => s + m.amount, 0)
      const deposits = investmentMovements.filter((m) => m.portfolioId === p.id && m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0)
      result[p.id] = deposits > 0 ? (gains / deposits * 100).toFixed(2) + '%' : '—'
    }
    return result
  }, [portfolios, investmentMovements])

  // Last gain per portfolio
  const lastGain = useMemo(() => {
    const result: Record<string, number> = {}
    investmentMovements
      .filter((m) => m.type === 'GAIN')
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((m) => {
        if (!result[m.portfolioId]) {
          result[m.portfolioId] = m.amount
        }
      })
    return result
  }, [investmentMovements])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector mode={periodMode} value={periodValue} onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }} />
        <div className="flex gap-2">
          <button
            onClick={() => { setEditMovement(undefined); setMovementModal(true) }}
            className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Add Movement
          </button>
          <button
            onClick={() => { setEditPortfolio(undefined); setPortfolioModal(true) }}
            className="flex items-center gap-2 bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Portfolio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Yield"
          value={formatMXNCompact(totalGains)}
          subtitle={`In selected period`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="#22C55E"
        />
        <KpiCard
          title="Total Deposits"
          value={formatMXNCompact(totalDeposits)}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          accent="#3B82F6"
        />
        <KpiCard
          title="Total Net Worth"
          value={formatMXNCompact(totalNetWorth)}
          subtitle="Current portfolio balances"
          icon={<BarChart2 className="w-5 h-5" />}
          accent="#6B3FA0"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Asset Allocation</p>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              centerLabel="Total"
              centerValue={formatMXNCompact(totalNetWorth)}
              height={220}
            />
          ) : (
            <p className="text-center py-8 text-sm text-gray-400">No portfolios yet</p>
          )}
        </div>

        {/* Portfolio cards */}
        <div className="space-y-3">
          {portfolios.map((p, i) => {
            const color = portfolioColors[i % portfolioColors.length]
            const gain = lastGain[p.id]
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-4 border border-gray-200 dark:border-[#2D3448] shadow-sm cursor-pointer hover:border-[#6B3FA0] transition-colors"
                onClick={() => { setEditPortfolio(p); setPortfolioModal(true) }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mt-1">
                      {p.type}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">APY</p>
                      <p className="text-sm font-bold" style={{ color }}>{p.apy}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Return</p>
                      <p className="text-sm font-bold text-green-500">{returnPct[p.id]}</p>
                    </div>
                  </div>
                </div>

                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMXNCompact(p.balance)}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-[#2D3448]">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated: {formatDate(p.updatedDate)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Renews: {formatDate(p.renewsDate)}
                  </div>
                </div>

                {gain !== undefined && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    Last Gain: +{formatMXN(gain)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Movements table */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3448]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Investment Deposits & Gains</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Portfolio</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
              {filteredMovements.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No movements in this period</td></tr>
              )}
              {filteredMovements.sort((a, b) => b.date.localeCompare(a.date)).map((m) => {
                const portfolio = portfolios.find((p) => p.id === m.portfolioId)
                return (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="px-5 py-3 text-gray-900 dark:text-white">{portfolio?.name ?? m.portfolioId}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{m.description}</td>
                    <td className="px-5 py-3"><Badge type={m.type.toLowerCase()} /></td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ color: m.type === 'GAIN' ? '#F59E0B' : m.type === 'WITHDRAWAL' ? '#EF4444' : '#22C55E' }}>
                      {m.type === 'WITHDRAWAL' ? '-' : '+'}{formatMXN(m.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditMovement(m); setMovementModal(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#6B3FA0] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteInvestmentMovement(m.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      <PortfolioForm open={portfolioModal} onClose={() => setPortfolioModal(false)} portfolio={editPortfolio} />
      <InvestmentMovementForm open={movementModal} onClose={() => setMovementModal(false)} movement={editMovement} />
    </div>
  )
}
