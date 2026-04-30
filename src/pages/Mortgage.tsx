import { useState, useMemo, useEffect } from 'react'
import { Plus, Home, Pencil, Trash2, Calculator, Users } from 'lucide-react'
import { useStore } from '../store'
import KpiCard from '../components/ui/KpiCard'
import LineChart from '../components/charts/LineChart'
import Tabs from '../components/ui/Tabs'
import PeriodSelector from '../components/ui/PeriodSelector'
import MortgagePaymentForm from '../components/forms/MortgagePaymentForm'
import MortgageContributionForm from '../components/forms/MortgageContributionForm'
import { formatMXN, formatMXNCompact, formatDate } from '../lib/formatters'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import { monthsRemaining, totalInterestRemaining, buildBalanceSeries } from '../lib/mortgage'
import type { MortgagePayment, MortgageContribution } from '../store/types'

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + Math.round(months))
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function formatDuration(months: number): string {
  if (!isFinite(months)) return '—'
  const m = Math.round(months)
  const y = Math.floor(m / 12)
  const rem = m % 12
  if (y === 0) return `${rem}mo`
  if (rem === 0) return `${y}yr`
  return `${y}yr ${rem}mo`
}

// Accent colors cycled per unique contributor
const CONTRIBUTOR_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function MortgagePage() {
  const config = useStore((s) => s.mortgageConfig)
  const payments = useStore((s) => s.mortgagePayments)
  const contributions = useStore((s) => s.mortgageContributions)
  const deleteMortgagePayment = useStore((s) => s.deleteMortgagePayment)
  const deleteMortgageContribution = useStore((s) => s.deleteMortgageContribution)
  const addMortgageContribution = useStore((s) => s.addMortgageContribution)

  // Seed historical contributions once if store is empty
  useEffect(() => {
    if (contributions.length > 0) return
    const seed: MortgageContribution[] = [
      { id: 'mc-001', date: '2025-05-01', by: 'Jorge', description: 'Carta promesa', amount: 150000 },
      { id: 'mc-002', date: '2025-05-01', by: 'Caro',  description: 'Boleta Aviso', amount: 1419 },
      { id: 'mc-003', date: '2025-05-15', by: 'Jorge', description: 'Enganche', amount: 80205.10 },
      { id: 'mc-004', date: '2025-05-15', by: 'Caro',  description: 'Enganche', amount: 230205.10 },
      { id: 'mc-005', date: '2025-05-24', by: 'Jorge', description: 'Mensualidad May 25', amount: 16000 },
      { id: 'mc-006', date: '2025-05-24', by: 'Caro',  description: 'Mensualidad May 25', amount: 16000 },
      { id: 'mc-007', date: '2025-06-04', by: 'Jorge', description: 'Anticipo Herrero', amount: 3350 },
      { id: 'mc-008', date: '2025-06-04', by: 'Caro',  description: 'Anticipo Herrero', amount: 3350 },
      { id: 'mc-009', date: '2025-06-30', by: 'Jorge', description: 'Mensualidad Junio 25', amount: 16000 },
      { id: 'mc-010', date: '2025-06-30', by: 'Caro',  description: 'Mensualidad Junio 25', amount: 16000 },
      { id: 'mc-011', date: '2025-07-30', by: 'Jorge', description: 'Mensualidad Julio 25', amount: 16000 },
      { id: 'mc-012', date: '2025-07-30', by: 'Caro',  description: 'Mensualidad Julio 25', amount: 16000 },
      { id: 'mc-013', date: '2025-08-28', by: 'Jorge', description: 'Mensualidad Agosto 25', amount: 16000 },
      { id: 'mc-014', date: '2025-08-29', by: 'Caro',  description: 'Mensualidad Agosto 25', amount: 16000 },
      { id: 'mc-015', date: '2025-09-30', by: 'Jorge', description: 'Mensualidad Sep 25', amount: 16000 },
      { id: 'mc-016', date: '2025-09-30', by: 'Caro',  description: 'Mensualidad Sep 25', amount: 16000 },
      { id: 'mc-017', date: '2025-09-30', by: 'Papa',  description: 'Mensualidad Sep 25', amount: 12000 },
      { id: 'mc-018', date: '2025-10-30', by: 'Jorge', description: 'Mensualidad Oct 25', amount: 16000 },
      { id: 'mc-019', date: '2025-10-30', by: 'Caro',  description: 'Mensualidad Oct 25', amount: 16000 },
      { id: 'mc-020', date: '2025-10-30', by: 'Papa',  description: 'Mensualidad Oct 25', amount: 12300 },
      { id: 'mc-021', date: '2025-11-12', by: 'Papa',  description: 'Abono Nov 25', amount: 55834 },
      { id: 'mc-022', date: '2025-11-12', by: 'Caro',  description: 'Mensualidad Nov 25', amount: 16000 },
      { id: 'mc-023', date: '2025-12-01', by: 'Jorge', description: 'Mensualidad Nov 25', amount: 16000 },
      { id: 'mc-024', date: '2025-12-30', by: 'Caro',  description: 'Mensualidad Dic 25', amount: 16000 },
      { id: 'mc-025', date: '2025-12-30', by: 'Jorge', description: 'Mensualidad Dic 25', amount: 16000 },
      { id: 'mc-026', date: '2026-01-30', by: 'Caro',  description: 'Mensualidad Ene 26', amount: 16000 },
      { id: 'mc-027', date: '2026-01-30', by: 'Jorge', description: 'Mensualidad Ene 26', amount: 16000 },
      { id: 'mc-028', date: '2026-02-09', by: 'Renta', description: 'Abono a capital de la Renta Feb', amount: 16000 },
      { id: 'mc-029', date: '2026-02-28', by: 'Jorge', description: 'Mensualidad Feb 26', amount: 16000 },
      { id: 'mc-030', date: '2026-03-01', by: 'Caro',  description: 'Mensualidad Feb 26', amount: 16000 },
      { id: 'mc-031', date: '2026-03-01', by: 'Renta', description: 'Abono a capital de la Renta Mar', amount: 16000 },
      { id: 'mc-032', date: '2026-04-01', by: 'Jorge', description: 'Mensualidad Mar 26', amount: 16000 },
      { id: 'mc-033', date: '2026-04-01', by: 'Caro',  description: 'Mensualidad Mar 26', amount: 16000 },
      { id: 'mc-034', date: '2026-04-01', by: 'Renta', description: 'Abono a capital de la Renta Abr', amount: 16000 },
      { id: 'mc-035', date: '2026-04-01', by: 'Papa',  description: 'Abono Mar 26', amount: 10666 },
    ]
    seed.forEach((c) => addMortgageContribution(c))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [tab, setTab] = useState('overview')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<MortgagePayment | undefined>()
  const [contribModalOpen, setContribModalOpen] = useState(false)
  const [editContrib, setEditContrib] = useState<MortgageContribution | undefined>()
  const [simAmount, setSimAmount] = useState('')
  const { mode: periodMode, value: periodValue, onChange: onPeriodChange, filtered: filteredContribs } = usePeriodFilter(contributions, 'year')

  // ── Overview calculations ──────────────────────────────────────────────────
  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  )

  const currentBalance = sorted[0]?.balanceAfter ?? config.principal
  const totalExtraCapital = payments.reduce((s, p) => s + p.extraCapital, 0)

  const origMonthsLeft = useMemo(
    () => monthsRemaining(config.principal, config.interestRate, config.minimumPayment),
    [config]
  )
  const actualMonthsLeft = useMemo(
    () => monthsRemaining(currentBalance, config.interestRate, config.minimumPayment),
    [currentBalance, config]
  )
  const monthsSaved = useMemo(
    () => isFinite(origMonthsLeft) && isFinite(actualMonthsLeft)
      ? Math.max(0, origMonthsLeft - actualMonthsLeft)
      : 0,
    [origMonthsLeft, actualMonthsLeft]
  )

  const origInterestRemaining = useMemo(
    () => totalInterestRemaining(config.principal, config.interestRate, origMonthsLeft),
    [config, origMonthsLeft]
  )
  const actualInterestRemaining = useMemo(
    () => totalInterestRemaining(currentBalance, config.interestRate, actualMonthsLeft),
    [currentBalance, config, actualMonthsLeft]
  )
  const interestSaved = Math.max(0, origInterestRemaining - actualInterestRemaining)

  const chartData = useMemo(() => buildBalanceSeries(config, payments), [config, payments])
  const chartFiltered = useMemo(
    () => chartData.filter((p) => p.original > 0 || (p.actual !== null && p.actual > 0)),
    [chartData]
  )

  const simResult = useMemo(() => {
    const extra = parseFloat(simAmount)
    if (!extra || extra <= 0) return null
    const newBalance = Math.max(0, currentBalance - extra)
    const newMonths = monthsRemaining(newBalance, config.interestRate, config.minimumPayment)
    const saved = isFinite(actualMonthsLeft) && isFinite(newMonths)
      ? Math.max(0, actualMonthsLeft - newMonths)
      : 0
    const origTotal = config.minimumPayment * origMonthsLeft
    const actualTotal = config.minimumPayment * actualMonthsLeft + totalExtraCapital
    const newTotal = config.minimumPayment * newMonths + totalExtraCapital + extra
    const interestNow = totalInterestRemaining(currentBalance, config.interestRate, actualMonthsLeft)
    const interestAfter = totalInterestRemaining(newBalance, config.interestRate, newMonths)
    return {
      newBalance,
      monthsSaved: saved,
      newPayoffDate: addMonths(new Date().toISOString().slice(0, 10), newMonths),
      interestSaved: Math.max(0, interestNow - interestAfter),
      origTotal,
      actualTotal,
      newTotal,
    }
  }, [simAmount, currentBalance, config, actualMonthsLeft, origMonthsLeft, totalExtraCapital])

  // ── Contributions tab ──────────────────────────────────────────────────────
  const sortedContribs = useMemo(
    () => [...filteredContribs].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredContribs]
  )

  const totalContributed = filteredContribs.reduce((s, c) => s + c.amount, 0)

  // Per-person totals from filtered list
  const byPerson = useMemo(() => {
    const map: Record<string, number> = {}
    filteredContribs.forEach((c) => {
      map[c.by] = (map[c.by] ?? 0) + c.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredContribs])

  // Stable color per person name (based on all-time order of first appearance)
  const personColors = useMemo(() => {
    const seen: Record<string, string> = {}
    let idx = 0
    ;[...contributions].sort((a, b) => a.date.localeCompare(b.date)).forEach((c) => {
      if (!seen[c.by]) {
        seen[c.by] = CONTRIBUTOR_COLORS[idx % CONTRIBUTOR_COLORS.length]
        idx++
      }
    })
    return seen
  }, [contributions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mortgage</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatMXN(config.principal)} · {config.interestRate}% · {config.termMonths / 12} years · started {formatDate(config.startDate)}
          </p>
        </div>
        {tab === 'overview' && (
          <button
            onClick={() => { setEditPayment(undefined); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#7C3AED] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        )}
        {tab === 'contributions' && (
          <button
            onClick={() => { setEditContrib(undefined); setContribModalOpen(true) }}
            className="flex items-center gap-2 bg-[#7C3AED] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contribution
          </button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'contributions', label: 'Contributions' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              title="Current Balance"
              value={formatMXNCompact(currentBalance)}
              subtitle={formatMXN(currentBalance)}
              icon={<Home className="w-5 h-5" />}
              accent="#7C3AED"
            />
            <KpiCard
              title="Principal Reduced"
              value={formatMXNCompact(config.principal - currentBalance)}
              subtitle={`${((1 - currentBalance / config.principal) * 100).toFixed(1)}% paid off`}
              accent="#10B981"
            />
            <KpiCard
              title="Extra Capital"
              value={formatMXNCompact(totalExtraCapital)}
              subtitle={`${payments.filter(p => p.extraCapital > 0).length} extra deposits`}
              accent="#F59E0B"
            />
            <KpiCard
              title="Time Saved"
              value={formatDuration(monthsSaved)}
              subtitle="vs. minimum payments only"
              accent="#3B82F6"
            />
            <KpiCard
              title="Projected Payoff"
              value={addMonths(new Date().toISOString().slice(0, 10), actualMonthsLeft)}
              subtitle={formatDuration(actualMonthsLeft) + ' remaining'}
              accent="#8B5CF6"
            />
            <KpiCard
              title="Interest Saved"
              value={formatMXNCompact(interestSaved)}
              subtitle="from extra capital deposits"
              accent="#EF4444"
            />
          </div>

          {/* Balance chart */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Balance Over Time</p>
            {chartFiltered.length > 1 ? (
              <LineChart
                data={chartFiltered.map(p => ({
                  label: p.label,
                  'Original Schedule': p.original,
                  ...(p.actual !== null ? { 'Actual Balance': p.actual } : {}),
                }))}
                lines={[
                  { key: 'Original Schedule', color: '#CBD5E1', name: 'Original Schedule' },
                  { key: 'Actual Balance', color: '#7C3AED', name: 'Actual Balance' },
                ]}
                xKey="label"
                height={280}
              />
            ) : (
              <p className="text-center py-8 text-sm text-gray-400">Add payments to see balance progression</p>
            )}
          </div>

          {/* Simulator */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Extra Deposit Simulator</p>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">If I deposit an extra</span>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="100,000"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-[#2D3448] rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">today...</span>
            </div>

            {simResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                  <p className="text-xs text-purple-500 font-medium mb-1">Months Saved</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatDuration(simResult.monthsSaved)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/30">
                  <p className="text-xs text-green-600 font-medium mb-1">New Payoff</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">{simResult.newPayoffDate}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-blue-500 font-medium mb-1">Interest Saved</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatMXNCompact(simResult.interestSaved)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-[#2D3448]">
                  <p className="text-xs text-gray-500 font-medium mb-1">Total Paid</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    w/o extras: <span className="font-semibold text-red-500">{formatMXNCompact(simResult.origTotal)}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    with deposit: <span className="font-semibold text-green-600">{formatMXNCompact(simResult.newTotal)}</span>
                  </p>
                </div>
              </div>
            )}
            {!simResult && (
              <p className="text-xs text-gray-400 text-center py-2">Enter an amount to see the impact</p>
            )}
          </div>

          {/* Payment log */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2D3448] bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Log</p>
              <span className="text-xs text-gray-400">{payments.length} payments</span>
            </div>
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <Home className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No payments recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr className="text-xs text-gray-500 dark:text-gray-400">
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-right px-4 py-3 font-medium">Total Paid</th>
                      <th className="text-right px-4 py-3 font-medium">Extra Capital</th>
                      <th className="text-right px-4 py-3 font-medium">Balance After</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Note</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                    {sorted.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                          p.extraCapital > 0 ? 'bg-purple-50/40 dark:bg-purple-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(p.date)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatMXN(p.totalPaid)}</td>
                        <td className="px-4 py-3 text-right">
                          {p.extraCapital > 0 ? (
                            <span className="text-[#7C3AED] font-semibold">{formatMXN(p.extraCapital)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatMXN(p.balanceAfter)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{p.note ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditPayment(p); setModalOpen(true) }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteMortgagePayment(p.id)}
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
            )}
          </div>
        </>
      )}

      {/* ── Contributions Tab ─────────────────────────────────────────────────── */}
      {tab === 'contributions' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodSelector
              mode={periodMode}
              value={periodValue}
              onChange={onPeriodChange}
              modes={['month', 'quarter', 'year', 'all']}
            />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              title="Total Contributed"
              value={formatMXNCompact(totalContributed)}
              subtitle={`${filteredContribs.length} entries`}
              icon={<Users className="w-5 h-5" />}
              accent="#7C3AED"
            />
            {byPerson.map(([name, total], i) => (
              <KpiCard
                key={name}
                title={name}
                value={formatMXNCompact(total)}
                subtitle={`${((total / totalContributed) * 100).toFixed(1)}% of total`}
                accent={personColors[name] ?? CONTRIBUTOR_COLORS[i % CONTRIBUTOR_COLORS.length]}
              />
            ))}
          </div>

          {/* Contributions table */}
          <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2D3448] bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Contribution History</p>
              <span className="text-xs text-gray-400">{sortedContribs.length} entries</span>
            </div>
            {sortedContribs.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No contributions in this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr className="text-xs text-gray-500 dark:text-gray-400">
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">By</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-right px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2D3448]">
                    {sortedContribs.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(c.date)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: personColors[c.by] ?? '#7C3AED' }}
                          >
                            {c.by}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatMXN(c.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditContrib(c); setContribModalOpen(true) }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteMortgageContribution(c.id)}
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
            )}
          </div>
        </>
      )}

      <MortgagePaymentForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        payment={editPayment}
      />
      <MortgageContributionForm
        open={contribModalOpen}
        onClose={() => setContribModalOpen(false)}
        contribution={editContrib}
      />
    </div>
  )
}
