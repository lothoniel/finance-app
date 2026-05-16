import { generateId } from '../../lib/id'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { Portfolio } from '../../store/types'
import { today } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'

interface PortfolioFormProps {
  open: boolean
  onClose: () => void
  portfolio?: Portfolio
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function PortfolioForm({ open, onClose, portfolio }: PortfolioFormProps) {
  const { t } = useTranslation()
  const addPortfolio = useStore((s) => s.addPortfolio)
  const updatePortfolio = useStore((s) => s.updatePortfolio)
  const addInvestmentMovement = useStore((s) => s.addInvestmentMovement)

  const [form, setForm] = useState({ name: '', type: '', apy: '', balance: '', updatedDate: today(), renewsDate: today() })

  useEffect(() => {
    if (portfolio) {
      setForm({ name: portfolio.name, type: portfolio.type, apy: String(portfolio.apy), balance: String(portfolio.balance), updatedDate: portfolio.updatedDate, renewsDate: portfolio.renewsDate })
    } else {
      setForm({ name: '', type: '', apy: '', balance: '', updatedDate: today(), renewsDate: today() })
    }
  }, [portfolio, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Portfolio = {
      id: portfolio?.id ?? generateId(),
      name: form.name,
      type: form.type,
      apy: parseFloat(form.apy) || 0,
      balance: parseFloat(form.balance) || 0,
      updatedDate: form.updatedDate,
      renewsDate: form.renewsDate,
    }
    if (portfolio) {
      updatePortfolio(portfolio.id, data)
      const diff = data.balance - portfolio.balance
      if (diff !== 0) {
        addInvestmentMovement({
          id: generateId(),
          date: data.updatedDate,
          portfolioId: portfolio.id,
          description: 'Balance update',
          type: diff > 0 ? 'GAIN' : 'WITHDRAWAL',
          amount: Math.abs(diff),
        })
      }
    } else {
      addPortfolio(data)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={portfolio ? t('portfolio.form.portfolio.titleEdit') : t('portfolio.form.portfolio.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('portfolio.form.portfolio.name')}</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('portfolio.form.portfolio.namePlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('portfolio.form.portfolio.type')}</label>
          <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required placeholder={t('portfolio.form.portfolio.typePlaceholder')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>{t('portfolio.form.portfolio.apy')}</label>
            <input type="number" min="0" step="0.01" value={form.apy} onChange={(e) => setForm({ ...form, apy: e.target.value })} required placeholder="10.5" className={inputClass} />
          </div>
          <div>
            <label className={label}>{t('portfolio.form.portfolio.balanceMxn')}</label>
            <input type="number" min="0" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required placeholder="0.00" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>{t('portfolio.form.portfolio.updatedDate')}</label>
            <input type="date" value={form.updatedDate} onChange={(e) => setForm({ ...form, updatedDate: e.target.value })} required className={inputClass} />
          </div>
          <div>
            <label className={label}>{t('portfolio.form.portfolio.renewsDate')}</label>
            <input type="date" value={form.renewsDate} onChange={(e) => setForm({ ...form, renewsDate: e.target.value })} required className={inputClass} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{portfolio ? t('portfolio.form.portfolio.submitEdit') : t('portfolio.form.portfolio.submitAdd')}</button>
        </div>
      </form>
    </Modal>
  )
}
