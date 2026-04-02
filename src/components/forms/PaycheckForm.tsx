import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Paycheck } from '../../store/types'

interface PaycheckFormProps {
  open: boolean
  onClose: () => void
  paycheck?: Paycheck
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PaycheckForm({ open, onClose, paycheck }: PaycheckFormProps) {
  const addPaycheck = useStore((s) => s.addPaycheck)
  const updatePaycheck = useStore((s) => s.updatePaycheck)

  const [form, setForm] = useState({
    date: today(),
    usdAmount: '',
    exchangeRate: '',
    mxnAmount: '',
    grossAmount: '',
  })

  useEffect(() => {
    if (paycheck) {
      setForm({
        date: paycheck.date,
        usdAmount: paycheck.usdAmount != null ? String(paycheck.usdAmount) : '',
        exchangeRate: paycheck.exchangeRate != null ? String(paycheck.exchangeRate) : '',
        mxnAmount: String(paycheck.mxnAmount),
        grossAmount: paycheck.grossAmount != null ? String(paycheck.grossAmount) : '',
      })
    } else {
      setForm({ date: today(), usdAmount: '', exchangeRate: '', mxnAmount: '', grossAmount: '' })
    }
  }, [paycheck, open])

  function handleChange(field: string, value: string) {
    const updated = { ...form, [field]: value }
    // Auto-calculate MXN when both USD and rate are filled
    if (field === 'usdAmount' || field === 'exchangeRate') {
      const usd = parseFloat(field === 'usdAmount' ? value : updated.usdAmount)
      const rate = parseFloat(field === 'exchangeRate' ? value : updated.exchangeRate)
      if (!isNaN(usd) && !isNaN(rate)) {
        updated.mxnAmount = (usd * rate).toFixed(2)
      }
    }
    setForm(updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Paycheck = {
      id: paycheck?.id ?? generateId(),
      date: form.date,
      usdAmount: form.usdAmount ? parseFloat(form.usdAmount) : null,
      exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : null,
      mxnAmount: parseFloat(form.mxnAmount) || 0,
      grossAmount: form.grossAmount ? parseFloat(form.grossAmount) : undefined,
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
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'

  return (
    <Modal open={open} onClose={onClose} title={paycheck ? 'Edit Paycheck' : 'Add Paycheck'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
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
              onChange={(e) => handleChange('usdAmount', e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Exchange Rate (optional)</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={form.exchangeRate}
              onChange={(e) => handleChange('exchangeRate', e.target.value)}
              placeholder="17.50"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>MXN Amount *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.mxnAmount}
            onChange={(e) => handleChange('mxnAmount', e.target.value)}
            required
            placeholder="0.00"
            className={inputClass}
          />
          {form.usdAmount && form.exchangeRate && (
            <p className="text-xs text-gray-400 mt-1">
              Auto-calculated: {form.usdAmount} × {form.exchangeRate}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Gross Amount (optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.grossAmount}
            onChange={(e) => handleChange('grossAmount', e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

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
            className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#5a3490] transition-colors"
          >
            {paycheck ? 'Save Changes' : 'Add Paycheck'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
