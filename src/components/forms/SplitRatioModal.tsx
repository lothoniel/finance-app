import { useState } from 'react'
import Modal from '../ui/Modal'

type ApplyScope = 'following' | 'current' | 'allTime'

interface Props {
  open: boolean
  onClose: () => void
  newRatio: number
  user1Name: string
  user2Name: string
  lastSettlementDate: string | null
  onConfirm: (scope: ApplyScope) => void
}

const cancelBtn = 'flex-1 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors'
const submitBtn = 'flex-1 bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] rounded-[8px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#0d1218] dark:hover:bg-[#c4c8d0] transition-colors'

const SCOPE_OPTIONS: { value: ApplyScope; label: string; description: string }[] = [
  {
    value: 'following',
    label: 'Going forward only',
    description: 'Only new expenses will use the new split. Existing transactions keep their current ratio.',
  },
  {
    value: 'current',
    label: 'Since last settlement',
    description: 'Apply to all shared expenses since the last zero balance, plus new ones.',
  },
  {
    value: 'allTime',
    label: 'All time',
    description: 'Retroactively apply to every shared expense ever recorded.',
  },
]

export default function SplitRatioModal({ open, onClose, newRatio, user1Name, user2Name, lastSettlementDate, onConfirm }: Props) {
  const [scope, setScope] = useState<ApplyScope>('following')

  const user1Pct = Math.round(newRatio * 100)
  const user2Pct = 100 - user1Pct

  function handleConfirm() {
    onConfirm(scope)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply New Split Ratio">
      <div className="space-y-4">
        <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">
          New split: <span className="font-semibold text-[#181d26] dark:text-[#e8eaf0]">{user1Name} {user1Pct}% / {user2Name} {user2Pct}%</span>
        </p>
        <p className="text-[13px] text-[#41454d] dark:text-[#9297a0]">Apply this ratio to:</p>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map((opt) => {
            const disabled = opt.value === 'current' && !lastSettlementDate
            return (
              <label
                key={opt.value}
                className={`flex gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                  scope === opt.value
                    ? 'border-[#181d26] dark:border-[#e8eaf0] bg-[#f8fafc] dark:bg-[#252b3b]'
                    : 'border-[#e8e8e8] dark:border-[#2d3347] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  disabled={disabled}
                  onChange={() => setScope(opt.value)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div>
                  <div className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0]">{opt.label}</div>
                  <div className="text-[12px] text-[#9297a0] mt-0.5">{opt.description}</div>
                </div>
              </label>
            )
          })}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={cancelBtn}>Cancel</button>
          <button type="button" onClick={handleConfirm} className={submitBtn}>Apply</button>
        </div>
      </div>
    </Modal>
  )
}
