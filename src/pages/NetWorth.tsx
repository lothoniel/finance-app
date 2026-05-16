import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import DonutChart from '../components/charts/DonutChart'
import { sortByDateDesc } from '../lib/filters'
import { formatMoney, formatMoneyCompact } from '../lib/formatters'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'
const portfolioColors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6']

export default function NetWorth() {
  const { t } = useTranslation()
  const portfolios = useStore((s) => s.portfolios)
  const mortgageConfig = useStore((s) => s.mortgageConfig)
  const mortgagePayments = useStore((s) => s.mortgagePayments)
  const currency = useStore((s) => s.settings.currencyDisplay)

  const totalAssets = portfolios.reduce((s, p) => s + p.balance, 0)

  const currentMortgageBalance = useMemo(() => {
    if (mortgagePayments.length === 0) return mortgageConfig.principal
    return sortByDateDesc(mortgagePayments)[0].balanceAfter
  }, [mortgagePayments, mortgageConfig.principal])

  const totalLiabilities = currentMortgageBalance
  const netWorth = totalAssets - totalLiabilities
  const paidOffPct = (1 - currentMortgageBalance / mortgageConfig.principal) * 100
  const amountPaid = mortgageConfig.principal - currentMortgageBalance

  const donutData = portfolios.map((p, i) => ({
    name: p.name,
    value: p.balance,
    color: portfolioColors[i % portfolioColors.length],
  }))

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('netWorth.title')}</h1>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {[
          { key: 'netWorth', label: t('netWorth.kpis.netWorth'), value: formatMoneyCompact(netWorth, currency), color: netWorth >= 0 ? '#1a7a3c' : '#c0392b' },
          { key: 'totalAssets', label: t('netWorth.kpis.totalAssets'), value: formatMoneyCompact(totalAssets, currency), color: '#181d26' },
          { key: 'totalLiabilities', label: t('netWorth.kpis.totalLiabilities'), value: formatMoneyCompact(totalLiabilities, currency), color: '#c0392b' },
        ].map((kpi) => (
          <div key={kpi.key} className="flex-1 px-6 py-4 min-w-0">
            <div className="text-[22px] font-bold dark:text-[#e8eaf0]" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Assets + Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Assets donut */}
        <div className={`${CARD} p-5`}>
          <p className={SECTION_LABEL}>{t('netWorth.sections.assets')}</p>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} centerLabel={t('netWorth.assets.centerLabel')} centerValue={formatMoneyCompact(totalAssets, currency)} height={220} />
          ) : (
            <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">{t('netWorth.assets.empty')}</p>
          )}
        </div>

        {/* Liabilities — mortgage only */}
        <div className={`${CARD} p-5`}>
          <p className={SECTION_LABEL}>{t('netWorth.sections.liabilities')}</p>

          <div className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{t('netWorth.liabilities.mortgage')}</p>
                <p className="text-[12px] text-[#9297a0] mt-0.5">{t('netWorth.liabilities.annualRate', { rate: mortgageConfig.interestRate })}</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold text-[#c0392b]">{formatMoneyCompact(currentMortgageBalance, currency)}</p>
                <p className="text-[11px] text-[#9297a0]">{t('netWorth.liabilities.remainingBalance')}</p>
              </div>
            </div>

            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-[11px] text-[#9297a0] uppercase font-semibold tracking-wider">{t('netWorth.liabilities.monthlyPayment')}</p>
                <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mt-0.5">{formatMoney(mortgageConfig.minimumPayment, currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9297a0] uppercase font-semibold tracking-wider">{t('netWorth.liabilities.paidOff')}</p>
                <p className="text-[14px] font-semibold text-[#1a7a3c] mt-0.5">{paidOffPct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9297a0] uppercase font-semibold tracking-wider">{t('netWorth.liabilities.original')}</p>
                <p className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mt-0.5">{formatMoneyCompact(mortgageConfig.principal, currency)}</p>
              </div>
            </div>

            <div>
              <div className="h-[8px] bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1a7a3c] transition-all"
                  style={{ width: `${Math.min(Math.max(paidOffPct, 0), 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-[#9297a0]">{t('netWorth.liabilities.paid', { amount: formatMoneyCompact(amountPaid, currency) })}</span>
                <span className="text-[11px] text-[#9297a0]">{t('netWorth.liabilities.left', { amount: formatMoneyCompact(currentMortgageBalance, currency) })}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e8e8e8] dark:border-[#2d3347] flex justify-between">
            <span className="text-[13px] text-[#9297a0]">{t('netWorth.liabilities.total')}</span>
            <span className="text-[13px] font-semibold text-[#c0392b]">{formatMoneyCompact(totalLiabilities, currency)}</span>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings table */}
      <div className={CARD}>
        <div className="p-5 pb-0">
          <p className={SECTION_LABEL}>{t('netWorth.sections.portfolioHoldings')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  { key: 'name', label: t('netWorth.table.name') },
                  { key: 'type', label: t('netWorth.table.type') },
                  { key: 'apy', label: t('netWorth.table.apy') },
                  { key: 'balance', label: t('netWorth.table.balance') },
                  { key: 'allocation', label: t('netWorth.table.allocation') },
                ].map((h, i) => (
                  <th
                    key={h.key}
                    className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-5 ${i >= 2 ? 'text-right' : 'text-left'}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolios.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">{t('netWorth.table.empty')}</td></tr>
              )}
              {portfolios.map((p, i, arr) => {
                const color = portfolioColors[i % portfolioColors.length]
                const alloc = totalAssets > 0 ? (p.balance / totalAssets) * 100 : 0
                const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                return (
                  <tr key={p.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    {/* Name */}
                    <td className={`px-5 py-3.5 ${border}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{p.name}</span>
                      </div>
                    </td>
                    {/* Type */}
                    <td className={`px-5 py-3.5 ${border}`}>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#eef8f4] text-[#2e7d65]">{p.type}</span>
                    </td>
                    {/* APY */}
                    <td className={`px-5 py-3.5 text-right ${border}`}>
                      <span className="text-[13px] font-semibold" style={{ color: p.apy >= 10 ? '#1a7a3c' : '#c8912a' }}>{p.apy}%</span>
                    </td>
                    {/* Balance */}
                    <td className={`px-5 py-3.5 text-right ${border}`}>
                      <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{formatMoneyCompact(p.balance, currency)}</span>
                    </td>
                    {/* Allocation bar + % */}
                    <td className={`px-5 py-3.5 text-right ${border}`}>
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-16 h-[4px] bg-[#f0f2f5] dark:bg-[#252b3b] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${alloc}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[13px] text-[#41454d] dark:text-[#9297a0] w-10 text-right">{alloc.toFixed(1)}%</span>
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
  )
}
