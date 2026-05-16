import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { ManualTax } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface ManualTaxFormProps {
  open: boolean
  onClose: () => void
  tax?: ManualTax
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function ManualTaxForm({ open, onClose, tax }: ManualTaxFormProps) {
  const { t } = useTranslation()
  const addManualTax = useStore((s) => s.addManualTax)

  const [form, setForm] = useState({ date: today(), description: '', amount: '' })

  useEffect(() => {
    if (tax) setForm({ date: tax.date, description: tax.description, amount: String(tax.amount) })
    else setForm({ date: today(), description: '', amount: '' })
  }, [tax, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addManualTax({ id: tax?.id ?? generateId(), date: form.date, description: form.description, amount: parseFloat(form.amount) || 0 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('income.forms.tax.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.date')}</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder={t('income.forms.tax.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('income.forms.tax.amountMxn')}</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{t('income.forms.tax.submit')}</button>
        </div>
      </form>
    </Modal>
  )
}
