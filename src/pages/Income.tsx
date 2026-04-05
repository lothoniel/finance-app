import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import PeriodSelector from '../components/ui/PeriodSelector'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import PaycheckForm from '../components/forms/PaycheckForm'
import ManualTaxForm from '../components/forms/ManualTaxForm'
import TransferForm from '../components/forms/TransferForm'
import { filterByPeriod, type PeriodMode, type PeriodValue } from '../lib/filters'
import { formatMXN, formatMXNCompact, formatDate, formatShortMonth } from '../lib/formatters'
import type { Paycheck, Transfer } from '../store/types'

function now(): PeriodValue {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export default function Income() {
  const [tab, setTab] = useState('paychecks')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')
  const [periodValue, setPeriodValue] = useState<PeriodValue>(now())
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

  const filteredPaychecks = filterByPeriod(paychecks, periodMode, periodValue)
  const filteredTaxes = filterByPeriod(manualTaxes, periodMode, periodValue)
  const filteredTransfers = filterByPeriod(transfers, periodMode, periodValue)

  const grossIncome = filteredPaychecks.reduce((s, p) => s + (p.grossAmount ?? p.mxnAmount), 0)
  const netIncome = filteredPaychecks.reduce((s, p) => s + p.mxnAmount, 0)
  const totalTaxes = filteredTaxes.reduce((s, t) => s + t.amount, 0)

  const totalReceived = filteredTransfers.reduce((s, t) => s + t.amount, 0)
  const householdTotal = filteredTransfers.filter((t) => t.category === 'Household').reduce((s, t) => s + t.amount, 0)
  const rentalTotal = filteredTransfers.filter((t) => t.category === 'Rental').reduce((s, t) => s + t.amount, 0)
  const othersTotal = filteredTransfers.filter((t) => t.category === 'Others').reduce((s, t) => s + t.amount, 0)

  // Bar chart data — grouped by month
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

  const displayedTransfers = filteredTransfers.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(searchTransfer.toLowerCase())
    const matchCat = filterCat === 'all' || t.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { id: 'paychecks', label: 'Paychecks' },
          { id: 'transfers', label: 'Transfers' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'paychecks' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodSelector mode={periodMode} value={periodValue} onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }} />
            <button
              onClick={() => { setEditPaycheck(undefined); setPaycheckModal(true) }}
              className="flex items-center gap-2 bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Paycheck
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Gross Income" value={formatMXNCompact(grossIncome)} accent="#22C55E" />
            <KpiCard title="Manual Taxes" value={formatMXNCompact(totalTaxes)} accent="#EF4444" />
            <KpiCard title="Net Income" value={formatMXNCompact(netIncome - totalTaxes)} accent="#6B3FA0" />
          </div>

          {/* Paycheck Records */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3448]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Paycheck Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="text-xs text-gray-500 dark:text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-right px-5 py-3 font-medium">USD</th>
                    <th className="text-right px-5 py-3 font-medium">Rate</th>
                    <th className="text-right px-5 py-3 font-medium">MXN</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                  {filteredPaychecks.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No paychecks in this period</td></tr>
                  )}
                  {[...filteredPaychecks].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatDate(p.date)}</td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                        {p.usdAmount != null ? `$${p.usdAmount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                        {p.exchangeRate != null ? p.exchangeRate.toFixed(2) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-white">
                        {formatMXN(p.mxnAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditPaycheck(p); setPaycheckModal(true) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#6B3FA0] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deletePaycheck(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
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

          {/* Exchange Rate Trend */}
          {rateChartData.length >= 2 && (
            <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">USD/MXN Exchange Rate Trend</p>
              <LineChart
                data={rateChartData}
                lines={[{ key: 'Rate', color: '#6B3FA0', name: 'USD/MXN Rate' }]}
                xKey="month"
                height={200}
              />
            </div>
          )}

          {/* Manual Taxes */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2D3448] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manual Taxes</h3>
              <button
                onClick={() => setTaxModal(true)}
                className="flex items-center gap-1.5 text-[#6B3FA0] text-sm font-medium hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Tax Record
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="text-xs text-gray-500 dark:text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Description</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                  {filteredTaxes.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No tax records in this period</td></tr>
                  )}
                  {[...filteredTaxes].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatDate(t.date)}</td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{t.description}</td>
                      <td className="px-5 py-3 text-right text-red-500 font-semibold">-{formatMXN(t.amount)}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => deleteManualTax(t.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors float-right"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart */}
          {barData.length > 0 && (
            <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Income vs Manual Taxes</p>
              <BarChart
                data={barData}
                bars={[
                  { key: 'Income', color: '#22C55E', name: 'Income' },
                  { key: 'Tax', color: '#EF4444', name: 'Taxes' },
                ]}
                xKey="month"
                height={220}
              />
            </div>
          )}
        </>
      )}

      {tab === 'transfers' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodSelector mode={periodMode} value={periodValue} onChange={(m, v) => { setPeriodMode(m); setPeriodValue(v) }} />
            <button
              onClick={() => { setEditTransfer(undefined); setTransferModal(true) }}
              className="flex items-center gap-2 bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transfer
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Received" value={formatMXNCompact(totalReceived)} accent="#3B82F6" />
            <KpiCard title="Household" value={formatMXNCompact(householdTotal)} accent="#6B3FA0" />
            <KpiCard title="Rental" value={formatMXNCompact(rentalTotal)} accent="#22C55E" />
            <KpiCard title="Others" value={formatMXNCompact(othersTotal)} accent="#F59E0B" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTransfer}
                onChange={(e) => setSearchTransfer(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-[#2D3448] rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
            >
              <option value="all">All Categories</option>
              {transferCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="text-xs text-gray-500 dark:text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Category</th>
                    <th className="text-left px-5 py-3 font-medium">Description</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                  {displayedTransfers.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No transfers found</td></tr>
                  )}
                  {[...displayedTransfers].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{formatDate(t.date)}</td>
                      <td className="px-5 py-3">
                        <Badge type={t.category.toLowerCase()} label={t.category} />
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{t.description}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-600">{formatMXN(t.amount)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditTransfer(t); setTransferModal(true) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#6B3FA0] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTransfer(t.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
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
        </>
      )}

      <PaycheckForm open={paycheckModal} onClose={() => setPaycheckModal(false)} paycheck={editPaycheck} />
      <ManualTaxForm open={taxModal} onClose={() => setTaxModal(false)} />
      <TransferForm open={transferModal} onClose={() => setTransferModal(false)} transfer={editTransfer} />
    </div>
  )
}
