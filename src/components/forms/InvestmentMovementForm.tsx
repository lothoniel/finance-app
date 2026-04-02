import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { InvestmentMovement } from '../../store/types'

interface InvestmentMovementFormProps {
  open: boolean
  onClose: () => void
  movement?: InvestmentMovement
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function InvestmentMovementForm({ open, onClose, movement }: InvestmentMovementFormProps) {
  const portfolios = useStore((s) => s.portfolios)
  const addInvestmentMovement = useStore((s) => s.addInvestmentMovement)

  const [form, setForm] = useState({
    date: today(),
    portfolioId: portfolios[0]?.id ?? '',
    description: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'GAIN',
    amount: '',
  })

  useEffect(() => {
    if (movement) {
      setForm({
        date: movement.date,
        portfolioId: movement.portfolioId,
        description: movement.description,
        type: movement.type,
        amount: String(movement.amount),
      })
    } else {
      setForm({
        date: today(),
        portfolioId: portfolios[0]?.id ?? '',
        description: '',
        type: 'DEPOSIT',
        amount: '',
      })
    }
  }, [movement, open, portfolios])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addInvestmentMovement({
      id: movement?.id ?? crypto.randomUUID(),
      date: form.date,
      portfolioId: form.portfolioId,
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount) || 0,
    })
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <Modal open={open} onClose={onClose} title="Add Investment Movement">
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
        <div>
          <label className={labelClass}>Portfolio</label>
          <select
            value={form.portfolioId}
            onChange={(e) => setForm({ ...form, portfolioId: e.target.value })}
            className={inputClass}
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            placeholder="e.g. Rendimiento mensual"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'DEPOSIT' | 'GAIN' })}
            className={inputClass}
          >
            <option value="DEPOSIT">Deposit</option>
            <option value="GAIN">Gain</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (MXN)</label>
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
            Add Movement
          </button>
        </div>
      </form>
    </Modal>
  )
}
