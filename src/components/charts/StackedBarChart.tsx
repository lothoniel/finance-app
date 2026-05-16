import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMoneyCompact } from '../../lib/formatters'
import { useStore } from '../../store'

interface StackedBarChartProps {
  data: Record<string, unknown>[]
  categories: { name: string; color: string }[]
  xKey: string
  height?: number
}

export default function StackedBarChart({ data, categories, xKey, height = 260 }: StackedBarChartProps) {
  const currency = useStore((s) => s.settings.currencyDisplay)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#9297a0' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          formatter={(value) => formatMoneyCompact(value as number, currency)}
          contentStyle={{ fontSize: 12, border: '1px solid #e8e8e8', borderRadius: 6 }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        {categories.map(({ name, color }) => (
          <Bar key={name} dataKey={name} stackId="a" fill={color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
