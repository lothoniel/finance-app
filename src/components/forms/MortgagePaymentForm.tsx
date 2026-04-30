import { generateId } from '../../lib/id'
import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { MortgagePayment } from '../../store/types'
import { today } from '../../lib/formatters'

interface Props {
  open: boolean
  onClose: () => void
  payment?: MortgagePayment
}

const empty = () => ({ date: today(), totalPaid: '', balanceAfter: '', note: '' })

export default function MortgagePaymentForm({ open, onClose, payment }: Props) {
  const addMortgagePayment = useStore((s) => s.addMortgagePayment)
  const updateMortgagePayment = useStore((s) => s.updateMortgagePayment)
  const config = useStore((s) => s.mortgageConfig)
  const allPayments = useStore((s) => s.mortgagePayments)

  const [form, setForm] = useState(empty())
  const [extraOverride, setExtraOverride] = useState<string | null>(null) // null = auto, string = manual

  useEffect(() => {
    if (payment) {
      setForm({
        date: payment.date,
        totalPaid: String(payment.totalPaid),
        balanceAfter: String(payment.balanceAfter),
        note: payment.note ?? '',
      })
      setExtraOverride(null) // reset to auto when opening
    } else {
      setForm(empty())
      setExtraOverride(null)
    }
  }, [payment, open])

  // Previous balance: most recent payment before this one (excluding self if editing)
  const previousBalance = useMemo(() => {
    const others = payment
      ? allPayments.filter((p) => p.id !== payment.id)
      : allPayments
    if (others.length === 0) return config.principal
    const sorted = [...others].sort((a, b) => b.date.localeCompare(a.date))
    return sorted[0].balanceAfter
  }, [allPayments, payment, config.principal])

  // Auto-calculated extra capital
  const autoExtraCapital = useMemo(() => {
    const balAfter = parseFloat(form.balanceAfter)
    if (!balAfter || balAfter <= 0) return null
    const r = config.interestRate / 100 / 12
    const interest = previousBalance * r
    const ordinaryCapital = config.minimumPayment - interest
    const extra = (previousBalance - balAfter) - ordinaryCapital
    return Math.max(0, extra)
  }, [form.balanceAfter, previousBalance, config])

  const extraCapitalValue = extraOverride !== null
    ? parseFloat(extraOverride) || 0
    : (autoExtraCapital ?? 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: MortgagePayment = {
      id: payment?.id ?? generateId(),
      date: form.date,
      totalPaid: parseFloat(form.totalPaid) || 0,
      extraCapital: extraCapitalValue,
      balanceAfter: parseFloat(form.balanceAfter) || 0,
      note: form.note.trim() || undefined,
    }
    if (payment) {
      updateMortgagePayment(payment.id, data)
    } else {
      addMortgagePayment(data)
    }
    onClose()
  }

  const isAuto = extraOverride === null
  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]'

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'Edit Payment' : 'Record Mortgage Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Paid (MXN)</label>
            <input
              type="number" min="0" step="0.01"
              value={form.totalPaid}
              onChange={(e) => setForm({ ...form, totalPaid: e.target.value })}
              required placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Balance After (MXN)</label>
            <input
              type="number" min="0" step="0.01"
              value={form.balanceAfter}
              onChange={(e) => setForm({ ...form, balanceAfter: e.target.value })}
              required placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        {/* Extra Capital — auto or manual */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Extra Capital (MXN)</label>
            <div className="flex items-center gap-2">
              {isAuto ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">auto</span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">manual</span>
              )}
              {isAuto ? (
                <button
                  type="button"
                  onClick={() => setExtraOverride(autoExtraCapital !== null ? String(Math.round(autoExtraCapital * 100) / 100) : '0')}
                  className="text-xs text-gray-400 hover:text-[#7C3AED] transition-colors"
                >
                  Override
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setExtraOverride(null)}
                  className="text-xs text-gray-400 hover:text-[#7C3AED] transition-colors"
                >
                  Reset to auto
                </button>
              )}
            </div>
          </div>
          {isAuto ? (
            <div className={`${inputClass} bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-default`}>
              {autoExtraCapital !== null ? autoExtraCapital.toLocaleString('en-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </div>
          ) : (
            <input
              type="number" min="0" step="0.01"
              value={extraOverride ?? ''}
              onChange={(e) => setExtraOverride(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Previous balance: ${previousBalance.toLocaleString('en-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Extra payment from bonus" className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#6d28d9] transition-colors">
            {payment ? 'Save Changes' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
