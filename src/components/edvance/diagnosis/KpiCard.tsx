// KPI card used in DiagnosisResult header strip.

export function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  bg: string
}) {
  return (
    <div
      className="rounded-2xl bg-card p-5"
      style={{ border: '2px solid var(--border)', borderBottomWidth: '4px' }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: bg, color }}
        >
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs font-semibold text-muted">{sub}</p>}
    </div>
  )
}
