import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label?: string }
  accent?: string
  extra?: ReactNode
}

export default function KpiCard({ title, value, subtitle, icon, trend, accent, extra }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px] p-5">
      {(icon || trend !== undefined) && (
        <div className="flex items-start justify-between mb-3">
          {icon && (
            <div
              className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accent ? `${accent}18` : '#f0f2f5' }}
            >
              <span style={{ color: accent ?? '#41454d' }}>{icon}</span>
            </div>
          )}
          {trend !== undefined && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-[4px]"
              style={{
                backgroundColor: trend.value >= 0 ? '#e8f5ee' : '#fdecea',
                color: trend.value >= 0 ? '#1a7a3c' : '#c0392b',
              }}
            >
              {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#41454d] dark:text-[#9297a0]">{title}</p>
      <p className="text-[28px] font-normal text-[#181d26] dark:text-[#e8eaf0] leading-tight mt-1 tabular-nums">{value}</p>
      {subtitle && <p className="text-[12px] text-[#41454d] dark:text-[#9297a0] mt-1">{subtitle}</p>}
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  )
}
