import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Transfer } from '../../store/types'

interface TransferFormProps {
  open: boolean
  onClose: () => void
  transfer?: Transfer
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function TransferForm({ open, onClose, transfer }: TransferFormProps) {
  const transferCategories = useStore((s) => s.settings.transferCategories)
  const addTransfer = useStore((s) => s.addTransfer)
  const updateTransfer = useStore((s) => s.updateTransfer)

  const [form, setForm] = useState({
    date: today(),
    category: transferCategories[0] ?? 'Household',
    description: '',
    amount: '',
  })

  useEffect(() => {
    if (transfer) {
      setForm({
        date: transfer.date,
        category: transfer.category,
        description: transfer.description,
        amount: String(transfer.amount),
      })
    } else {
      setForm({
        date: today(),
        category: transferCategories[0] ?? 'Household',
        description: '',
        amount: '',
      })
    }
  }, [transfer, open, transferCategories])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Transfer = {
      id: transfer?.id ?? generateId(),
      date: form.date,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
    }
    if (transfer) {
      updateTransfer(transfer.id, data)
    } else {
      addTransfer(data)
    }
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'

  return (
    <Modal open={open} onClose={onClose} title={transfer ? 'Edit Transfer' : 'Add Transfer'}>
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
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            {transferCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
            placeholder="e.g. Renta departamento"
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
            className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#5a3490] transition-colors"
          >
            {transfer ? 'Save Changes' : 'Add Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
