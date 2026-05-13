import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import CustomTooltip from './Tooltip'
import { formatMXNCompact } from '../../lib/formatters'

interface AreaChartProps {
  data: Record<string, string | number>[]
  areas: { key: string; color: string; name: string }[]
  xKey: string
  height?: number
  fillOpacity?: number
}

export default function AreaChart({ data, areas, xKey, height = 300, fillOpacity = 0.3 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} debounce={50}>
      <ReAreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={area.key} id={`grad-${area.key.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={fillOpacity} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="#E5E7EB" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickFormatter={(v) => formatMXNCompact(v as number)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.name}
            stroke={area.color}
            strokeWidth={2}
            fill={`url(#grad-${area.key.replace(/\s+/g, '-')})`}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  )
}
