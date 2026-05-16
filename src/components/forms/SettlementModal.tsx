import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { generateId } from '../../lib/id'
import { useStore } from '../../store'
import { formatMoney } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'
import Modal from '../ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  netSettlement: number
  creditor: 'user1' | 'user2' | 'even'
}

const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function SettlementModal({ open, onClose, netSettlement, creditor }: Props) {
  const { t } = useTranslation()
  const debtor: 'user1' | 'user2' = creditor === 'user2' ? 'user1' : 'user2'

  const [amount, setAmount] = useState(netSettlement.toFixed(2))
  const [desc, setDesc] = useState('')
  const [paidBy, setPaidBy] = useState<'user1' | 'user2'>(debtor)

  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const currency = useStore((s) => s.settings.currencyDisplay)
  const addSettlement = useStore((s) => s.addSettlement)

  useEffect(() => {
    if (open) {
      setAmount(netSettlement.toFixed(2))
      setDesc('')
      setPaidBy(debtor)
    }
  }, [open, debtor, netSettlement])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addSettlement({ id: generateId(), date: new Date().toISOString().slice(0, 10), amount: parseFloat(amount) || 0, paidBy, description: desc })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('sharedBalance.settlementForm.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>{t('expenses.form.paidBy')}</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as 'user1' | 'user2')} className={inputClass}>
            <option value="user1">{user1Name}</option>
            <option value="user2">{user2Name}</option>
          </select>
        </div>
        <div>
          <label className={label}>{t('sharedBalance.settlementForm.amountMxn')}</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder={formatMoney(netSettlement, currency)} className={inputClass} />
        </div>
        <div>
          <label className={label}>{t('expenses.form.description')}</label>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('sharedBalance.settlementForm.descriptionPlaceholder')} className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>{t('common.cancel')}</button>
          <button type="submit" className={submitBtn}>{t('sharedBalance.settlementForm.submit')}</button>
        </div>
      </form>
    </Modal>
  )
}
