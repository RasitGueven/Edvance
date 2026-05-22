// Helper components and data for DesignShowcase.tsx.
import { EdvanceCard } from '@/components/edvance'

// ── Section wrapper ───────────────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  )
}

// ── Color tokens ──────────────────────────────────────────────────────────────

const COLOR_GROUPS: { group: string; tokens: { label: string; var: string }[] }[] = [
  { group: 'Brand', tokens: [
    { label: 'Brand Navy',    var: '--brand-navy' },
    { label: 'Primary',       var: '--primary' },
    { label: 'Primary Light', var: '--primary-light' },
    { label: 'Primary Pale',  var: '--primary-pale' },
  ]},
  { group: 'Status', tokens: [
    { label: 'Success',     var: '--success' },
    { label: 'Warning',     var: '--warning' },
    { label: 'Destructive', var: '--destructive' },
    { label: 'Info',        var: '--info' },
  ]},
  { group: 'Gamification', tokens: [
    { label: 'XP Gold (=Accent)', var: '--xp-gold' },
    { label: 'XP Gold Light',     var: '--xp-gold-light' },
    { label: 'Streak Orange',     var: '--streak-orange' },
  ]},
  { group: 'Emotionale Momente', tokens: [
    { label: 'Level-Up',        var: '--color-levelup' },
    { label: 'Level-Up Moment', var: '--color-moment-levelup' },
    { label: 'Repair (Lila)',   var: '--color-moment-repair' },
    { label: 'Erfolg/Boss',     var: '--color-moment-green' },
    { label: 'Streak-Verlust',  var: '--color-moment-red' },
    { label: 'Moment-Bühne',    var: '--color-moment-bg' },
  ]},
  { group: 'Text & Surface', tokens: [
    { label: 'Text Primary',   var: '--text-primary' },
    { label: 'Text Secondary', var: '--text-secondary' },
    { label: 'Text Muted',     var: '--text-muted' },
    { label: 'Surface',        var: '--surface' },
  ]},
]

export function ColorTokenSection() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {COLOR_GROUPS.map(({ group, tokens }) => (
        <EdvanceCard key={group}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
            {group}
          </p>
          <div className="flex flex-col gap-3">
            {tokens.map(({ label, var: cssVar }) => (
              <div key={cssVar} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex-none border border-[var(--border)]"
                  style={{ backgroundColor: `var(${cssVar})` }}
                />
                <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{label}</span>
                <code className="text-xs text-[var(--text-muted)] font-mono">{cssVar}</code>
              </div>
            ))}
          </div>
        </EdvanceCard>
      ))}
    </div>
  )
}
