import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { InvestmentMovement } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface InvestmentMovementFormProps {
  open: boolean
  onClose: () => void
  movement?: InvestmentMovement
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

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
      setForm({ date: movement.date, portfolioId: movement.portfolioId, description: movement.description, type: movement.type as 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL', amount: String(movement.amount) })
    } else {
      setForm({ date: today(), portfolioId: portfolios[0]?.id ?? '', description: '', type: 'DEPOSIT', amount: '' })
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

  return (
    <Modal open={open} onClose={onClose} title={movement ? 'Edit Investment Movement' : 'Add Investment Movement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={label}>Portfolio</label>
          <select value={form.portfolioId} onChange={(e) => setForm({ ...form, portfolioId: e.target.value })} className={inputClass}>
            {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Rendimiento mensual" className={inputClass} />
        </div>
        <div>
          <label className={label}>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL' })} className={inputClass}>
            <option value="DEPOSIT">Deposit</option>
            <option value="GAIN">Gain</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
        <div>
          <label className={label}>Amount (MXN)</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>Cancel</button>
          <button type="submit" className={submitBtn}>{movement ? 'Save Changes' : 'Add Movement'}</button>
        </div>
      </form>
    </Modal>
  )
}
