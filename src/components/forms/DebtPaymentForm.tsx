import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { DebtPayment } from '../../store/types'

interface DebtPaymentFormProps {
  open: boolean
  onClose: () => void
  debtPayment?: DebtPayment
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function DebtPaymentForm({ open, onClose, debtPayment }: DebtPaymentFormProps) {
  const creditCards = useStore((s) => s.settings.creditCards)
  const addDebtPayment = useStore((s) => s.addDebtPayment)
  const updateDebtPayment = useStore((s) => s.updateDebtPayment)

  const [form, setForm] = useState({
    date: today(),
    card: creditCards[0] ?? '',
    description: '',
    amount: '',
  })

  useEffect(() => {
    if (debtPayment) {
      setForm({
        date: debtPayment.date,
        card: debtPayment.card,
        description: debtPayment.description,
        amount: String(debtPayment.amount),
      })
    } else {
      setForm({ date: today(), card: creditCards[0] ?? '', description: '', amount: '' })
    }
  }, [debtPayment, open, creditCards])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: DebtPayment = {
      id: debtPayment?.id ?? crypto.randomUUID(),
      date: form.date,
      card: form.card,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
    }
    if (debtPayment) {
      updateDebtPayment(debtPayment.id, data)
    } else {
      addDebtPayment(data)
    }
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'

  return (
    <Modal open={open} onClose={onClose} title={debtPayment ? 'Edit Debt Payment' : 'Record Payment'}>
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
            Credit Card
          </label>
          <select
            value={form.card}
            onChange={(e) => setForm({ ...form, card: e.target.value })}
            className={inputClass}
          >
            {creditCards.map((card) => (
              <option key={card} value={card}>
                {card}
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
            placeholder="e.g. Pago tarjeta enero"
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
            {debtPayment ? 'Save Changes' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
