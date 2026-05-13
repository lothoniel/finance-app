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

type MovementType = 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL' | 'TRANSFER'

export default function InvestmentMovementForm({ open, onClose, movement }: InvestmentMovementFormProps) {
  const portfolios = useStore((s) => s.portfolios)
  const addInvestmentMovement = useStore((s) => s.addInvestmentMovement)
  const updateInvestmentMovement = useStore((s) => s.updateInvestmentMovement)
  const updatePortfolio = useStore((s) => s.updatePortfolio)

  const [form, setForm] = useState({
    date: today(),
    portfolioId: portfolios[0]?.id ?? '',
    destinationPortfolioId: portfolios.find((p) => p.id !== portfolios[0]?.id)?.id ?? '',
    description: '',
    type: 'DEPOSIT' as MovementType,
    amount: '',
  })

  useEffect(() => {
    if (movement) {
      setForm({
        date: movement.date,
        portfolioId: movement.portfolioId,
        destinationPortfolioId: movement.destinationPortfolioId ?? portfolios.find((p) => p.id !== movement.portfolioId)?.id ?? '',
        description: movement.description,
        type: movement.type as MovementType,
        amount: String(movement.amount),
      })
    } else {
      const srcId = portfolios[0]?.id ?? ''
      setForm({ date: today(), portfolioId: srcId, destinationPortfolioId: portfolios.find((p) => p.id !== srcId)?.id ?? '', description: '', type: 'DEPOSIT', amount: '' })
    }
  }, [movement, open, portfolios])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount) || 0
    const data: InvestmentMovement = {
      id: movement?.id ?? generateId(),
      date: form.date,
      portfolioId: form.portfolioId,
      description: form.description,
      type: form.type,
      amount,
      ...(form.type === 'TRANSFER' ? { destinationPortfolioId: form.destinationPortfolioId } : {}),
    }

    if (movement) {
      updateInvestmentMovement(movement.id, data)

      // Compute net balance deltas to avoid stale-balance issues when the same
      // portfolio appears on both sides of the old/new transfer.
      const deltas: Record<string, number> = {}
      const add = (id: string, d: number) => { deltas[id] = (deltas[id] ?? 0) + d }

      // Reverse old effect
      if (movement.type === 'TRANSFER') {
        add(movement.portfolioId, movement.amount)
        if (movement.destinationPortfolioId) add(movement.destinationPortfolioId, -movement.amount)
      } else {
        const oldEffect = movement.type === 'WITHDRAWAL' ? -movement.amount : movement.amount
        add(movement.portfolioId, -oldEffect)
      }

      // Apply new effect
      if (data.type === 'TRANSFER') {
        add(data.portfolioId, -data.amount)
        if (data.destinationPortfolioId) add(data.destinationPortfolioId, data.amount)
      } else {
        const newEffect = data.type === 'WITHDRAWAL' ? -data.amount : data.amount
        add(data.portfolioId, newEffect)
      }

      for (const [id, delta] of Object.entries(deltas)) {
        if (delta !== 0) {
          const p = portfolios.find((p) => p.id === id)
          if (p) updatePortfolio(p.id, { balance: p.balance + delta })
        }
      }
    } else {
      addInvestmentMovement(data)
      if (data.type === 'TRANSFER') {
        const src = portfolios.find((p) => p.id === data.portfolioId)
        const dst = portfolios.find((p) => p.id === data.destinationPortfolioId)
        if (src) updatePortfolio(src.id, { balance: src.balance - amount })
        if (dst) updatePortfolio(dst.id, { balance: dst.balance + amount })
      } else {
        const portfolio = portfolios.find((p) => p.id === data.portfolioId)
        if (portfolio) {
          const delta = data.type === 'WITHDRAWAL' ? -amount : amount
          updatePortfolio(portfolio.id, { balance: portfolio.balance + delta })
        }
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
          <label className={label}>{form.type === 'TRANSFER' ? 'From Portfolio' : 'Portfolio'}</label>
          <select
            value={form.portfolioId}
            onChange={(e) => {
              const newSrc = e.target.value
              setForm((f) => ({
                ...f,
                portfolioId: newSrc,
                destinationPortfolioId: f.destinationPortfolioId === newSrc
                  ? portfolios.find((p) => p.id !== newSrc)?.id ?? ''
                  : f.destinationPortfolioId,
              }))
            }}
            className={inputClass}
          >
            {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {form.type === 'TRANSFER' && (
          <div>
            <label className={label}>To Portfolio</label>
            <select
              value={form.destinationPortfolioId}
              onChange={(e) => setForm({ ...form, destinationPortfolioId: e.target.value })}
              className={inputClass}
            >
              {portfolios.filter((p) => p.id !== form.portfolioId).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={label}>Description</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Rendimiento mensual" className={inputClass} />
        </div>
        <div>
          <label className={label}>Type</label>
          <select
            value={form.type}
            onChange={(e) => {
              const t = e.target.value as MovementType
              setForm((f) => ({
                ...f,
                type: t,
                destinationPortfolioId: t === 'TRANSFER' ? (f.destinationPortfolioId || (portfolios.find((p) => p.id !== f.portfolioId)?.id ?? '')) : f.destinationPortfolioId,
              }))
            }}
            className={inputClass}
          >
            <option value="DEPOSIT">Deposit</option>
            <option value="GAIN">Gain</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER">Transfer</option>
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
