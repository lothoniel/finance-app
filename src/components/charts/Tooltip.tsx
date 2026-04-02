import type { TooltipProps } from 'recharts'
import { formatMXN } from '../../lib/formatters'

export default function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3448] rounded-xl shadow-lg p-3 min-w-[160px]">
      {label && (
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{entry.name}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {formatMXN(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
