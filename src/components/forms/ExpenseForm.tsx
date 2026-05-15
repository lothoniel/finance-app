import { generateId } from '../../lib/id'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Expense, RecurringExpense } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  expense?: Expense
  editRecurring?: RecurringExpense
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function ExpenseForm({ open, onClose, expense, editRecurring }: ExpenseFormProps) {
  const { t } = useTranslation()
  const categories = useStore((s) => s.settings.expenseCategories)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const splitRatio = useStore((s) => s.settings.splitRatio)
  const addExpense = useStore((s) => s.addExpense)
  const updateExpense = useStore((s) => s.updateExpense)
  const addRecurringExpense = useStore((s) => s.addRecurringExpense)
  const updateRecurringExpense = useStore((s) => s.updateRecurringExpense)
  const allExpenses = useStore((s) => s.expenses)

  const [form, setForm] = useState({
    date: today(),
    description: '',
    amount: '',
    category: categories[0]?.id ?? '',
    subCategory: '',
    paidBy: 'user1' as 'user1' | 'user2',
    shared: true,
    recurring: false,
    frequency: 'monthly' as 'monthly' | 'bimonthly' | 'annual',
    recurringStatus: 'active' as 'active' | 'paused',
  })

  const subCategorySuggestions = useMemo(() => {
    const subs = allExpenses
      .filter((e) => e.category === form.category && e.subCategory)
      .map((e) => e.subCategory as string)
    return [...new Set(subs)].sort()
  }, [allExpenses, form.category])

  useEffect(() => {
    if (editRecurring) {
      setForm({
        date: editRecurring.lastDate,
        description: editRecurring.name,
        amount: String(editRecurring.amount),
        category: editRecurring.category,
        subCategory: '',
        paidBy: 'user1',
        shared: true,
        recurring: true,
        frequency: editRecurring.frequency,
        recurringStatus: editRecurring.status,
      })
    } else if (expense) {
      setForm({
        date: expense.date,
        description: expense.description,
        amount: String(expense.amount),
        category: expense.category,
        subCategory: expense.subCategory ?? '',
        paidBy: expense.paidBy,
        shared: expense.shared,
        recurring: false,
        frequency: 'monthly',
        recurringStatus: 'active',
      })
    } else {
      setForm({ date: today(), description: '', amount: '', category: categories[0]?.id ?? '', subCategory: '', paidBy: 'user1', shared: true, recurring: false, frequency: 'monthly', recurringStatus: 'active' })
    }
  }, [expense, editRecurring, open, categories])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount) || 0

    if (editRecurring) {
      updateRecurringExpense(editRecurring.id, {
        name: form.description,
        amount,
        category: form.category,
        frequency: form.frequency,
        status: form.recurringStatus,
      })
      onClose()
      return
    }

    const data: Expense = {
      id: expense?.id ?? generateId(),
      date: form.date,
      description: form.description,
      amount,
      category: form.category,
      subCategory: form.subCategory || undefined,
      paidBy: form.paidBy,
      shared: form.shared,
      splitRatio: form.shared ? (expense?.splitRatio ?? splitRatio) : undefined,
    }
    if (expense) updateExpense(expense.id, data)
    else addExpense(data)

    if (form.recurring) {
      addRecurringExpense({
        id: generateId(),
        name: form.description,
        amount,
        category: form.category,
        frequency: form.frequency,
        lastDate: form.date,
        status: form.recurringStatus,
      })
    }
    onClose()
  }

  const isEditRecurring = !!editRecurring
  const title = isEditRecurring
    ? t('expenses.form.editRecurring')
    : expense
      ? t('expenses.form.editExpense')
      : t('expenses.addExpense')

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditRecurring && (
          <div>
            <label className={label}>{t('expenses.form.date')}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
          </div>
        )}
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder={t('expenses.form.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('expenses.form.amount')} (MXN)</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder={t('expenses.form.amountPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('expenses.form.category')}</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
            {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {!isEditRecurring && (
          <>
            <div>
              <label className={label}>{t('expenses.form.subCategory')} <span className="text-[#41454d] font-normal">{t('expenses.form.optional')}</span></label>
              <input type="text" list="subcategory-suggestions" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} placeholder={t('expenses.form.subCategoryPlaceholder')} className={inputClass} />
              <datalist id="subcategory-suggestions">
                {subCategorySuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className={label}>{t('expenses.form.paidBy')}</label>
              <select value={form.paidBy} onChange={(e) => setForm({ ...form, paidBy: e.target.value as 'user1' | 'user2' })} className={inputClass}>
                <option value="user1">{user1Name}</option>
                <option value="user2">{user2Name}</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input id="shared-cb" type="checkbox" checked={form.shared} onChange={(e) => setForm({ ...form, shared: e.target.checked })} className="w-4 h-4 rounded border-[#e8e8e8] accent-[#181d26]" />
              <label htmlFor="shared-cb" className="text-[13px] text-[#333840]">{t('expenses.form.sharedExpense')}</label>
            </div>
          </>
        )}

        {/* Recurring toggle */}
        {!isEditRecurring && (
          <div className="flex items-center gap-3">
            <input
              id="recurring-cb"
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="w-4 h-4 rounded border-[#e8e8e8] accent-[#181d26]"
            />
            <label htmlFor="recurring-cb" className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">{t('expenses.form.recurringExpense')}</label>
          </div>
        )}

        {(form.recurring || isEditRecurring) && (
          <div className="grid grid-cols-2 gap-3 pl-7">
            <div>
              <label className={label}>{t('expenses.form.frequencyLabel')}</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })} className={inputClass}>
                <option value="monthly">{t('expenses.frequency.monthly')}</option>
                <option value="bimonthly">{t('expenses.frequency.bimonthly')}</option>
                <option value="annual">{t('expenses.frequency.annual')}</option>
              </select>
            </div>
            <div>
              <label className={label}>{t('expenses.form.statusLabel')}</label>
              <select value={form.recurringStatus} onChange={(e) => setForm({ ...form, recurringStatus: e.target.value as 'active' | 'paused' })} className={inputClass}>
                <option value="active">{t('expenses.form.statusActive')}</option>
                <option value="paused">{t('expenses.form.statusPaused')}</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{isEditRecurring || expense ? t('expenses.saveChanges') : t('expenses.addExpense')}</button>
        </div>
      </form>
    </Modal>
  )
}
