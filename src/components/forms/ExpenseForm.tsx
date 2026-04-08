import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Expense } from '../../store/types'
import { today } from '../../lib/formatters'

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  expense?: Expense
}

export default function ExpenseForm({ open, onClose, expense }: ExpenseFormProps) {
  const categories = useStore((s) => s.settings.expenseCategories)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addExpense = useStore((s) => s.addExpense)
  const updateExpense = useStore((s) => s.updateExpense)

  const [form, setForm] = useState({
    date: today(),
    description: '',
    amount: '',
    category: categories[0]?.id ?? '',
    paidBy: 'user1' as 'user1' | 'user2',
    shared: true,
  })

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date,
        description: expense.description,
        amount: String(expense.amount),
        category: expense.category,
        paidBy: expense.paidBy,
        shared: expense.shared,
      })
    } else {
      setForm({
        date: today(),
        description: '',
        amount: '',
        category: categories[0]?.id ?? '',
        paidBy: 'user1',
        shared: true,
      })
    }
  }, [expense, open, categories])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Expense = {
      id: expense?.id ?? generateId(),
      date: form.date,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      category: form.category,
      paidBy: form.paidBy,
      shared: form.shared,
    }
    if (expense) {
      updateExpense(expense.id, data)
    } else {
      addExpense(data)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
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
            className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
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
            placeholder="e.g. CFE Febrero"
            className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
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
            className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paid By
          </label>
          <select
            value={form.paidBy}
            onChange={(e) => setForm({ ...form, paidBy: e.target.value as 'user1' | 'user2' })}
            className="w-full border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]"
          >
            <option value="user1">{user1Name}</option>
            <option value="user2">{user2Name}</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="shared-cb"
            type="checkbox"
            checked={form.shared}
            onChange={(e) => setForm({ ...form, shared: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-[#6B3FA0] focus:ring-[#6B3FA0]"
          />
          <label htmlFor="shared-cb" className="text-sm text-gray-700 dark:text-gray-300">
            Shared expense
          </label>
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
            {expense ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
