import type { CSSProperties, JSX } from 'react'

/**
 * Game-Level-Hintergrund für den Lernpfad — eine durchgehende, beleuchtete
 * Spielwelt (Vibe: Mario/Candy-Crush-Map, aber in Edvance-CI). Verlaufs-basierter
 * Himmel + Sonne, atmosphärische Ferne (Berge, hazy Hügel), grüner Boden mit
 * weicher Geländeschattierung, beschattete Bäume/Büsche/Blumen. Der interaktive
 * Trail + die Knoten liegen darüber (LearningPathMap).
 *
 * Rein dekorativ (kein Text → kein i18n). Alle Farben aus CSS-Variablen via
 * color-mix (§11: keine hardcodierten Farben). Bewegung respektiert
 * prefers-reduced-motion.
 */

const mix = (token: string, pct: number, base = 'white'): string =>
  `color-mix(in srgb, var(${token}) ${pct}%, ${base})`

// ── Deko-Platzierung (Seitenränder, damit der zentrale Trail frei bleibt) ──────
const CLOUDS = [
  { x: 12, top: 4, w: 110, dur: 30, delay: 0 },
  { x: 64, top: 9, w: 140, dur: 38, delay: 9 },
  { x: 40, top: 2, w: 92, dur: 34, delay: 18 },
]
const TREES = [
  { x: 4, bottom: 5, s: 1.05, far: false },
  { x: 89, bottom: 9, s: 1.15, far: false },
  { x: 13, bottom: 41, s: 0.72, far: true },
  { x: 85, bottom: 53, s: 0.62, far: true },
]
const BUSHES = [
  { x: 21, bottom: 4, s: 0.95 },
  { x: 76, bottom: 3, s: 1.05 },
  { x: 8, bottom: 26, s: 0.6 },
]
const FLOWERS = [
  { x: 10, bottom: 14, s: 1, c: '--color-accent' },
  { x: 17, bottom: 9, s: 0.8, c: '--color-error-answer' },
  { x: 88, bottom: 18, s: 0.9, c: '--color-accent' },
  { x: 82, bottom: 6, s: 1, c: '--color-repair' },
  { x: 6, bottom: 33, s: 0.7, c: '--color-accent' },
  { x: 92, bottom: 30, s: 0.7, c: '--color-error-answer' },
  { x: 24, bottom: 18, s: 0.8, c: '--color-accent' },
  { x: 72, bottom: 22, s: 0.8, c: '--color-repair' },
]

