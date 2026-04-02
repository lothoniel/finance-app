import { useState } from 'react'
import { Plus, X, ShoppingCart, DollarSign, ArrowRightLeft, CreditCard } from 'lucide-react'
import ExpenseForm from '../forms/ExpenseForm'
import PaycheckForm from '../forms/PaycheckForm'
import TransferForm from '../forms/TransferForm'
import DebtPaymentForm from '../forms/DebtPaymentForm'

type ModalType = 'expense' | 'paycheck' | 'transfer' | 'debt' | null

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)

  function openModal(type: ModalType) {
    setModal(type)
    setOpen(false)
  }

  const actions = [
    { type: 'expense' as const, label: 'Expense', icon: ShoppingCart, color: '#EF4444' },
    { type: 'paycheck' as const, label: 'Paycheck', icon: DollarSign, color: '#22C55E' },
    { type: 'transfer' as const, label: 'Transfer', icon: ArrowRightLeft, color: '#3B82F6' },
    { type: 'debt' as const, label: 'Debt Pay', icon: CreditCard, color: '#F59E0B' },
  ]

  return (
    <>
      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2">
            {actions.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => openModal(type)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-[#6B3FA0] text-white shadow-xl flex items-center justify-center hover:bg-[#5a3490] transition-all hover:scale-105"
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Modals */}
      <ExpenseForm open={modal === 'expense'} onClose={() => setModal(null)} />
      <PaycheckForm open={modal === 'paycheck'} onClose={() => setModal(null)} />
      <TransferForm open={modal === 'transfer'} onClose={() => setModal(null)} />
      <DebtPaymentForm open={modal === 'debt'} onClose={() => setModal(null)} />
    </>
  )
}
