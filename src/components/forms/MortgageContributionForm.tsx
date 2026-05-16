import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { generateId } from '../../lib/id'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { MortgageContribution } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface Props {
  open: boolean
  onClose: () => void
  contribution?: MortgageContribution
}

const empty = () => ({ date: today(), by: '', description: '', amount: '' })
const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function MortgageContributionForm({ open, onClose, contribution }: Props) {
  const { t } = useTranslation()
  const addMortgageContribution = useStore((s) => s.addMortgageContribution)
  const updateMortgageContribution = useStore((s) => s.updateMortgageContribution)
  const allContributions = useStore((s) => s.mortgageContributions)

  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (contribution) {
      setForm({ date: contribution.date, by: contribution.by, description: contribution.description, amount: String(contribution.amount) })
    } else {
      setForm(empty())
    }
  }, [contribution, open])

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
    if (contribution) updateMortgageContribution(contribution.id, data)
    else addMortgageContribution(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={contribution ? t('mortgage.form.contribution.titleEdit') : t('mortgage.form.contribution.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.date')}</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('mortgage.form.contribution.by')}</label>
          <input type="text" list="contribution-name-suggestions" value={form.by} onChange={(e) => setForm({ ...form, by: e.target.value })} required placeholder={t('mortgage.form.contribution.byPlaceholder')} className={inputClass} />
          <datalist id="contribution-name-suggestions">
            {nameSuggestions.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder={t('mortgage.form.contribution.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('mortgage.form.contribution.amountMxn')}</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{contribution ? t('mortgage.form.contribution.submitEdit') : t('mortgage.form.contribution.submitAdd')}</button>
        </div>
      </form>
    </Modal>
  )
}
