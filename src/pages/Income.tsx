import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useStore } from '../store'
import Badge from '../components/ui/Badge'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import PeriodSelector from '../components/ui/PeriodSelector'
import PaycheckForm from '../components/forms/PaycheckForm'
import ManualTaxForm from '../components/forms/ManualTaxForm'
import TransferForm from '../components/forms/TransferForm'
import { filterByPeriod } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate, formatShortMonth } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Paycheck, Transfer } from '../store/types'

const CARD = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
const SECTION_LABEL = 'text-[11px] font-semibold tracking-wider text-[#9297a0] uppercase mb-4'

export default function Income() {
  const [paycheckModal, setPaycheckModal] = useState(false)
  const [editPaycheck, setEditPaycheck] = useState<Paycheck | undefined>()
  const [taxModal, setTaxModal] = useState(false)
  const [transferModal, setTransferModal] = useState(false)
  const [editTransfer, setEditTransfer] = useState<Transfer | undefined>()
  const [searchTransfer, setSearchTransfer] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const paychecks = useStore((s) => s.paychecks)
  const manualTaxes = useStore((s) => s.manualTaxes)
  const transfers = useStore((s) => s.transfers)
  const transferCategories = useStore((s) => s.settings.transferCategories)
  const deletePaycheck = useStore((s) => s.deletePaycheck)
  const deleteManualTax = useStore((s) => s.deleteManualTax)
  const deleteTransfer = useStore((s) => s.deleteTransfer)

  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: filteredPaychecks } = usePeriodFilter(paychecks)
  const filteredTaxes = filterByPeriod(manualTaxes, periodMode, periodValue)
  const filteredTransfers = filterByPeriod(transfers, periodMode, periodValue)

  const grossIncome = filteredPaychecks.reduce((s, p) => s + (p.grossAmount ?? p.mxnAmount), 0)
  const netIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
  const totalTaxes = filteredTaxes.reduce((s, t) => s + t.amount, 0)
  const totalReceived = filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const householdTotal = filteredTransfers.filter((t) => t.category === 'Household').reduce((s, t) => s + t.amount, 0)
  const rentalTotal = filteredTransfers.filter((t) => t.category === 'Rental').reduce((s, t) => s + t.amount, 0)
  const othersTotal = filteredTransfers.filter((t) => t.category === 'Others').reduce((s, t) => s + t.amount, 0)

  // Income Trend — last 7 months across all data (not period-filtered)
  const incomeTrendData = useMemo(() => {
    const byMonth: Record<string, { paycheck: number; transfers: number }> = {}
    paychecks.forEach((p) => {
      const m = p.date.slice(0, 7)
      if (!byMonth[m]) byMonth[m] = { paycheck: 0, transfers: 0 }
      byMonth[m].paycheck += p.mxnAmount
    })
    transfers.forEach((t) => {
      const m = t.date.slice(0, 7)
      if (!byMonth[m]) byMonth[m] = { paycheck: 0, transfers: 0 }
      byMonth[m].transfers += t.amount
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([month, data]) => ({
        name: formatShortMonth(month + '-01'),
        Paycheck: data.paycheck,
        Transfers: data.transfers,
      }))
  }, [paychecks, transfers])

  const barData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    filteredPaychecks.forEach((p) => {
      const m = p.date.slice(0, 7)
      byMonth[m] = (byMonth[m] ?? 0) + p.mxnAmount
    })
    const taxByMonth: Record<string, number> = {}
    filteredTaxes.forEach((t) => {
      const m = t.date.slice(0, 7)
      taxByMonth[m] = (taxByMonth[m] ?? 0) + t.amount
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, income]) => ({
        month: formatShortMonth(month + '-01'),
        Income: income,
        Tax: taxByMonth[month] ?? 0,
      }))
  }, [filteredPaychecks, filteredTaxes])

  const rateChartData = useMemo(() => {
    return paychecks
      .filter((p) => p.exchangeRate != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ month: formatShortMonth(p.date), Rate: p.exchangeRate as number }))
  }, [paychecks])

  const displayedTransfers = useMemo(() => {
    return [...filteredTransfers]
      .filter((t) => {
        const matchSearch = t.description.toLowerCase().includes(searchTransfer.toLowerCase())
        const matchCat = filterCat === 'all' || t.category === filterCat
        return matchSearch && matchCat
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredTransfers, searchTransfer, filterCat])

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-[20px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">Income</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} />
          <button
            onClick={() => setTaxModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Add Tax
          </button>
          <button
            onClick={() => { setEditTransfer(undefined); setTransferModal(true) }}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Transfer
          </button>
          <button
            onClick={() => { setEditPaycheck(undefined); setPaycheckModal(true) }}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Paycheck
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`${CARD} flex divide-x divide-[#e8e8e8] dark:divide-[#2d3347] mb-5`}>
        {[
          { label: 'GROSS INCOME', value: formatMXNCompact(grossIncome), color: '#22c55e' },
          { label: 'NET INCOME', value: formatMXNCompact(netIncome - totalTaxes), sub: totalTaxes > 0 ? `−${formatMXNCompact(totalTaxes)} taxes` : undefined, color: '#22c55e' },
          { label: 'TRANSFERS', value: formatMXNCompact(totalReceived), color: '#3b82f6' },
        ].map((kpi) => (
          <div key={kpi.label} className="flex-1 px-6 py-4">
            <div className="text-[22px] font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#9297a0] mt-0.5">{kpi.label}</div>
            {kpi.sub && <div className="text-[11px] text-[#9297a0] mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Income Trend */}
      {incomeTrendData.length > 0 && (
        <div className={`${CARD} mb-5`}>
          <div className="p-5">
            <div className={SECTION_LABEL}>Income Trend — Last 7 Months</div>
            <AreaChart
              data={incomeTrendData}
              xKey="name"
              areas={[
                { key: 'Paycheck', name: 'Paycheck', color: '#22c55e' },
                { key: 'Transfers', name: 'Transfers', color: '#3b82f6' },
              ]}
              height={240}
            />
          </div>
        </div>
      )}

      {/* Income vs Taxes + Rate Trend */}
      {(barData.length > 0 || rateChartData.length >= 2) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {barData.length > 0 && (
            <div className={`${CARD} p-5`}>
              <div className={SECTION_LABEL}>Income vs Taxes</div>
              <BarChart
                data={barData}
                bars={[
                  { key: 'Income', color: '#22c55e', name: 'Income' },
                  { key: 'Tax', color: '#ef4444', name: 'Taxes' },
                ]}
                xKey="month"
                height={220}
              />
            </div>
          )}
          {rateChartData.length >= 2 && (
            <div className={`${CARD} p-5`}>
              <div className={SECTION_LABEL}>USD/MXN Rate Trend</div>
              <LineChart
                data={rateChartData}
                lines={[{ key: 'Rate', color: '#3b82f6', name: 'USD/MXN Rate' }]}
                xKey="month"
                height={220}
              />
            </div>
          )}
        </div>
      )}

      {/* Paychecks */}
      <div className={`${CARD} mb-5`}>
        <div className="p-5 pb-0">
          <div className={SECTION_LABEL}>Paychecks</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Date', 'USD', 'Rate', 'MXN', ''].map((h, i) => (
                  <th key={i} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${['USD', 'Rate', 'MXN'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPaychecks.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#9297a0]">No paychecks in this period</td></tr>
              )}
              {[...filteredPaychecks].sort((a, b) => b.date.localeCompare(a.date)).map((p, i, arr) => {
                const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                return (
                  <tr key={p.id} className="group hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-3 text-[13px] text-[#9297a0] ${border}`}>{formatDate(p.date)}</td>
                    <td className={`px-4 py-3 text-right text-[13px] text-[#9297a0] ${border}`}>
                      {p.usdAmount != null ? `$${p.usdAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right text-[13px] text-[#9297a0] ${border}`}>
                      {p.exchangeRate != null ? p.exchangeRate.toFixed(2) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right text-[13px] font-semibold text-[#22c55e] ${border}`}>
                      {formatMXN(p.mxnAmount)}
                    </td>
                    <td className={`px-4 py-3 ${border}`}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditPaycheck(p); setPaycheckModal(true) }} className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deletePaycheck(p.id)} className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#ef4444] hover:bg-[#fdecea] transition-colors">
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

      {/* Manual Taxes */}
      <div className={`${CARD} mb-5`}>
        <div className="p-5 pb-0">
          <div className={SECTION_LABEL}>Manual Taxes</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Date', 'Description', 'Amount', ''].map((h, i) => (
                  <th key={i} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTaxes.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-[13px] text-[#9297a0]">No tax records in this period</td></tr>
              )}
              {[...filteredTaxes].sort((a, b) => b.date.localeCompare(a.date)).map((t, i, arr) => {
                const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                return (
                  <tr key={t.id} className="group hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-3 text-[13px] text-[#9297a0] ${border}`}>{formatDate(t.date)}</td>
                    <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{t.description}</td>
                    <td className={`px-4 py-3 text-right text-[13px] font-medium text-[#ef4444] ${border}`}>−{formatMXN(t.amount)}</td>
                    <td className={`px-4 py-3 ${border}`}>
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => deleteManualTax(t.id)} className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#ef4444] hover:bg-[#fdecea] transition-colors">
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

      {/* Transfers Received */}
      <div className={CARD}>
        <div className="p-5 pb-0">
          <div className={SECTION_LABEL}>Transfers Received</div>
        </div>

        {/* Breakdown tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5">
          {[
            { label: 'Household', value: householdTotal, color: '#6366f1' },
            { label: 'Rental', value: rentalTotal, color: '#14b8a6' },
            { label: 'Others', value: othersTotal, color: '#f59e0b' },
            { label: 'Total', value: totalReceived, color: '#22c55e' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#f8fafc] dark:bg-[#252b3b] rounded-[8px] px-4 py-3" style={{ borderLeft: `3px solid ${color}` }}>
              <p className="text-[11px] font-semibold uppercase mb-1 text-[#9297a0]">{label}</p>
              <p className="text-[17px] font-bold tabular-nums" style={{ color }}>{formatMXNCompact(value)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap px-5 pb-4 border-b border-[#e8e8e8] dark:border-[#2d3347]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTransfer}
              onChange={(e) => setSearchTransfer(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] focus:outline-none focus:border-[#181d26]"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0]"
          >
            <option value="all">All Categories</option>
            {transferCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <span className="text-[12px] text-[#9297a0] ml-auto tabular-nums">
            {displayedTransfers.length} {displayedTransfers.length === 1 ? 'transfer' : 'transfers'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Date', 'Category', 'Description', 'Amount', ''].map((h, i) => (
                  <th key={i} className={`text-[11px] font-semibold uppercase text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2.5 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedTransfers.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#9297a0]">No transfers found</td></tr>
              )}
              {displayedTransfers.map((t, i, arr) => {
                const border = i < arr.length - 1 ? 'border-b border-[#f4f5f7] dark:border-[#252a38]' : ''
                return (
                  <tr key={t.id} className="group hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-3 text-[13px] text-[#9297a0] whitespace-nowrap ${border}`}>{formatDate(t.date)}</td>
                    <td className={`px-4 py-3 ${border}`}>
                      <Badge type={t.category.toLowerCase()} label={t.category} />
                    </td>
                    <td className={`px-4 py-3 text-[13px] text-[#333840] dark:text-[#c4c8d0] ${border}`}>{t.description}</td>
                    <td className={`px-4 py-3 text-right text-[13px] font-semibold text-[#22c55e] ${border}`}>{formatMXN(t.amount)}</td>
                    <td className={`px-4 py-3 ${border}`}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditTransfer(t); setTransferModal(true) }} className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteTransfer(t.id)} className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#ef4444] hover:bg-[#fdecea] transition-colors">
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

      <PaycheckForm open={paycheckModal} onClose={() => setPaycheckModal(false)} paycheck={editPaycheck} />
      <ManualTaxForm open={taxModal} onClose={() => setTaxModal(false)} />
      <TransferForm open={transferModal} onClose={() => setTransferModal(false)} transfer={editTransfer} />
    </div>
  )
}
