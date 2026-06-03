import type { CSSProperties, JSX } from 'react'

/**
 * Dekorativer Hintergrund für den Lernpfad — „Luminous Constellation Ascent".
 * Heller, energetischer Dämmerungs-Himmel (nicht düster): unten warmer
 * Sonnenaufgang → oben ein radiantes Ziel-Glühen. Sterne funkeln, Wolken
 * treiben nach oben, eine Hügel-Silhouette gibt Tiefe.
 *
 * Rein dekorativ (kein Text → kein i18n). Alle Farben aus CSS-Variablen
 * (§11: keine hardcodierten Farben). Bewegung respektiert prefers-reduced-motion.
 */

// Deterministische Stern-Positionen (kein Random → stabil über Re-Renders).
// y bleibt im oberen, „luftigen" Bereich; unten dominiert der warme Horizont.
const STARS: { x: number; y: number; size: number; delay: number; dur: number }[] = [
  { x: 12, y: 8, size: 4, delay: 0, dur: 4 },
  { x: 78, y: 6, size: 5, delay: 1.2, dur: 5 },
  { x: 45, y: 14, size: 3, delay: 2.1, dur: 4.5 },
  { x: 88, y: 22, size: 4, delay: 0.6, dur: 5.5 },
  { x: 22, y: 26, size: 3, delay: 1.8, dur: 4 },
  { x: 63, y: 30, size: 5, delay: 0.3, dur: 6 },
  { x: 8, y: 38, size: 3, delay: 2.6, dur: 4.5 },
  { x: 92, y: 42, size: 4, delay: 1.0, dur: 5 },
  { x: 35, y: 46, size: 3, delay: 2.2, dur: 4 },
  { x: 70, y: 52, size: 4, delay: 0.9, dur: 5.5 },
  { x: 18, y: 58, size: 3, delay: 1.5, dur: 4.5 },
  { x: 55, y: 4, size: 3, delay: 3.0, dur: 5 },
]

// Wolken: Start-x (%), Größe (px Breite), Animations-Dauer & -Delay (s).
const CLOUDS: { x: number; w: number; dur: number; delay: number }[] = [
  { x: 8, w: 96, dur: 22, delay: 0 },
  { x: 64, w: 120, dur: 26, delay: 5 },
  { x: 38, w: 104, dur: 30, delay: 11 },
  { x: 80, w: 88, dur: 24, delay: 16 },
]

export function LernpfadBackground(): JSX.Element {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes lp-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes lp-cloud-rise {
          0%   { transform: translateY(110%); opacity: 0; }
          12%  { opacity: 0.85; }
          88%  { opacity: 0.85; }
          100% { transform: translateY(-130%); opacity: 0; }
        }
        @keyframes lp-goal-pulse {
          0%, 100% { opacity: 0.55; transform: scale(0.96); }
          50%      { opacity: 0.95; transform: scale(1.04); }
        }
        .lp-star  { animation: lp-twinkle var(--lp-dur, 5s) var(--ease-out, ease-in-out) var(--lp-delay, 0s) infinite; }
        .lp-cloud { animation: lp-cloud-rise var(--lp-dur, 24s) linear var(--lp-delay, 0s) infinite; }
        .lp-goal  { animation: lp-goal-pulse 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp-star, .lp-cloud, .lp-goal { animation: none; }
          .lp-cloud { opacity: 0.7; transform: none; }
        }
      `}</style>

      {/* Layer 1 — Himmel-Verlauf: unten warm → oben helles Periwinkle. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top,' +
            ' color-mix(in srgb, var(--color-gold-champagner) 42%, white) 0%,' +
            ' color-mix(in srgb, var(--color-primary-light) 65%, white) 42%,' +
            ' color-mix(in srgb, var(--color-primary) 12%, white) 100%)',
        }}
      />

      {/* Layer 2 — Ziel-Glühen oben Mitte (der „Gipfel"/die Akademie). */}
      <div
        className="lp-goal absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/3 rounded-[var(--radius-full)]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 45%, transparent) 0%,' +
            ' color-mix(in srgb, var(--color-gold-champagner) 30%, transparent) 40%, transparent 70%)',
        }}
      />

      {/* Layer 3 — Sternenfeld (sanftes Twinkle, gestaffelt). */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="lp-star absolute rounded-[var(--radius-full)]"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              backgroundColor: 'var(--color-gold-altgold)',
              boxShadow:
                '0 0 6px color-mix(in srgb, var(--color-gold-champagner) 80%, transparent)',
              '--lp-delay': `${s.delay}s`,
              '--lp-dur': `${s.dur}s`,
            } as CSSProperties
          }
        />
      ))}

      {/* Layer 5 — Wolken: treiben nach oben (rundere, vollere Formen). */}
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          className="lp-cloud absolute bottom-0"
          viewBox="0 0 120 56"
          style={
            {
              left: `${c.x}%`,
              width: c.w,
              height: c.w * 0.47,
              '--lp-delay': `${c.delay}s`,
              '--lp-dur': `${c.dur}s`,
            } as CSSProperties
          }
        >
          <g fill="white" opacity="0.9">
            <circle cx="34" cy="34" r="18" />
            <circle cx="58" cy="26" r="22" />
            <circle cx="84" cy="34" r="18" />
            <rect x="30" y="34" width="58" height="18" rx="9" />
          </g>
          <g
            fill="var(--color-primary-light)"
            opacity="0.7"
          >
            <ellipse cx="60" cy="48" rx="34" ry="7" />
          </g>
        </svg>
      ))}

      {/* Layer 4 — Hügel-Silhouette am Horizont (Tiefe, Parallax hinten). */}
      <svg
        className="absolute bottom-0 left-0 h-32 w-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
      >
        {/* hintere Kette (heller) */}
        <path
          d="M0 70 Q70 36 150 60 Q240 86 320 50 Q360 34 400 56 L400 120 L0 120 Z"
          fill="var(--color-primary-light)"
          opacity="0.9"
        />
        {/* vordere Kette (kräftiger Primary, klar dunkler für Tiefe) */}
        <path
          d="M0 92 Q90 58 190 84 Q280 106 400 80 L400 120 L0 120 Z"
          fill="var(--color-primary)"
          opacity="0.16"
        />
      </svg>
    </div>
  )
}
