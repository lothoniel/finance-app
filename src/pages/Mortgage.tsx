import { useState, useMemo, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useStore } from '../store'
import HeroBand from '../components/ui/HeroBand'
import HeroKpi from '../components/ui/HeroKpi'
import HeroAction from '../components/ui/HeroAction'
import SectionTitle from '../components/ui/SectionTitle'
import Tabs from '../components/ui/Tabs'
import PeriodSelector from '../components/ui/PeriodSelector'
import LineChart from '../components/charts/LineChart'
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

const CONTRIBUTOR_COLORS = ['#2e7d65', '#1a7a3c', '#c8912a', '#c0392b', '#181d26', '#41454d', '#aa2d00']

export default function MortgagePage() {
  const config = useStore((s) => s.mortgageConfig)
  const payments = useStore((s) => s.mortgagePayments)
  const contributions = useStore((s) => s.mortgageContributions)
  const deleteMortgagePayment = useStore((s) => s.deleteMortgagePayment)
  const deleteMortgageContribution = useStore((s) => s.deleteMortgageContribution)
  const addMortgageContribution = useStore((s) => s.addMortgageContribution)

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

  const sorted = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date)), [payments])
  const currentBalance = sorted[0]?.balanceAfter ?? config.principal
  const totalExtraCapital = payments.reduce((s, p) => s + p.extraCapital, 0)
  const paidOffPct = ((1 - currentBalance / config.principal) * 100).toFixed(1)

  const origMonthsLeft = useMemo(() => monthsRemaining(config.principal, config.interestRate, config.minimumPayment), [config])
  const actualMonthsLeft = useMemo(() => monthsRemaining(currentBalance, config.interestRate, config.minimumPayment), [currentBalance, config])
  const monthsSaved = useMemo(() => isFinite(origMonthsLeft) && isFinite(actualMonthsLeft) ? Math.max(0, origMonthsLeft - actualMonthsLeft) : 0, [origMonthsLeft, actualMonthsLeft])
  const origInterestRemaining = useMemo(() => totalInterestRemaining(config.principal, config.interestRate, origMonthsLeft), [config, origMonthsLeft])
  const actualInterestRemaining = useMemo(() => totalInterestRemaining(currentBalance, config.interestRate, actualMonthsLeft), [currentBalance, config, actualMonthsLeft])
  const interestSaved = Math.max(0, origInterestRemaining - actualInterestRemaining)

  const chartData = useMemo(() => buildBalanceSeries(config, payments), [config, payments])
  const chartFiltered = useMemo(() => chartData.filter((p) => p.original > 0 || (p.actual !== null && p.actual > 0)), [chartData])

  const simResult = useMemo(() => {
    const extra = parseFloat(simAmount)
    if (!extra || extra <= 0) return null
    const newBalance = Math.max(0, currentBalance - extra)
    const newMonths = monthsRemaining(newBalance, config.interestRate, config.minimumPayment)
    const saved = isFinite(actualMonthsLeft) && isFinite(newMonths) ? Math.max(0, actualMonthsLeft - newMonths) : 0
    const interestNow = totalInterestRemaining(currentBalance, config.interestRate, actualMonthsLeft)
    const interestAfter = totalInterestRemaining(newBalance, config.interestRate, newMonths)
    return {
      newBalance,
      monthsSaved: saved,
      newPayoffDate: addMonths(new Date().toISOString().slice(0, 10), newMonths),
      interestSaved: Math.max(0, interestNow - interestAfter),
      totalPaidWithout: currentBalance + interestNow,
      totalPaidWith: extra + newBalance + interestAfter,
    }
  }, [simAmount, currentBalance, config, actualMonthsLeft])

  const sortedContribs = useMemo(() => [...filteredContribs].sort((a, b) => b.date.localeCompare(a.date)), [filteredContribs])
  const totalContributed = filteredContribs.reduce((s, c) => s + c.amount, 0)

  const byPerson = useMemo(() => {
    const map: Record<string, number> = {}
    filteredContribs.forEach((c) => { map[c.by] = (map[c.by] ?? 0) + c.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredContribs])

  const personColors = useMemo(() => {
    const seen: Record<string, string> = {}
    let idx = 0
    ;[...contributions].sort((a, b) => a.date.localeCompare(b.date)).forEach((c) => {
      if (!seen[c.by]) { seen[c.by] = CONTRIBUTOR_COLORS[idx % CONTRIBUTOR_COLORS.length]; idx++ }
    })
    return seen
  }, [contributions])

  const td = 'px-4 py-[11px] text-[13px] text-[#333840] dark:text-[#c4c8d0]'
  const borderB = 'border-b border-[#e8e8e8] dark:border-[#2d3347]'

  return (
    <div>
      <HeroBand color="#e8874a">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex gap-3 flex-wrap flex-1">
            <HeroKpi label="Current Balance" value={formatMXN(currentBalance)} sub={`${paidOffPct}% paid off`} />
            <HeroKpi label="Time Saved" value={formatDuration(monthsSaved)} sub="vs. min payments only" />
            <HeroKpi label="Projected Payoff" value={addMonths(new Date().toISOString().slice(0, 10), actualMonthsLeft)} sub={formatDuration(actualMonthsLeft) + ' remaining'} />
            <HeroKpi label="Interest Saved" value={formatMXNCompact(interestSaved)} />
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            {tab === 'overview' && (
              <HeroAction variant="primary" onClick={() => { setEditPayment(undefined); setModalOpen(true) }}>
                <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Payment
              </HeroAction>
            )}
            {tab === 'contributions' && (
              <HeroAction variant="primary" onClick={() => { setEditContrib(undefined); setContribModalOpen(true) }}>
                <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add Contribution
              </HeroAction>
            )}
          </div>
        </div>
      </HeroBand>

      {/* Config caption */}
      <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mb-4">
        {formatMXN(config.principal)} · {config.interestRate}% · {config.termMonths / 12} years · started {formatDate(config.startDate)}
      </p>

      <div className="mb-6">
        <Tabs
          tabs={[{ id: 'overview', label: 'Overview' }, { id: 'contributions', label: 'Contributions' }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Principal Reduced', value: formatMXNCompact(config.principal - currentBalance), sub: `${paidOffPct}% paid off` },
              { label: 'Extra Capital', value: formatMXNCompact(totalExtraCapital), sub: `${payments.filter(p => p.extraCapital > 0).length} extra deposits` },
              { label: 'Min. Payment', value: formatMXN(config.minimumPayment), sub: 'Monthly' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4">
                <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] mb-1">{label}</p>
                <p className="text-[22px] font-normal text-[#181d26] dark:text-[#e8eaf0]">{value}</p>
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Balance chart */}
          <div>
            <SectionTitle>Balance Over Time</SectionTitle>
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
              {chartFiltered.length > 1 ? (
                <LineChart
                  data={chartFiltered.map(p => ({
                    label: p.label,
                    'Original Schedule': p.original,
                    ...(p.actual !== null ? { 'Actual Balance': p.actual } : {}),
                  }))}
                  lines={[
                    { key: 'Original Schedule', color: '#e0e2e6', name: 'Original Schedule' },
                    { key: 'Actual Balance', color: '#e8874a', name: 'Actual Balance' },
                  ]}
                  xKey="label"
                  height={280}
                />
              ) : (
                <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">Add payments to see balance progression</p>
              )}
            </div>
          </div>

          {/* Simulator */}
          <div>
            <SectionTitle>Extra Deposit Simulator</SectionTitle>
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-[13px] text-[#41454d] dark:text-[#9297a0] whitespace-nowrap">If I deposit an extra</span>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d] dark:text-[#9297a0] text-[13px]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    placeholder="100,000"
                    className="w-full pl-7 pr-3 py-2 border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] text-[13px] text-[#181d26] dark:text-[#e8eaf0] bg-white dark:bg-[#252b3b] focus:outline-none focus:border-[#181d26]"
                  />
                </div>
                <span className="text-[13px] text-[#41454d] dark:text-[#9297a0]">today...</span>
              </div>
              {simResult ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Months Saved', value: formatDuration(simResult.monthsSaved), color: '#e8874a' },
                    { label: 'New Payoff', value: simResult.newPayoffDate, color: '#1a7a3c' },
                    { label: 'Interest Saved', value: formatMXNCompact(simResult.interestSaved), color: '#2e7d65' },
                    { label: 'Total Paid (w/o extra)', value: formatMXNCompact(simResult.totalPaidWithout), color: '#41454d' },
                    { label: 'Total Paid (with deposit)', value: formatMXNCompact(simResult.totalPaidWith), color: '#2e7d65' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#f8fafc] dark:bg-[#161b25] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] p-3">
                      <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] mb-1">{label}</p>
                      <p className="text-[16px] font-semibold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] text-center py-2">Enter an amount to see the impact</p>
              )}
            </div>
          </div>

          {/* Payment Log */}
          <div>
            <SectionTitle>Payment History</SectionTitle>
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
              {sorted.length === 0 ? (
                <p className="text-center py-10 text-[13px] text-[#41454d] dark:text-[#9297a0]">No payments recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Date', 'Total Paid', 'Extra Capital', 'Balance After', 'Note', ''].map((h, i) => (
                          <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${['Total Paid','Extra Capital','Balance After'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i, arr) => (
                        <tr key={p.id} className={`hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] ${p.extraCapital > 0 ? 'bg-[#fff8f5] dark:bg-[#2a2218]' : ''}`}>
                          <td className={`${td} ${i < arr.length - 1 ? borderB : ''}`}>{formatDate(p.date)}</td>
                          <td className={`${td} text-right font-semibold text-[#181d26] dark:text-[#e8eaf0] ${i < arr.length - 1 ? borderB : ''}`}>{formatMXN(p.totalPaid)}</td>
                          <td className={`${td} text-right ${i < arr.length - 1 ? borderB : ''}`}>
                            {p.extraCapital > 0
                              ? <span className="font-semibold text-[#e8874a]">{formatMXN(p.extraCapital)}</span>
                              : <span className="text-[#e0e2e6]">—</span>}
                          </td>
                          <td className={`${td} text-right ${i < arr.length - 1 ? borderB : ''}`}>{formatMXN(p.balanceAfter)}</td>
                          <td className={`${td} text-[#41454d] dark:text-[#9297a0] text-[12px] hidden sm:table-cell ${i < arr.length - 1 ? borderB : ''}`}>{p.note ?? '—'}</td>
                          <td className={`px-4 py-[11px] ${i < arr.length - 1 ? borderB : ''}`}>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditPayment(p); setModalOpen(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteMortgagePayment(p.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
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
          </div>
        </div>
      )}

      {/* Contributions Tab */}
      {tab === 'contributions' && (
        <div className="space-y-6">
          <PeriodSelector mode={periodMode} value={periodValue} onChange={onPeriodChange} modes={['month', 'quarter', 'year', 'all']} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#41454d] dark:text-[#9297a0]" />
                <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0]">Total Contributed</p>
              </div>
              <p className="text-[22px] font-normal text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(totalContributed)}</p>
              <p className="text-[12px] text-[#41454d] dark:text-[#9297a0]">{filteredContribs.length} entries</p>
            </div>
            {byPerson.map(([name, total], i) => (
              <div key={name} className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-4" style={{ borderLeftWidth: 3, borderLeftColor: personColors[name] ?? CONTRIBUTOR_COLORS[i] }}>
                <p className="text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] mb-1">{name}</p>
                <p className="text-[22px] font-normal text-[#181d26] dark:text-[#e8eaf0]">{formatMXNCompact(total)}</p>
                <p className="text-[12px] text-[#41454d] dark:text-[#9297a0]">{((total / totalContributed) * 100).toFixed(1)}% of total</p>
              </div>
            ))}
          </div>

          <div>
            <SectionTitle>Contribution History</SectionTitle>
            <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] overflow-hidden">
              {sortedContribs.length === 0 ? (
                <p className="text-center py-10 text-[13px] text-[#41454d] dark:text-[#9297a0]">No contributions in this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Date', 'By', 'Description', 'Amount', ''].map((h, i) => (
                          <th key={i} className={`text-[11px] font-semibold uppercase text-[#41454d] dark:text-[#9297a0] border-b border-[#e8e8e8] dark:border-[#2d3347] py-2 px-4 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedContribs.map((c, i, arr) => (
                        <tr key={c.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]">
                          <td className={`${td} whitespace-nowrap ${i < arr.length - 1 ? borderB : ''}`}>{formatDate(c.date)}</td>
                          <td className={`px-4 py-[11px] ${i < arr.length - 1 ? borderB : ''}`}>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                              style={{ backgroundColor: personColors[c.by] ?? '#181d26' }}>
                              {c.by}
                            </span>
                          </td>
                          <td className={`${td} ${i < arr.length - 1 ? borderB : ''}`}>{c.description}</td>
                          <td className={`${td} text-right font-semibold text-[#181d26] dark:text-[#e8eaf0] ${i < arr.length - 1 ? borderB : ''}`}>{formatMXN(c.amount)}</td>
                          <td className={`px-4 py-[11px] ${i < arr.length - 1 ? borderB : ''}`}>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditContrib(c); setContribModalOpen(true) }} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b] dark:hover:text-[#e8eaf0] transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteMortgageContribution(c.id)} className="p-1.5 rounded-[6px] text-[#41454d] hover:text-[#c0392b] hover:bg-[#fdecea] transition-colors">
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
          </div>
        </div>
      )}

      <MortgagePaymentForm open={modalOpen} onClose={() => setModalOpen(false)} payment={editPayment} />
      <MortgageContributionForm open={contribModalOpen} onClose={() => setContribModalOpen(false)} contribution={editContrib} />
    </div>
  )
}
