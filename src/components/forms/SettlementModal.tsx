import { useState } from 'react'
import { generateId } from '../../lib/id'
import { useStore } from '../../store'
import { formatMXN } from '../../lib/formatters'
import { inputClass } from '../../lib/styles'
import Modal from '../ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  netSettlement: number
}

export default function SettlementModal({ open, onClose, netSettlement }: Props) {
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [paidBy, setPaidBy] = useState<'user1' | 'user2'>('user2')

  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addSettlement = useStore((s) => s.addSettlement)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addSettlement({
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      amount: parseFloat(amount) || 0,
      paidBy,
      description: desc,
    })
    setAmount('')
    setDesc('')
    setPaidBy('user2')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Settlement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paid By
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as 'user1' | 'user2')}
            className={inputClass}
          >
            <option value="user1">{user1Name}</option>
            <option value="user2">{user2Name}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount (MXN)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder={formatMXN(netSettlement)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Monthly settlement"
            className={inputClass}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium"
          >
            Record Settlement
          </button>
        </div>
      </form>
    </Modal>
  )
}
