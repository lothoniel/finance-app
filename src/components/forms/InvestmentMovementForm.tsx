import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { InvestmentMovement } from '../../store/types'
import { today } from '../../lib/formatters'

interface InvestmentMovementFormProps {
  open: boolean
  onClose: () => void
  movement?: InvestmentMovement
}

export default function InvestmentMovementForm({ open, onClose, movement }: InvestmentMovementFormProps) {
  const portfolios = useStore((s) => s.portfolios)
  const addInvestmentMovement = useStore((s) => s.addInvestmentMovement)
  const updateInvestmentMovement = useStore((s) => s.updateInvestmentMovement)
  const updatePortfolio = useStore((s) => s.updatePortfolio)

  const [form, setForm] = useState({
    date: today(),
    portfolioId: portfolios[0]?.id ?? '',
    description: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL',
    amount: '',
  })

  useEffect(() => {
    if (movement) {
      setForm({
        date: movement.date,
        portfolioId: movement.portfolioId,
        description: movement.description,
        type: movement.type as 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL',
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
    const data = {
      id: movement?.id ?? generateId(),
      date: form.date,
      portfolioId: form.portfolioId,
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount) || 0,
    }
    if (movement) {
      updateInvestmentMovement(movement.id, data)

      const effective = (type: string, amount: number) => type === 'WITHDRAWAL' ? -amount : amount
      const oldEffect = effective(movement.type, movement.amount)
      const newEffect = effective(data.type, data.amount)

      if (movement.portfolioId === data.portfolioId) {
        const delta = newEffect - oldEffect
        if (delta !== 0) {
          const portfolio = portfolios.find((p) => p.id === data.portfolioId)
          if (portfolio) updatePortfolio(portfolio.id, { balance: portfolio.balance + delta })
        }
      } else {
        const oldPortfolio = portfolios.find((p) => p.id === movement.portfolioId)
        const newPortfolio = portfolios.find((p) => p.id === data.portfolioId)
        if (oldPortfolio) updatePortfolio(oldPortfolio.id, { balance: oldPortfolio.balance - oldEffect })
        if (newPortfolio) updatePortfolio(newPortfolio.id, { balance: newPortfolio.balance + newEffect })
      }
    } else {
      addInvestmentMovement(data)
      const portfolio = portfolios.find((p) => p.id === data.portfolioId)
      if (portfolio) {
        const delta = data.type === 'WITHDRAWAL' ? -data.amount : data.amount
        updatePortfolio(portfolio.id, { balance: portfolio.balance + delta })
      }
    }
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <Modal open={open} onClose={onClose} title={movement ? 'Edit Investment Movement' : 'Add Investment Movement'}>
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
            <option value="WITHDRAWAL">Withdrawal</option>
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
            className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            {movement ? 'Save Changes' : 'Add Movement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
