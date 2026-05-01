interface HeroKpiProps {
  label: string
  value: string
  sub?: string
  /** Use true for light-bg bands (cream) — inverts the glass style */
  light?: boolean
}

export default function HeroKpi({ label, value, sub, light = false }: HeroKpiProps) {
  const bg = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'
  const border = light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)'
  const labelColor = light ? 'rgba(24,29,38,0.6)' : 'rgba(255,255,255,0.75)'
  const valueColor = light ? '#181d26' : '#ffffff'
  const subColor = light ? 'rgba(24,29,38,0.55)' : 'rgba(255,255,255,0.7)'

  return (
    <div
      className="rounded-[10px] px-5 py-4 min-w-[140px]"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.4px] mb-2"
        style={{ color: labelColor }}
      >
        {label}
      </p>
      <p className="text-[28px] font-normal leading-tight" style={{ color: valueColor }}>
        {value}
      </p>
      {sub && (
        <p className="text-[12px] mt-1" style={{ color: subColor }}>
          {sub}
        </p>
      )}
    </div>
  )
}
