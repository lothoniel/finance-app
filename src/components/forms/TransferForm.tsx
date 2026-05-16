import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Transfer } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface TransferFormProps {
  open: boolean
  onClose: () => void
  transfer?: Transfer
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function TransferForm({ open, onClose, transfer }: TransferFormProps) {
  const { t } = useTranslation()
  const transferCategories = useStore((s) => s.settings.transferCategories)
  const addTransfer = useStore((s) => s.addTransfer)
  const updateTransfer = useStore((s) => s.updateTransfer)

  const [form, setForm] = useState({ date: today(), category: transferCategories[0]?.name ?? 'Household', description: '', amount: '' })

  useEffect(() => {
    if (transfer) {
      setForm({ date: transfer.date, category: transfer.category, description: transfer.description, amount: String(transfer.amount) })
    } else {
      setForm({ date: today(), category: transferCategories[0]?.name ?? 'Household', description: '', amount: '' })
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
    if (transfer) updateTransfer(transfer.id, data)
    else addTransfer(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={transfer ? t('income.forms.transfer.titleEdit') : t('income.forms.transfer.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.date')}</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('expenses.form.category')}</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
            {transferCategories.map((cat) => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder={t('income.forms.transfer.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('income.forms.transfer.amountMxn')}</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{transfer ? t('income.forms.transfer.submitEdit') : t('income.forms.transfer.submitAdd')}</button>
        </div>
      </form>
    </Modal>
  )
}
