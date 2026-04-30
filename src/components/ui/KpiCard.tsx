import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label?: string }
  accent?: string
  extra?: ReactNode
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent,
  extra,
}: KpiCardProps) {
  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50/80 dark:from-[#1A1F2E] dark:to-[#14192A] rounded-2xl p-5 border border-gray-200 dark:border-[#2D3448] shadow-sm relative overflow-hidden"
      style={accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: accent ? `${accent}20` : '#7C3AED20' }}
          >
            <span style={{ color: accent ?? '#7C3AED' }}>{icon}</span>
          </div>
        )}

        {/* Trend badge */}
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.value >= 0
                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {trend.value >= 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
            {trend.label && (
              <span className="text-gray-400 dark:text-gray-500">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 break-all tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {extra && <div className="mt-3">{extra}</div>}
      </div>
    </div>
  )
}
