import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { DebtPayment } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface DebtPaymentFormProps {
  open: boolean
  onClose: () => void
  debtPayment?: DebtPayment
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function DebtPaymentForm({ open, onClose, debtPayment }: DebtPaymentFormProps) {
  const { t } = useTranslation()
  const creditCards = useStore((s) => s.settings.creditCards)
  const addDebtPayment = useStore((s) => s.addDebtPayment)
  const updateDebtPayment = useStore((s) => s.updateDebtPayment)

  const [form, setForm] = useState({ date: today(), card: creditCards[0]?.name ?? '', description: '', amount: '' })

  useEffect(() => {
    if (debtPayment) {
      setForm({ date: debtPayment.date, card: debtPayment.card, description: debtPayment.description, amount: String(debtPayment.amount) })
    } else {
      setForm({ date: today(), card: creditCards[0]?.name ?? '', description: '', amount: '' })
    }
  }, [debtPayment, open, creditCards])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: DebtPayment = {
      id: debtPayment?.id ?? generateId(),
      date: form.date,
      card: form.card,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
    }
    if (debtPayment) updateDebtPayment(debtPayment.id, data)
    else addDebtPayment(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={debtPayment ? t('debt.form.titleEdit') : t('debt.form.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.date')}</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('debt.form.creditCard')}</label>
          <select value={form.card} onChange={(e) => setForm({ ...form, card: e.target.value })} className={inputClass}>
            {creditCards.map((card) => <option key={card.name} value={card.name}>{card.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder={t('debt.form.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('debt.form.amountMxn')}</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{debtPayment ? t('debt.form.submitEdit') : t('debt.form.submitAdd')}</button>
        </div>
      </form>
    </Modal>
  )
}
