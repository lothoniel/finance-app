import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import CustomTooltip from './Tooltip'

interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  centerLabel?: string
  centerValue?: string
  height?: number
}

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 260,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: height, height, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {/* Center text */}
            {(centerLabel || centerValue) && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                {centerValue && (
                  <tspan
                    x="50%"
                    dy="-6"
                    fontSize="18"
                    fontWeight="bold"
                    fill="#111827"
                    className="dark:fill-white"
                  >
                    {centerValue}
                  </tspan>
                )}
                {centerLabel && (
                  <tspan
                    x="50%"
                    dy="20"
                    fontSize="11"
                    fill="#6B7280"
                  >
                    {centerLabel}
                  </tspan>
                )}
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((entry) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
          return (
            <div key={entry.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                {entry.name}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white flex-shrink-0">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
