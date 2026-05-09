import { generateId } from '../../lib/id'
import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import type { MortgagePayment } from '../../store/types'
import { today } from '../../lib/formatters'
import { sortByDateDesc } from '../../lib/filters'
import { inputClass } from '../../lib/styles'

interface Props {
  open: boolean
  onClose: () => void
  payment?: MortgagePayment
}

const empty = () => ({ date: today(), totalPaid: '', balanceAfter: '', note: '' })
const label = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

export default function MortgagePaymentForm({ open, onClose, payment }: Props) {
  const addMortgagePayment = useStore((s) => s.addMortgagePayment)
  const updateMortgagePayment = useStore((s) => s.updateMortgagePayment)
  const config = useStore((s) => s.mortgageConfig)
  const allPayments = useStore((s) => s.mortgagePayments)

  const [form, setForm] = useState(empty())
  const [extraOverride, setExtraOverride] = useState<string | null>(null)

  useEffect(() => {
    if (payment) {
      setForm({ date: payment.date, totalPaid: String(payment.totalPaid), balanceAfter: String(payment.balanceAfter), note: payment.note ?? '' })
      setExtraOverride(null)
    } else {
      setForm(empty())
      setExtraOverride(null)
    }
  }, [payment, open])

  const previousBalance = useMemo(() => {
    const others = payment ? allPayments.filter((p) => p.id !== payment.id) : allPayments
    if (others.length === 0) return config.principal
    return sortByDateDesc(others)[0].balanceAfter
  }, [allPayments, payment, config.principal])

  const autoExtraCapital = useMemo(() => {
    const balAfter = parseFloat(form.balanceAfter)
    if (!balAfter || balAfter <= 0) return null
    const r = config.interestRate / 100 / 12
    const interest = previousBalance * r
    const ordinaryCapital = config.minimumPayment - interest
    const extra = (previousBalance - balAfter) - ordinaryCapital
    return Math.max(0, extra)
  }, [form.balanceAfter, previousBalance, config])

  const extraCapitalValue = extraOverride !== null ? parseFloat(extraOverride) || 0 : (autoExtraCapital ?? 0)
  const isAuto = extraOverride === null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: MortgagePayment = {
      id: payment?.id ?? generateId(),
      date: form.date,
      totalPaid: parseFloat(form.totalPaid) || 0,
      extraCapital: extraCapitalValue,
      balanceAfter: parseFloat(form.balanceAfter) || 0,
      note: form.note.trim() || undefined,
    }
    if (payment) updateMortgagePayment(payment.id, data)
    else addMortgagePayment(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'Edit Payment' : 'Record Mortgage Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Total Paid (MXN)</label>
            <input type="number" min="0" step="0.01" value={form.totalPaid} onChange={(e) => setForm({ ...form, totalPaid: e.target.value })} required placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={label}>Balance After (MXN)</label>
            <input type="number" min="0" step="0.01" value={form.balanceAfter} onChange={(e) => setForm({ ...form, balanceAfter: e.target.value })} required placeholder="0.00" className={inputClass} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={label.replace('mb-1', '')}>Extra Capital (MXN)</label>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] ${isAuto ? 'bg-[#eef8f4] text-[#2e7d65]' : 'bg-[#fdf6e3] text-[#c8912a]'}`}>
                {isAuto ? 'auto' : 'manual'}
              </span>
              <button
                type="button"
                onClick={() => isAuto
                  ? setExtraOverride(autoExtraCapital !== null ? String(Math.round(autoExtraCapital * 100) / 100) : '0')
                  : setExtraOverride(null)
                }
                className="text-[12px] text-[#41454d] hover:text-[#181d26] transition-colors"
              >
                {isAuto ? 'Override' : 'Reset to auto'}
              </button>
            </div>
          </div>
          {isAuto ? (
            <div className={`${inputClass} bg-[#f8fafc] text-[#41454d] cursor-default`}>
              {autoExtraCapital !== null ? autoExtraCapital.toLocaleString('en-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </div>
          ) : (
            <input type="number" min="0" step="0.01" value={extraOverride ?? ''} onChange={(e) => setExtraOverride(e.target.value)} placeholder="0.00" className={inputClass} />
          )}
          <p className="text-[11px] text-[#41454d] mt-1">Previous balance: ${previousBalance.toLocaleString('en-MX', { minimumFractionDigits: 2 })}</p>
        </div>

        <div>
          <label className={label}>Note (optional)</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Extra payment from bonus" className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>Cancel</button>
          <button type="submit" className={submitBtn}>{payment ? 'Save Changes' : 'Record Payment'}</button>
        </div>
      </form>
    </Modal>
  )
}
