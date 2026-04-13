import { useState, useEffect } from 'react'
import { generateId } from '../../lib/id'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { MortgageContribution } from '../../store/types'
import { today } from '../../lib/formatters'

interface Props {
  open: boolean
  onClose: () => void
  contribution?: MortgageContribution
}

const empty = () => ({ date: today(), by: '', description: '', amount: '' })

export default function MortgageContributionForm({ open, onClose, contribution }: Props) {
  const addMortgageContribution = useStore((s) => s.addMortgageContribution)
  const updateMortgageContribution = useStore((s) => s.updateMortgageContribution)
  const allContributions = useStore((s) => s.mortgageContributions)

  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (contribution) {
      setForm({
        date: contribution.date,
        by: contribution.by,
        description: contribution.description,
        amount: String(contribution.amount),
      })
    } else {
      setForm(empty())
    }
  }, [contribution, open])

  // Unique names from past contributions for datalist suggestions
  const nameSuggestions = [...new Set(allContributions.map((c) => c.by))].filter(Boolean).sort()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: MortgageContribution = {
      id: contribution?.id ?? generateId(),
      date: form.date,
      by: form.by.trim(),
      description: form.description.trim(),
      amount: parseFloat(form.amount) || 0,
    }
    if (contribution) {
      updateMortgageContribution(contribution.id, data)
    } else {
      addMortgageContribution(data)
    }
    onClose()
  }

  const inputClass =
    'w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'

  return (
    <Modal open={open} onClose={onClose} title={contribution ? 'Edit Contribution' : 'Add Contribution'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">By</label>
          <input
            type="text"
            list="contribution-name-suggestions"
            value={form.by}
            onChange={(e) => setForm({ ...form, by: e.target.value })}
            required
            placeholder="e.g. Jorge, Caro, Papa"
            className={inputClass}
          />
          <datalist id="contribution-name-suggestions">
            {nameSuggestions.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            placeholder="e.g. Mensualidad May 25, Enganche, Abono a capital"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (MXN)</label>
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
            {contribution ? 'Save Changes' : 'Add Contribution'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
