# Edvance Design System v2

Iteration des Edvance Design-Systems. Eingefuehrt zunaechst nur auf den
`/demo/*`-Routen ueber den CSS-Scope `[data-design="v2"]` — produktive
Routen nutzen weiterhin die bestehenden Tokens.

## Aktivierung

Ein beliebiger Vorfahre setzt `data-design="v2"`:

```tsx
<div data-design="v2">…</div>
```

Solange dieses Attribut vorhanden ist:
- ueberschreiben die Tokens aus `src/styles/tokens-demo.css` die globalen
- werden die v2-eigenen Tailwind-Utilities (`bg-success-eltern`,
  `bg-error-gap-light`, `bg-repair`, `shadow-xs`, `duration-fast`, …)
  zu sinnvollen Werten aufgeloest
- greifen die `.animate-fly-in` / `.animate-xp-float` / `.animate-count-up`
  / `.animate-bar-grow`-Klassen
- stehen die Schueler-Spezialklassen `.v2-student-header`,
  `.v2-student-hero`, `.v2-xp-bar-fill`, `.v2-glass-pill`,
  `.v2-glass-card`, `.v2-glass-button`, `.v2-light-source` zur Verfuegung.

Ausserhalb des Scopes ist alles wirkungslos.

## Uebernommene Designregeln

| Schritt | Datei(en)                                       | Inhalt                                                                 |
|---------|--------------------------------------------------|------------------------------------------------------------------------|
| 1       | `src/styles/tokens-demo.css`                     | Vollstaendige v2-Token-Palette (Farben, Shadows, Radii, Timings)        |
| 2       | `src/styles/globals.css` (@theme inline)         | Utility-Aliase fuer Gold/Gruen/Rot/Repair/Neutral/Moment + Shadow/Timing |
| 3       | `src/pages/demo/v2/V2Kit.tsx`                    | Button · Badge · Card · Input · Progress · Navigation                  |
| 4       | `tokens-demo.css` (`[data-design="v2"]` Defaults) | Globale Hintergrund-/Textfarbe innerhalb des Scopes                    |
| 5       | `tokens-demo.css` + `V2Student.tsx`              | Schueler-App: Verlauf-Header/Hero, XP-Gradient, Glas-Pills/Cards/Button, `.v2-light-source`, 4 Animationen |
| 6       | `src/pages/demo/v2/V2Parent.tsx`                 | Eltern-App: flacher Header, dezente Cards, Vorher/Nachher, Coach-Zitat |
| 7       | JSDoc-Kommentare in V2Kit/V2Student/V2Parent     | 8 nicht verhandelbare Regeln                                           |

## Farbpalette (v2)

| Token                              | Hex       |
|------------------------------------|-----------|
| `--color-primary`                  | `#334D7A` |
| `--color-primary-hover`            | `#253D6A` |
| `--color-primary-light`            | `#EEF2F8` |
| `--color-bg-app`                   | `#F7F7F5` |
| `--color-bg-surface`               | `#FFFFFF` |
| `--color-bg-subtle`                | `#EFEFED` |
| `--color-border`                   | `#E8E8E5` |
| `--color-text-primary`             | `#1A1A18` |
| `--color-text-secondary`           | `#4A4A47` |
| `--color-text-tertiary`            | `#888884` |
| `--color-text-link`                | `#334D7A` |
| `--color-accent` / `accent-streak` | `#E8A020` |
| `--color-gold-altgold`             | `#D4A843` |
| `--color-gold-champagner`          | `#E8D5A3` |
| `--color-gold-warning`             | `#C87E00` |
| `--color-gold-warning-light`       | `#FEF3E2` |
| `--color-success`                  | `#2A8A4A` |
| `--color-success-light`            | `#EAF5EE` |
| `--color-success-eltern`           | `#3AAF6A` |
| `--color-success-eltern-light`     | `#EAF7EF` |
| `--color-success-answer`           | `#27AE60` |
| `--color-success-answer-light`     | `#EDFAF3` |
| `--color-success-grow`             | `#5DD68C` |
| `--color-success-celebration`      | `#1DB954` |
| `--color-success-skilltree`        | `#22C55E` |
| `--color-success-skilltree-light`  | `#F0FAF4` |
| `--color-error-gap`                | `#C03030` |
| `--color-error-gap-light`          | `#FADEDC` |
| `--color-error-answer`             | `#E88080` |
| `--color-error-answer-light`       | `#FDF0F0` |
| `--color-error-exam`               | `#C83232` |
| `--color-error-exam-light`         | `#FDEEED` |
| `--color-error-streak`             | `#E03535` |
| `--color-error-coach`              | `#B91C1C` |
| `--color-error-coach-light`        | `#FEF2F2` |
| `--color-repair`                   | `#7B5EA7` |
| `--color-repair-light`             | `#F0EAFA` |
| `--color-repair-surface`           | `#F5F0FC` |
| `--color-neutral-inactive`         | `#C4C4C0` |
| `--color-neutral-disabled`         | `#B8B8B4` |
| `--color-neutral-unknown`          | `#D4D4D0` |
| `--color-moment-levelup-bg`        | `#334D7A` |
| `--color-moment-levelup-crown`     | `#E8D5A3` |
| `--color-moment-levelup-xp`        | `#D4A843` |
| `--color-moment-boss-green`        | `#1DB954` |
| `--color-moment-boss-bg-start`     | `#1A2E4A` |
| `--color-moment-boss-bg-end`       | `#0A6B2E` |
| `--color-moment-streak-red`        | `#E03535` |
| `--color-moment-repair-purple`     | `#7B5EA7` |

Shadows (blau getoent):
`--shadow-xs · --shadow-md · --shadow-lg · --shadow-xl`

Rundungen: `--radius-sm 6 · md 10 · lg 14 · xl 20` (px).

Timing: `instant 100 · fast 150 · base 200 · slow 350 · celebration 500` (ms).
Easings: `--ease-bounce`, `--ease-out`.

## Kritische Regeln (nicht verhandelbar)

1. `--color-accent` (`#E8A020`) NIE als Textfarbe auf weissem Hintergrund — WCAG fail.
2. Celebration-Farben (`--color-moment-*`) nur in Animations-Modals — max. 3 Sekunden sichtbar.
3. Glaseffekte ausschliesslich auf dunklem Hintergrund (Header oder Hero-Verlauf) — nie auf `#F7F7F5` oder `#FFFFFF`.
4. Level-Up und Boss-Challenge max. 1x pro Session triggern.
5. Streak-Verlust (`#E03535`) erscheint kurz — direkt danach Repair-Angebot in Lila (`#7B5EA7`).
6. Mastered-Status (`#2A8A4A`) kann nur in einer Praesenz-Session vergeben werden — kein visuelles Mastered-Label ohne Coach-Bestaetigung im Backend.
7. Alle Schatten verwenden die blauen Variablen (`--shadow-*`) — kein `shadow-gray-*` oder neutrales Grau.
8. Rundungen immer aus dem Token-System (`--radius-*`) — kein hardcodiertes `rounded-full` ausser fuer Kreise.

## Offene Punkte

- Dark Mode: noch nicht definiert, Custom Properties sind vorbereitet.
- Neutraler Fortschrittsbalken-Ton: wird nach erstem Interface-Review festgelegt.
- Seltene Meilenstein-Farben (Violett, Indigo): fuer spaetere Gamification-Features reserviert.
- Rollout in produktive Routen: Nachdem die Demo-Szene `/demo/design` → Tab "v2" abgenommen ist, ziehen wir die produktiven Komponenten schrittweise nach (Button, Badge, Card, Input, Progress, Navigation).
