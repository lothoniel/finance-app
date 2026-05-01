import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import PeriodTabs from '../components/ui/PeriodTabs'
import SectionTitle from '../components/ui/SectionTitle'
import Badge from '../components/ui/Badge'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import PaycheckForm from '../components/forms/PaycheckForm'
import ManualTaxForm from '../components/forms/ManualTaxForm'
import TransferForm from '../components/forms/TransferForm'
import { filterByPeriod } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate, formatShortMonth } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import type { Paycheck, Transfer } from '../store/types'

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

  const cardStyle = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden'

  return (
    <div>
      <HeroBand color="#2e7d65">
        <div className="flex justify-end gap-2 mb-4 md:mb-0 md:absolute md:top-7 md:right-10">
          <HeroAction variant="ghost" onClick={() => setTaxModal(true)}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Add Tax
          </HeroAction>
          <HeroAction variant="ghost" onClick={() => { setEditTransfer(undefined); setTransferModal(true) }}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Add Transfer
          </HeroAction>
          <HeroAction variant="primary" onClick={() => { setEditPaycheck(undefined); setPaycheckModal(true) }}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Add Paycheck
          </HeroAction>
        </div>
        <div className="mb-6">
          <PeriodTabs mode={periodMode} value={periodValue} onChange={onPeriodChange} variant="light" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <HeroKpi label="Gross Income" value={formatMXN(grossIncome)} />
          <HeroKpi label="Net Income" value={formatMXN(netIncome - totalTaxes)} sub={`−${formatMXNCompact(totalTaxes)} taxes`} />
          <HeroKpi label="Transfers Received" value={formatMXN(totalReceived)} />
        </div>
      </HeroBand>

      {/* Charts */}
      {(barData.length > 0 || rateChartData.length >= 2) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {barData.length > 0 && (
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
              <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">Income vs Taxes</p>
              <BarChart
                data={barData}
                bars={[
                  { key: 'Income', color: '#1a7a3c', name: 'Income' },
                  { key: 'Tax', color: '#c0392b', name: 'Taxes' },
                ]}
                xKey="month"
                height={220}
              />
            </div>
          )}
          {rateChartData.length >= 2 && (
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
              <p className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] mb-4">USD/MXN Rate Trend</p>
              <LineChart
                data={rateChartData}
                lines={[{ key: 'Rate', color: '#2e7d65', name: 'USD/MXN Rate' }]}
                xKey="month"
                height={200}
              />
            </div>
          )}
        </div>
      )}

      {/* Paychecks */}
      <div className="mb-8">
        <SectionTitle>Paychecks</SectionTitle>
        <div className={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'USD', 'Rate', 'MXN', ''].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'USD' || h === 'Rate' || h === 'MXN' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPaychecks.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No paychecks in this period</td></tr>
                )}
                {[...filteredPaychecks].sort((a, b) => b.date.localeCompare(a.date)).map((p, i, arr) => (
                  <tr key={p.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(p.date)}</td>
                    <td className={`px-4 py-[11px] text-right text-[13px] text-[#41454d] dark:text-[#9297a0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      {p.usdAmount != null ? `$${p.usdAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className={`px-4 py-[11px] text-right text-[13px] text-[#41454d] dark:text-[#9297a0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      {p.exchangeRate != null ? p.exchangeRate.toFixed(2) : '—'}
                    </td>
                    <td className={`px-4 py-[11px] text-right text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      {formatMXN(p.mxnAmount)}
                    </td>
                    <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditPaycheck(p); setPaycheckModal(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deletePaycheck(p.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Taxes */}
      <div className="mb-8">
        <SectionTitle>Manual Taxes</SectionTitle>
        <div className={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Description', 'Amount', ''].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTaxes.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No tax records in this period</td></tr>
                )}
                {[...filteredTaxes].sort((a, b) => b.date.localeCompare(a.date)).map((t, i, arr) => (
                  <tr key={t.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(t.date)}</td>
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{t.description}</td>
                    <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#c0392b' }}>−{formatMXN(t.amount)}</td>
                    <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      <button onClick={() => deleteManualTax(t.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors float-right">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfers */}
      <div>
        <SectionTitle>Transfers Received</SectionTitle>

        {/* Breakdown row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Household', value: householdTotal, color: '#2e7d65' },
            { label: 'Rental', value: rentalTotal, color: '#1a7a3c' },
            { label: 'Others', value: othersTotal, color: '#c8912a' },
            { label: 'Total', value: totalReceived, color: '#181d26' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
              <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] mb-1">{label}</p>
              <p className="text-[20px] font-normal text-[#181d26] dark:text-[#e8eaf0] tabular-nums">{formatMXNCompact(value)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d]" />
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
          <span className="text-[12px] text-[#41454d] dark:text-[#9297a0] ml-auto tabular-nums">
            {displayedTransfers.length} {displayedTransfers.length === 1 ? 'transfer' : 'transfers'}
          </span>
        </div>

        <div className={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date', 'Category', 'Description', 'Amount', ''].map((h, i) => (
                    <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedTransfers.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No transfers found</td></tr>
                )}
                {displayedTransfers.map((t, i, arr) => (
                  <tr key={t.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] whitespace-nowrap ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{formatDate(t.date)}</td>
                    <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      <Badge type={t.category.toLowerCase()} label={t.category} />
                    </td>
                    <td className={`px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>{t.description}</td>
                    <td className={`px-4 py-[11px] text-right text-[13px] font-medium ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`} style={{ color: '#1a7a3c' }}>{formatMXN(t.amount)}</td>
                    <td className={`px-4 py-[11px] ${i < arr.length - 1 ? 'border-b border-[#e8e8e8] dark:border-[#2d3347]' : ''}`}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditTransfer(t); setTransferModal(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteTransfer(t.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PaycheckForm open={paycheckModal} onClose={() => setPaycheckModal(false)} paycheck={editPaycheck} />
      <ManualTaxForm open={taxModal} onClose={() => setTaxModal(false)} />
      <TransferForm open={transferModal} onClose={() => setTransferModal(false)} transfer={editTransfer} />
    </div>
  )
}
