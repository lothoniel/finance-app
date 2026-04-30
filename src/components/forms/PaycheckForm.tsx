import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Paycheck } from '../../store/types'
import { today } from '../../lib/formatters'

interface PaycheckFormProps {
  open: boolean
  onClose: () => void
  paycheck?: Paycheck
}

export default function PaycheckForm({ open, onClose, paycheck }: PaycheckFormProps) {
  const addPaycheck = useStore((s) => s.addPaycheck)
  const updatePaycheck = useStore((s) => s.updatePaycheck)

  const [form, setForm] = useState({
    date: today(),
    usdAmount: '',
    mxnAmount: '',
  })

  useEffect(() => {
    if (paycheck) {
      setForm({
        date: paycheck.date,
        usdAmount: paycheck.usdAmount != null ? String(paycheck.usdAmount) : '',
        mxnAmount: String(paycheck.mxnAmount),
      })
    } else {
      setForm({ date: today(), usdAmount: '', mxnAmount: '' })
    }
  }, [paycheck, open])

  const calculatedRate = (() => {
    const usd = parseFloat(form.usdAmount)
    const mxn = parseFloat(form.mxnAmount)
    if (!isNaN(usd) && usd > 0 && !isNaN(mxn) && mxn > 0) {
      return (mxn / usd).toFixed(4)
    }
    return null
  })()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Paycheck = {
      id: paycheck?.id ?? generateId(),
      date: form.date,
      usdAmount: form.usdAmount ? parseFloat(form.usdAmount) : null,
      exchangeRate: calculatedRate ? parseFloat(calculatedRate) : null,
      mxnAmount: parseFloat(form.mxnAmount) || 0,
    }
    if (paycheck) {
      updatePaycheck(paycheck.id, data)
    } else {
      addPaycheck(data)
    }
    onClose()
  }

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]'

  return (
    <Modal open={open} onClose={onClose} title={paycheck ? 'Edit Paycheck' : 'Add Paycheck'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>USD Amount (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.usdAmount}
              onChange={(e) => setForm({ ...form, usdAmount: e.target.value })}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>MXN Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.mxnAmount}
              onChange={(e) => setForm({ ...form, mxnAmount: e.target.value })}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        {calculatedRate && (
          <p className="text-xs text-[#7C3AED] font-medium">
            Exchange rate: 1 USD = {calculatedRate} MXN
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            {paycheck ? 'Save Changes' : 'Add Paycheck'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
