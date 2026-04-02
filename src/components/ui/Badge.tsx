interface BadgeProps {
  type: 'shared' | 'personal' | 'deposit' | 'gain' | 'income' | 'expense' | 'transfer' | 'debt' | string
  label?: string
}

const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
  shared: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'SHARED' },
  personal: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'PERSONAL' },
  deposit: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'DEPOSIT' },
  gain: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'GAIN' },
  withdrawal: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'WITHDRAWAL' },
  income: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'INCOME' },
  expense: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'EXPENSE' },
  transfer: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'TRANSFER' },
  debt: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'DEBT' },
  household: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'HOUSEHOLD' },
  rental: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', label: 'RENTAL' },
  others: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'OTHERS' },
}

export default function Badge({ type, label }: BadgeProps) {
  const key = type.toLowerCase()
  const config = typeConfig[key] ?? {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    label: type.toUpperCase(),
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {label ?? config.label}
    </span>
  )
}
