import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { ManualTax } from '../../store/types'
import { today } from '../../lib/formatters'

interface ManualTaxFormProps {
  open: boolean
  onClose: () => void
  tax?: ManualTax
}

export default function ManualTaxForm({ open, onClose, tax }: ManualTaxFormProps) {
  const addManualTax = useStore((s) => s.addManualTax)

  const [form, setForm] = useState({ date: today(), description: '', amount: '' })

  useEffect(() => {
    if (tax) {
      setForm({ date: tax.date, description: tax.description, amount: String(tax.amount) })
    } else {
      setForm({ date: today(), description: '', amount: '' })
    }
  }, [tax, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addManualTax({
      id: tax?.id ?? generateId(),
      date: form.date,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
    })
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]'

  return (
    <Modal open={open} onClose={onClose} title="Add Tax Record">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            placeholder="e.g. ISR ajuste"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount (MXN)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
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
            className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            Add Tax Record
          </button>
        </div>
      </form>
    </Modal>
  )
}
