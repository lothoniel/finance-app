import {
  BarChart as ReBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import CustomTooltip from './Tooltip'
import { formatMXNCompact } from '../../lib/formatters'

interface BarChartProps {
  data: Record<string, string | number>[]
  bars: { key: string; color: string; name: string }[]
  xKey: string
  height?: number
  horizontal?: boolean
  colorKey?: string
}

export default function BarChart({
  data,
  bars,
  xKey,
  height = 300,
  horizontal = false,
  colorKey,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E5E7EB"
          className="dark:[stroke:#2D3448]"
          vertical={!horizontal}
          horizontal={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickFormatter={(v) => formatMXNCompact(v as number)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
          </>
        ) : (
          <>
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
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        {bars.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        )}
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {colorKey && data.map((entry, idx) => (
              <Cell key={idx} fill={String(entry[colorKey] ?? bar.color)} />
            ))}
          </Bar>
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  )
}
