// Radial gauge SVG and GaugeCard used in DiagnosisResult behavior profile section.

function RadialGauge({
  value,
  color,
  size = 140,
  thickness = 12,
}: {
  value: number
  color: string
  size?: number
  thickness?: number
}) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--border)"
        strokeWidth={thickness}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export function GaugeCard({
  icon,
  label,
  value,
  color,
  inverted = false,
  caption,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  inverted?: boolean
  caption: string
}) {
  const displayColor = inverted
    ? value > 60 ? 'var(--destructive)' : value > 30 ? 'var(--warning)' : 'var(--success)'
    : value > 65 ? color : value > 35 ? 'var(--warning)' : 'var(--destructive)'

  return (
    <div
      className="flex flex-col items-center rounded-3xl bg-card p-6 text-center"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <div className="relative">
        <RadialGauge value={value} color={displayColor} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color: displayColor }} className="mb-1">
            {icon}
          </span>
          <span className="text-3xl font-black" style={{ color: displayColor }}>
            {value}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1.5 text-xs font-semibold text-muted leading-relaxed max-w-[180px]">{caption}</p>
    </div>
  )
}