export function LernpfadBackground(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes lp-cloud { 0%{transform:translate(-50%,18px);}50%{transform:translate(-50%,-10px);}100%{transform:translate(-50%,18px);} }
        @keyframes lp-sun   { 0%,100%{transform:scale(1);opacity:.9;}50%{transform:scale(1.06);opacity:1;} }
        @keyframes lp-sway  { 0%,100%{transform:rotate(-1.5deg);}50%{transform:rotate(1.5deg);} }
        .lp-cloud{animation:lp-cloud var(--d,32s) ease-in-out var(--dl,0s) infinite;}
        .lp-sun{animation:lp-sun 7s ease-in-out infinite;}
        .lp-tree{transform-origin:bottom center;animation:lp-sway var(--d,6s) ease-in-out var(--dl,0s) infinite;}
        @media (prefers-reduced-motion: reduce){.lp-cloud,.lp-sun,.lp-tree{animation:none;}}
      `}</style>

      {/* ── Himmel ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-[42%]"
        style={{
          background: `linear-gradient(to bottom, ${mix('--color-primary', 26)} 0%, ${mix('--color-primary', 12)} 55%, ${mix('--color-primary-light', 80)} 100%)`,
        }}
      />

      {/* Sonne mit weichem Schein, oben rechts */}
      <div
        className="lp-sun absolute right-[14%] top-[5%] h-28 w-28 rounded-[var(--radius-full)]"
        style={{
          background: `radial-gradient(circle, ${mix('--color-accent', 92)} 0%, ${mix('--color-gold-champagner', 85)} 34%, color-mix(in srgb, var(--color-gold-champagner) 40%, transparent) 60%, transparent 75%)`,
        }}
      />

      {/* ── Atmosphärische Ferne: Berge am Horizont (hazy) ─────────────────── */}
      <svg
        className="absolute inset-x-0 top-[26%] h-[20%] w-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0 120 L48 54 L96 100 L150 40 L210 104 L270 58 L330 102 L400 60 L400 120 Z"
          fill={mix('--color-primary', 22)}
          opacity={0.55}
        />
        <path
          d="M0 120 L70 78 L140 112 L210 70 L290 110 L360 80 L400 104 L400 120 Z"
          fill={mix('--color-primary', 16)}
          opacity={0.5}
        />
      </svg>

      {/* Wolken */}
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          className="lp-cloud absolute"
          viewBox="0 0 120 56"
          style={{ left: `${c.x}%`, top: `${c.top}%`, width: c.w, height: c.w * 0.47, filter: `drop-shadow(0 8px 10px color-mix(in srgb, var(--color-primary) 16%, transparent))`, ['--d' as string]: `${c.dur}s`, ['--dl' as string]: `${c.delay}s` } as CSSProperties}
        >
          <g fill="white">
            <circle cx="34" cy="34" r="18" />
            <circle cx="60" cy="22" r="25" />
            <circle cx="88" cy="34" r="18" />
            <rect x="30" y="34" width="62" height="19" rx="9" />
          </g>
          <ellipse cx="60" cy="49" rx="38" ry="6" fill={mix('--color-primary-light', 92)} />
        </svg>
      ))}

      {/* ── Boden: durchgehende grüne Welt mit Geländeschattierung ─────────── */}
      <div className="absolute inset-x-0 bottom-0 top-[38%]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lp-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: mix('--color-success-grow', 46) }} />
              <stop offset="38%" style={{ stopColor: mix('--color-mastery-proficient', 52) }} />
              <stop offset="100%" style={{ stopColor: mix('--color-mastery-mastered', 64) }} />
            </linearGradient>
            <filter id="lp-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>

          {/* welliger Horizont-Rand + Boden-Füllung */}
          <path d="M0 40 Q70 8 150 30 Q240 58 320 24 Q368 6 400 26 L400 400 L0 400 Z" fill="url(#lp-ground)" />

          {/* Geländeschattierung: helle (sonnenbeschienene) Kuppen + dunkle Senken */}
          <g filter="url(#lp-blur)">
            <ellipse cx="110" cy="150" rx="120" ry="46" fill={mix('--color-success-grow', 60)} opacity={0.5} />
            <ellipse cx="320" cy="250" rx="140" ry="54" fill={mix('--color-success-grow', 55)} opacity={0.45} />
            <ellipse cx="80" cy="330" rx="130" ry="50" fill={mix('--color-mastery-mastered', 70)} opacity={0.35} />
            <ellipse cx="300" cy="120" rx="100" ry="40" fill={mix('--color-mastery-mastered', 65)} opacity={0.3} />
          </g>
          {/* sanfter Schatten direkt unter dem Horizont (Tiefe) */}
          <path d="M0 40 Q70 8 150 30 Q240 58 320 24 Q368 6 400 26 L400 64 Q368 44 320 62 Q240 96 150 68 Q70 46 0 78 Z" fill={mix('--color-mastery-mastered', 55)} opacity={0.25} />
        </svg>

        {/* Blumen-Streu (Textur) */}
        {FLOWERS.map((f, i) => (
          <Flower key={i} x={f.x} bottom={f.bottom} s={f.s} color={f.c} />
        ))}
        {/* Büsche */}
        {BUSHES.map((b, i) => (
          <Bush key={i} x={b.x} bottom={b.bottom} s={b.s} />
        ))}
        {/* Bäume (mit Wiegen + Schlagschatten) */}
        {TREES.map((t, i) => (
          <Tree key={i} x={t.x} bottom={t.bottom} s={t.s} far={t.far} delay={i * 0.8} />
        ))}
      </div>
    </div>
  )
}

// ── Prop-Komponenten (eigenes viewBox → Kreise bleiben rund) ──────────────────
function Tree({ x, bottom, s, far, delay }: { x: number; bottom: number; s: number; far: boolean; delay: number }): JSX.Element {
  return (
    <svg
      className="lp-tree absolute"
      viewBox="0 0 80 116"
      style={{ left: `${x}%`, bottom: `${bottom}%`, width: 80 * s, height: 116 * s, opacity: far ? 0.78 : 1, ['--d' as string]: `${6 + s}s`, ['--dl' as string]: `${delay}s` } as CSSProperties}
    >
      {/* Schlagschatten */}
      <ellipse cx="40" cy="108" rx="26" ry="6" fill={mix('--color-mastery-mastered', 60, 'var(--color-navy-deep)')} opacity={0.22} />
      {/* Stamm */}
      <rect x="35" y="66" width="11" height="40" rx="5" fill={mix('--color-gold-warning', 58, 'var(--color-navy-deep)')} />
      {/* Laub: Schatten → Basis → Licht → Highlight */}
      <circle cx="26" cy="56" r="21" fill={mix('--color-mastery-mastered', 78)} />
      <circle cx="54" cy="52" r="22" fill={mix('--color-mastery-proficient', 70)} />
      <circle cx="40" cy="34" r="25" fill={mix('--color-success-skilltree', 62)} />
      <circle cx="32" cy="26" r="11" fill={mix('--color-success-grow', 70)} opacity={0.8} />
    </svg>
  )
}

function Bush({ x, bottom, s }: { x: number; bottom: number; s: number }): JSX.Element {
  return (
    <svg className="absolute" viewBox="0 0 84 52" style={{ left: `${x}%`, bottom: `${bottom}%`, width: 84 * s, height: 52 * s }}>
      <ellipse cx="42" cy="47" rx="30" ry="5" fill={mix('--color-mastery-mastered', 60, 'var(--color-navy-deep)')} opacity={0.18} />
      <circle cx="22" cy="30" r="16" fill={mix('--color-mastery-mastered', 76)} />
      <circle cx="60" cy="30" r="16" fill={mix('--color-mastery-mastered', 76)} />
      <circle cx="42" cy="22" r="20" fill={mix('--color-mastery-proficient', 66)} />
      <circle cx="36" cy="16" r="8" fill={mix('--color-success-grow', 72)} opacity={0.8} />
    </svg>
  )
}

function Flower({ x, bottom, s, color }: { x: number; bottom: number; s: number; color: string }): JSX.Element {
  return (
    <svg className="absolute" viewBox="0 0 24 24" style={{ left: `${x}%`, bottom: `${bottom}%`, width: 18 * s, height: 18 * s }}>
      <g fill="white">
        <circle cx="12" cy="5" r="4" />
        <circle cx="19" cy="12" r="4" />
        <circle cx="12" cy="19" r="4" />
        <circle cx="5" cy="12" r="4" />
      </g>
      <circle cx="12" cy="12" r="4" fill={`var(${color})`} />
    </svg>
  )
}
