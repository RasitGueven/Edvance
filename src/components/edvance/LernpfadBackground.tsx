import type { CSSProperties, JSX } from 'react'

/**
 * Dekorativer Hintergrund für den Lernpfad — helle, lebendige „Welt" (Mario-Vibe,
 * aber in Edvance-CI): klarer blauer Himmel oben, nach oben treibende Wolken, unten
 * rollende grüne Hügel in den Mastery-Grüns. Der Pfad klettert aus der Welt hinauf.
 *
 * Rein dekorativ (kein Text → kein i18n). Alle Farben aus CSS-Variablen
 * (§11: keine hardcodierten Farben). Bewegung respektiert prefers-reduced-motion.
 */

// Wolken: x-Start (%), Breite (px), Animations-Dauer & -Delay (s), Höhe-Anker (top %).
const CLOUDS: { x: number; w: number; dur: number; delay: number; top: number }[] = [
  { x: 10, w: 104, dur: 26, delay: 0, top: 18 },
  { x: 62, w: 132, dur: 32, delay: 7, top: 30 },
  { x: 36, w: 88, dur: 28, delay: 14, top: 8 },
  { x: 78, w: 110, dur: 30, delay: 20, top: 44 },
]

// Büsche auf den Hügeln (wenige Akzente): x (%), Breite (px), Grün-Mix-Token.
const BUSHES: { x: number; w: number; fill: string }[] = [
  { x: 16, w: 64, fill: 'var(--color-mastery-mastered)' },
  { x: 70, w: 80, fill: 'var(--color-mastery-proficient)' },
  { x: 47, w: 52, fill: 'var(--color-mastery-mastered)' },
]

export function LernpfadBackground(): JSX.Element {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes lp-cloud-rise {
          0%   { transform: translate(-50%, 130%); opacity: 0; }
          14%  { opacity: 1; }
          86%  { opacity: 1; }
          100% { transform: translate(-50%, -160%); opacity: 0; }
        }
        .lp-cloud { animation: lp-cloud-rise var(--lp-dur, 28s) linear var(--lp-delay, 0s) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp-cloud { animation: none; opacity: 0.9; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* Layer 1 — Himmel: klarer, heller Blau-Verlauf (unten heller → oben tiefer). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top,' +
            ' color-mix(in srgb, var(--color-primary) 6%, white) 0%,' +
            ' color-mix(in srgb, var(--color-primary) 15%, white) 50%,' +
            ' color-mix(in srgb, var(--color-primary) 24%, white) 100%)',
        }}
      />

      {/* Layer 2 — Wolken: treiben nach oben durch den Himmel. */}
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          className="lp-cloud absolute"
          viewBox="0 0 120 56"
          style={
            {
              left: `${c.x}%`,
              top: `${c.top}%`,
              width: c.w,
              height: c.w * 0.47,
              filter:
                'drop-shadow(0 6px 10px color-mix(in srgb, var(--color-primary) 18%, transparent))',
              '--lp-delay': `${c.delay}s`,
              '--lp-dur': `${c.dur}s`,
            } as CSSProperties
          }
        >
          <g fill="white">
            <circle cx="34" cy="34" r="18" />
            <circle cx="60" cy="24" r="24" />
            <circle cx="86" cy="34" r="18" />
            <rect x="30" y="34" width="60" height="18" rx="9" />
          </g>
          <ellipse
            cx="60"
            cy="49"
            rx="36"
            ry="6"
            fill="var(--color-primary-light)"
          />
        </svg>
      ))}

      {/* Layer 3 — Hügel-Landschaft (rollende Grüns, mehrschichtig für Tiefe). */}
      <div className="absolute bottom-0 left-0 h-72 w-full">
        {/* Büsche sitzen auf der vorderen Hügellinie (wenige Akzente). */}
        {BUSHES.map((b, i) => (
          <svg
            key={i}
            className="absolute bottom-16"
            viewBox="0 0 80 48"
            style={{ left: `${b.x}%`, width: b.w, height: b.w * 0.6 }}
          >
            <g fill={b.fill}>
              <circle cx="24" cy="30" r="16" />
              <circle cx="44" cy="22" r="20" />
              <circle cx="60" cy="32" r="14" />
              <rect x="20" y="30" width="44" height="18" rx="6" />
            </g>
          </svg>
        ))}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 288"
          preserveAspectRatio="none"
        >
          {/* hintere Hügelkette (heller, weiter weg) */}
          <path
            d="M0 150 Q80 96 170 132 Q260 168 330 120 Q370 94 400 116 L400 288 L0 288 Z"
            fill="color-mix(in srgb, var(--color-success-grow) 50%, white)"
          />
          {/* mittlere Kette */}
          <path
            d="M0 196 Q90 150 200 184 Q300 214 400 178 L400 288 L0 288 Z"
            fill="color-mix(in srgb, var(--color-mastery-proficient) 55%, white)"
          />
          {/* vordere Kette (kräftigstes Grün, Vordergrund) */}
          <path
            d="M0 238 Q110 200 220 230 Q310 254 400 232 L400 288 L0 288 Z"
            fill="color-mix(in srgb, var(--color-mastery-mastered) 75%, white)"
          />
        </svg>
      </div>
    </div>
  )
}
