import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Paycheck } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface PaycheckFormProps {
  open: boolean
  onClose: () => void
  paycheck?: Paycheck
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function PaycheckForm({ open, onClose, paycheck }: PaycheckFormProps) {
  const { t } = useTranslation()
  const addPaycheck = useStore((s) => s.addPaycheck)
  const updatePaycheck = useStore((s) => s.updatePaycheck)

  const [form, setForm] = useState({ date: today(), usdAmount: '', mxnAmount: '' })

  useEffect(() => {
    if (paycheck) {
      setForm({ date: paycheck.date, usdAmount: paycheck.usdAmount != null ? String(paycheck.usdAmount) : '', mxnAmount: String(paycheck.mxnAmount) })
    } else {
      setForm({ date: today(), usdAmount: '', mxnAmount: '' })
    }
  }, [paycheck, open])

  const calculatedRate = (() => {
    const usd = parseFloat(form.usdAmount)
    const mxn = parseFloat(form.mxnAmount)
    if (!isNaN(usd) && usd > 0 && !isNaN(mxn) && mxn > 0) return (mxn / usd).toFixed(4)
    return null
  })()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Paycheck = {
      id: paycheck?.id ?? generateId(),
      date: form.date,
      usdAmount: form.usdAmount ? parseFloat(form.usdAmount) : null,
      exchangeRate: calculatedRate ? parseFloat(calculatedRate) : null,
      mxnAmount: parseFloat(form.mxnAmount) || 0,
    }
    if (paycheck) updatePaycheck(paycheck.id, data)
    else addPaycheck(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={paycheck ? t('income.forms.paycheck.titleEdit') : t('income.forms.paycheck.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.date')}</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>{t('income.forms.paycheck.usdAmount')}</label>
            <input type="number" min="0" step="0.01" value={form.usdAmount} onChange={(e) => setForm({ ...form, usdAmount: e.target.value })} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={label}>{t('income.forms.paycheck.mxnAmount')}</label>
            <input type="number" min="0" step="0.01" value={form.mxnAmount} onChange={(e) => setForm({ ...form, mxnAmount: e.target.value })} required placeholder="0.00" className={inputClass} />
          </div>
        </div>
        {calculatedRate && (
          <p className="text-[12px] text-[#41454d] font-medium">{t('income.forms.paycheck.exchangeRate', { rate: calculatedRate })}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{paycheck ? t('income.forms.paycheck.submitEdit') : t('income.forms.paycheck.submitAdd')}</button>
        </div>
      </form>
    </Modal>
  )
}
