import {
  EdvanceCard,
  EdvanceBadge,
  StatCard,
  AvatarInitials,
  ProgressStep,
  EmptyState,
  LoadingPulse,
} from '@/components/edvance'

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

// ── StatCard Section ──────────────────────────────────────────────────────────

export function StatCardSection() {
  return (
    <Section title="StatCard – Hover-Lift-Effekt">
      <div className="grid grid-cols-3 gap-4">
        <StatCard value="92%"   label="Aufgaben abgeschlossen" icon="✅" trend="+8%"  color="var(--success)" />
        <StatCard value="14"    label="Tage Streak aktiv"      icon="🔥" trend="+3"   color="var(--streak-orange)" />
        <StatCard value="3.240" label="XP diese Woche"         icon="⚡" trend="+12%" color="var(--xp-gold)" />
        <StatCard value="2"     label="Offene Aufgaben"        icon="📋" trend="-1"   color="var(--warning)" />
        <StatCard value="18"    label="Aktive Schüler"         icon="👥"              color="var(--primary)" />
        <StatCard value="4.8"   label="Coach-Bewertung"        icon="⭐" trend="+0.2" color="var(--level-purple)" />
      </div>
    </Section>
  )
}

// ── AvatarInitials Section ────────────────────────────────────────────────────

export function AvatarSection() {
  return (
    <Section title="AvatarInitials – Auto-Farbe aus Name">
      <EdvanceCard>
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">Größen</p>
            <div className="flex items-end gap-4">
              <AvatarInitials name="Maria Schmidt" size="sm" />
              <AvatarInitials name="Maria Schmidt" size="md" />
              <AvatarInitials name="Maria Schmidt" size="lg" />
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
              Konsistente Hash-Farbe aus Namen
            </p>
            <div className="flex gap-4 flex-wrap">
              {['Anna Müller', 'Jonas Weber', 'Lena Fischer', 'Max Bauer', 'Sophie Klein', 'Tim Schulz'].map(
                (name) => (
                  <div key={name} className="flex flex-col items-center gap-1.5">
                    <AvatarInitials name={name} />
                    <span className="text-xs text-[var(--text-muted)] text-center max-w-[48px] leading-tight">
                      {name.split(' ')[0]}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </EdvanceCard>
    </Section>
  )
}

// ── ProgressStep Section ──────────────────────────────────────────────────────

export function ProgressStepSection() {
  return (
    <Section title="ProgressStep – Onboarding-Stepper">
      <EdvanceCard>
        <div className="flex flex-col gap-8">
          <ProgressStep steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']} current={0} />
          <ProgressStep steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']} current={2} />
          <ProgressStep steps={['Profil', 'Fächer', 'Ziele', 'Abschluss']} current={4} />
        </div>
      </EdvanceCard>
    </Section>
  )
}

// ── EmptyState Section ────────────────────────────────────────────────────────

export function EmptyStateSection() {
  return (
    <Section title="EmptyState – einladende Leerzustände">
      <div className="grid grid-cols-2 gap-4">
        <EdvanceCard>
          <EmptyState
            icon="📚"
            title="Noch keine Aufgaben"
            description="Dein Coach hat noch keine Aufgaben erstellt. Schau morgen wieder rein."
            action={
              <button
                className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold bg-[var(--primary)] text-white min-h-[44px]"
              >
                Aufgaben anfragen
              </button>
            }
          />
        </EdvanceCard>
        <EdvanceCard>
          <EmptyState
            icon="🏆"
            title="Noch keine Erfolge"
            description="Schließe deine erste Aufgabe ab, um hier Abzeichen zu sammeln."
          />
        </EdvanceCard>
      </div>
    </Section>
  )
}

// ── LoadingPulse Section ──────────────────────────────────────────────────────

export function LoadingPulseSection() {
  return (
    <Section title="LoadingPulse – Skeleton-Loader">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">type: list</p>
          <EdvanceCard><LoadingPulse type="list" lines={4} /></EdvanceCard>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">type: card</p>
          <LoadingPulse type="card" />
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">type: stat</p>
          <LoadingPulse type="stat" />
        </div>
      </div>
    </Section>
  )
}

// ── Animations Section ────────────────────────────────────────────────────────

export function AnimationsSection({ animKey, onTrigger }: { animKey: number; onTrigger: () => void }) {
  return (
    <Section title="Animationen – Demo">
      <EdvanceCard>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          Klicke auf einen Button um die Animation einmalig zu triggern.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          {[
            { label: 'bounce-pop',   cls: 'animate-bounce-pop' },
            { label: 'scale-in',     cls: 'animate-scale-in' },
            { label: 'fade-in',      cls: 'animate-fade-in' },
            { label: 'xp-pulse',     cls: 'animate-xp-pulse' },
          ].map(({ label, cls }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div
                key={`${label}-${animKey}`}
                className={`w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--primary)] flex items-center justify-center text-white text-lg ${animKey > 0 ? cls : ''}`}
              >
                ⚡
              </div>
              <button
                className="text-xs font-mono text-[var(--primary)] underline"
                onClick={onTrigger}
              >
                .{label}
              </button>
            </div>
          ))}
        </div>
      </EdvanceCard>
    </Section>
  )
}

// ── EdvanceBadge Section ──────────────────────────────────────────────────────

export function BadgeSection() {
  return (
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
  )
}
