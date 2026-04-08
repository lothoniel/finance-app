import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Portfolio } from '../../store/types'
import { today } from '../../lib/formatters'

interface PortfolioFormProps {
  open: boolean
  onClose: () => void
  portfolio?: Portfolio
}

export default function PortfolioForm({ open, onClose, portfolio }: PortfolioFormProps) {
  const addPortfolio = useStore((s) => s.addPortfolio)
  const updatePortfolio = useStore((s) => s.updatePortfolio)
  const addInvestmentMovement = useStore((s) => s.addInvestmentMovement)

  const [form, setForm] = useState({
    name: '',
    type: '',
    apy: '',
    balance: '',
    updatedDate: today(),
    renewsDate: today(),
  })

  useEffect(() => {
    if (portfolio) {
      setForm({
        name: portfolio.name,
        type: portfolio.type,
        apy: String(portfolio.apy),
        balance: String(portfolio.balance),
        updatedDate: portfolio.updatedDate,
        renewsDate: portfolio.renewsDate,
      })
    } else {
      setForm({ name: '', type: '', apy: '', balance: '', updatedDate: today(), renewsDate: today() })
    }
  }, [portfolio, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Portfolio = {
      id: portfolio?.id ?? generateId(),
      name: form.name,
      type: form.type,
      apy: parseFloat(form.apy) || 0,
      balance: parseFloat(form.balance) || 0,
      updatedDate: form.updatedDate,
      renewsDate: form.renewsDate,
    }
    if (portfolio) {
      updatePortfolio(portfolio.id, data)
      const diff = data.balance - portfolio.balance
      if (diff !== 0) {
        addInvestmentMovement({
          id: generateId(),
          date: data.updatedDate,
          portfolioId: portfolio.id,
          description: 'Balance update',
          type: diff > 0 ? 'GAIN' : 'WITHDRAWAL',
          amount: Math.abs(diff),
        })
      }
    } else {
      addPortfolio(data)
    }
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <Modal open={open} onClose={onClose} title={portfolio ? 'Edit Portfolio' : 'Add Portfolio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Banorte NTEDIG"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <input
            type="text"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
            placeholder="e.g. NTEDIG, 28DIAS"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>APY (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.apy}
              onChange={(e) => setForm({ ...form, apy: e.target.value })}
              required
              placeholder="10.5"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Balance (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Updated Date</label>
            <input
              type="date"
              value={form.updatedDate}
              onChange={(e) => setForm({ ...form, updatedDate: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Renews Date</label>
            <input
              type="date"
              value={form.renewsDate}
              onChange={(e) => setForm({ ...form, renewsDate: e.target.value })}
              required
              className={inputClass}
            />
          </div>
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
            {portfolio ? 'Save Changes' : 'Add Portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
