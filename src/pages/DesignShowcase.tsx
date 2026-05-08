import { useState } from 'react'
import {
  EdvanceCard,
  EdvanceBadge,
  MasteryBar,
  XPBar,
  StatCard,
  AvatarInitials,
  ProgressStep,
  EmptyState,
  LoadingPulse,
  ToastBanner,
} from '@/components/edvance'

type ToastConfig = {
  type: 'success' | 'xp' | 'warning' | 'error'
  message: string
  xpAmount?: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DesignShowcase() {
  const [toast, setToast] = useState<ToastConfig | null>(null)

  function fireToast(config: ToastConfig) {
    setToast(null)
    // small delay so re-triggering same type re-animates
    setTimeout(() => setToast(config), 50)
  }

  return (
    <div className="min-h-full bg-[var(--background)] pb-16">
      {/* Header */}
      <div
        className="px-8 py-10"
        style={{ backgroundColor: 'var(--brand-navy)' }}
      >
        <h1 className="text-2xl font-bold text-white">Edvance Design Showcase</h1>
        <p className="text-sm text-[var(--brand-blue-light)] mt-1 leading-relaxed">
          Alle Komponenten auf einen Blick – der visuelle Spiegel vor jedem Release.
        </p>
      </div>

      <div className="px-8 py-10 flex flex-col gap-12 max-w-5xl mx-auto">
        {/* ── EdvanceCard ── */}
        <Section title="EdvanceCard – Varianten">
          <div className="grid grid-cols-2 gap-4">
            <EdvanceCard variant="default">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                variant: default
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Standard-Card mit weißem Hintergrund. Für den meisten Content.
              </p>
            </EdvanceCard>

            <EdvanceCard variant="raised">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                variant: raised
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Erhöhte Card für prominenteren Content – gleicher Stil, stärkerer Schatten.
              </p>
            </EdvanceCard>

            <EdvanceCard variant="navy">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
                variant: navy
              </p>
              <p className="text-sm leading-relaxed opacity-80">
                Navy-Hintergrund. Für Header-Bereiche oder primäre Highlights.
              </p>
            </EdvanceCard>

            <EdvanceCard variant="blue-pale">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                variant: blue-pale
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Helles Blau. Für Info-Boxen oder Onboarding-Hinweise.
              </p>
            </EdvanceCard>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(
              ['left-primary', 'left-success', 'left-warning', 'left-destructive'] as const
            ).map((accent) => (
              <EdvanceCard key={accent} accent={accent}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  accent: {accent}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Farbiger linker Rand für Status-Indikation.
                </p>
              </EdvanceCard>
            ))}
          </div>
        </Section>

        {/* ── EdvanceBadge ── */}
        <Section title="EdvanceBadge – alle Varianten">
          <EdvanceCard>
            <div className="flex flex-wrap gap-3">
              <EdvanceBadge variant="primary">Primary</EdvanceBadge>
              <EdvanceBadge variant="success">Erfolg</EdvanceBadge>
              <EdvanceBadge variant="warning">Hinweis</EdvanceBadge>
              <EdvanceBadge variant="destructive">Fehler</EdvanceBadge>
              <EdvanceBadge variant="muted">Neutral</EdvanceBadge>
              <EdvanceBadge variant="xp">1.240 XP</EdvanceBadge>
              <EdvanceBadge variant="streak">14 Tage</EdvanceBadge>
            </div>
          </EdvanceCard>
        </Section>

        {/* ── MasteryBar ── */}
        <Section title="MasteryBar – Level 1–10">
          <EdvanceCard>
            <div className="flex flex-col gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                <MasteryBar key={lvl} level={lvl} showLabel size="md" />
              ))}
            </div>
          </EdvanceCard>
          <div className="grid grid-cols-3 gap-4">
            <EdvanceCard>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                size: sm
              </p>
              <MasteryBar level={6} size="sm" />
            </EdvanceCard>
            <EdvanceCard>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                size: md
              </p>
              <MasteryBar level={6} size="md" />
            </EdvanceCard>
            <EdvanceCard>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                size: lg
              </p>
              <MasteryBar level={6} size="lg" />
            </EdvanceCard>
          </div>
        </Section>

        {/* ── XPBar ── */}
        <Section title="XPBar">
          <EdvanceCard>
            <div className="flex flex-col gap-6">
              <XPBar current={840} max={1000} level={7} levelName="Fortgeschrittener" />
              <XPBar current={120} max={500} level={2} levelName="Anfänger" />
              <XPBar current={480} max={480} level={12} levelName="Meister" />
            </div>
          </EdvanceCard>
        </Section>

        {/* ── StatCard ── */}
        <Section title="StatCard – alle Varianten">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              value="92%"
              label="Aufgaben abgeschlossen"
              icon="✅"
              trend="+8%"
              color="var(--success)"
            />
            <StatCard
              value="14"
              label="Tage Streak aktiv"
              icon="🔥"
              trend="+3"
              color="var(--streak-orange)"
            />
            <StatCard
              value="3.240"
              label="XP diese Woche"
              icon="⚡"
              trend="+12%"
              color="var(--xp-gold)"
            />
            <StatCard
              value="2"
              label="Offene Aufgaben"
              icon="📋"
              trend="-1"
              color="var(--warning)"
            />
            <StatCard
              value="18"
              label="Aktive Schüler"
              icon="👥"
              color="var(--primary)"
            />
            <StatCard
              value="4.8"
              label="Coach-Bewertung"
              icon="⭐"
              trend="+0.2"
              color="var(--level-purple)"
            />
          </div>
        </Section>

        {/* ── AvatarInitials ── */}
        <Section title="AvatarInitials">
          <EdvanceCard>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                  Größen
                </p>
                <div className="flex items-end gap-4">
                  <AvatarInitials name="Maria Schmidt" size="sm" />
                  <AvatarInitials name="Maria Schmidt" size="md" />
                  <AvatarInitials name="Maria Schmidt" size="lg" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                  Auto-Farbe aus Namen
                </p>
                <div className="flex gap-3">
                  {[
                    'Anna Müller',
                    'Jonas Weber',
                    'Lena Fischer',
                    'Max Bauer',
                    'Sophie Klein',
                    'Tim Schulz',
                  ].map((name) => (
                    <div key={name} className="flex flex-col items-center gap-1.5">
                      <AvatarInitials name={name} />
                      <span className="text-xs text-[var(--text-muted)] text-center leading-tight max-w-[48px]">
                        {name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </EdvanceCard>
        </Section>

        {/* ── ProgressStep ── */}
        <Section title="ProgressStep">
          <EdvanceCard>
            <div className="flex flex-col gap-8">
              <ProgressStep
                steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']}
                current={1}
              />
              <ProgressStep
                steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']}
                current={2}
              />
              <ProgressStep
                steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']}
                current={4}
              />
            </div>
          </EdvanceCard>
        </Section>

        {/* ── EmptyState ── */}
        <Section title="EmptyState">
          <div className="grid grid-cols-2 gap-4">
            <EdvanceCard>
              <EmptyState
                icon="📚"
                title="Noch keine Aufgaben"
                description="Dein Coach hat noch keine Aufgaben für dich erstellt. Schau morgen wieder rein."
                action={
                  <button
                    className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold bg-[var(--primary)] text-white"
                    style={{ minHeight: '44px' }}
                  >
                    Aufgaben anfragen
                  </button>
                }
              />
            </EdvanceCard>
            <EdvanceCard>
              <EmptyState
                icon="🏆"
                title="Keine Erfolge noch"
                description="Schließe deine erste Aufgabe ab, um hier Abzeichen zu sammeln."
              />
            </EdvanceCard>
          </div>
        </Section>

        {/* ── LoadingPulse ── */}
        <Section title="LoadingPulse – alle Typen">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                type: list
              </p>
              <EdvanceCard>
                <LoadingPulse type="list" lines={4} />
              </EdvanceCard>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                type: card
              </p>
              <LoadingPulse type="card" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
                type: stat
              </p>
              <LoadingPulse type="stat" />
            </div>
          </div>
        </Section>

        {/* ── ToastBanner ── */}
        <Section title="ToastBanner – Demo">
          <EdvanceCard>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Klick auf einen Button um den entsprechenden Toast auszulösen.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  fireToast({
                    type: 'xp',
                    message: 'Aufgabe abgeschlossen!',
                    xpAmount: 150,
                  })
                }
                className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold text-[var(--brand-navy)]"
                style={{
                  backgroundColor: 'var(--xp-gold)',
                  minHeight: '44px',
                }}
              >
                🎉 XP Toast
              </button>
              <button
                onClick={() =>
                  fireToast({ type: 'success', message: 'Gespeichert!' })
                }
                className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--success)', minHeight: '44px' }}
              >
                ✓ Erfolg
              </button>
              <button
                onClick={() =>
                  fireToast({ type: 'warning', message: 'Bitte vervollständige dein Profil.' })
                }
                className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--warning-light)',
                  color: 'var(--warning)',
                  minHeight: '44px',
                }}
              >
                ⚠️ Warnung
              </button>
              <button
                onClick={() =>
                  fireToast({ type: 'error', message: 'Etwas ist schiefgelaufen.' })
                }
                className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--destructive)', minHeight: '44px' }}
              >
                ✕ Fehler
              </button>
            </div>
          </EdvanceCard>
        </Section>

        {/* ── Color Palette ── */}
        <Section title="Design Tokens – Farben">
          <EdvanceCard>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Brand Navy', var: '--brand-navy' },
                { label: 'Primary', var: '--primary' },
                { label: 'Primary Light', var: '--primary-light' },
                { label: 'Primary Pale', var: '--primary-pale' },
                { label: 'Success', var: '--success' },
                { label: 'Warning', var: '--warning' },
                { label: 'Destructive', var: '--destructive' },
                { label: 'XP Gold', var: '--xp-gold' },
                { label: 'Streak Orange', var: '--streak-orange' },
                { label: 'Level Purple', var: '--level-purple' },
              ].map(({ label, var: cssVar }) => (
                <div key={cssVar} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-[var(--radius-sm)] flex-none border border-[var(--border)]"
                    style={{ backgroundColor: `var(${cssVar})` }}
                  />
                  <span className="text-sm font-semibold text-[var(--text-primary)] w-40">
                    {label}
                  </span>
                  <code className="text-xs text-[var(--text-muted)] font-mono">{cssVar}</code>
                </div>
              ))}
            </div>
          </EdvanceCard>
        </Section>
      </div>

      {toast && (
        <ToastBanner
          type={toast.type}
          message={toast.message}
          xpAmount={toast.xpAmount}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
