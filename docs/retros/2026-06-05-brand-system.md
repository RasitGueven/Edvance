# Retro 2026-06-05 — Brand-System (Logo, Wordmark, Space Grotesk)

Branch: `feature/levelup-tuerkis` → gemergt in `dev` via PR #18 (2026-05-17).
Diese Retro dokumentiert Commits **9051995** und **3cf2c29**, die im bestehenden Retro
`2026-05-17-farbsystem-feinschliff.md` nicht erfasst wurden.

---

## Was gebaut wurde

### Commit 9051995 — `feat(brand): echtes Edvance-Logo aus Design-Handoff einbinden`

Datum: 2026-05-17, 11:03 UTC

- Neue Komponenten-Datei `src/components/brand/EdvanceLogo.tsx` mit drei Exports
- SVG-Assets unter `public/brand/` angelegt (5 Dateien)
- `public/favicon.svg` durch echtes Edvance-Favicon ersetzt
- `src/pages/Login.tsx`: Platzhalter-„E" ersetzt durch `<EdvanceAppIcon size={64} />`
- `src/components/edvance/EdvanceNavbar.tsx`: Platzhalter ersetzt durch `<EdvanceAppIcon size={40} />`

### Commit 3cf2c29 — `feat(brand): Wordmark-Logo in Navbar (EdvanceLogo + Space Grotesk)`

Datum: 2026-05-17, 13:53 UTC

- `src/components/edvance/EdvanceNavbar.tsx`: `EdvanceAppIcon size=40` ersetzt durch
  `EdvanceLogo size=20` (Symbol + „edvance"-Wordmark nebeneinander)
- `index.html`: Google Fonts Preconnect + Space Grotesk (wght 400;500;700, `display=swap`)

---

## Komponenten-API

### `EdvanceSymbol`

Reine J-Kurve: Hairline-Pfad + Punkt am Startknoten + Goldpfeil am Ende.

| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `size` | `number` | `32` | Breite und Höhe in px |
| `color` | `string` | `#334D7A` (Midnight) | Farbe des Pfads + Punkt |
| `accentColor` | `string` | `#E8A020` (Gold) | Farbe des Pfeilkopfs |
| `filled` | `boolean` | `false` | Kalligrafische Füllform statt Hairline |
| `className` | `string` | — | Weitergabe an `<svg>` |
| `style` | `CSSProperties` | — | Weitergabe an `<svg>` |

### `EdvanceLogo`

Symbol + Wordmark „edvance" in Space Grotesk nebeneinander (Flex-Row).

| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `size` | `number` | `20` | Schriftgröße in px; Symbol wird auf `size × 1.8` skaliert |
| `color` | `string` | `#334D7A` (Midnight) | Farbe von Symbol + Wordmark |
| `accentColor` | `string` | `#E8A020` (Gold) | Pfeilkopf-Farbe im Symbol |
| `symbolRight` | `boolean` | `false` | Symbol rechts der Wordmark platzieren |
| `className` | `string` | — | Weitergabe an umschließendes `<div>` |
| `style` | `CSSProperties` | — | Weitergabe an umschließendes `<div>` |

Empfohlene Verwendung: `<EdvanceLogo size={20} />` in Navbar (entspricht 36px SVG-Höhe).

### `EdvanceAppIcon`

Gerundetes Quadrat (App-Icon-Form) mit eingebettetem Symbol. Geeignet für Login-Screen,
App-Store-Icons, Avatar-Platzhalter.

| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `size` | `number` | `48` | Breite und Höhe des Containers in px |
| `background` | `string` | `#334D7A` (Midnight) | Hintergrundfarbe des Containers |
| `symbolColor` | `string` | `#F7F7F5` (White) | Farbe des innenliegenden Symbols |
| `accentColor` | `string` | `#E8A020` (Gold) | Pfeilkopf-Farbe |
| `borderRadius` | `number` | `size × 0.22` | Eckenradius; automatisch berechnet wenn nicht gesetzt |
| `filled` | `boolean` | `false` | Kalligrafische Füllform statt Hairline |
| `className` | `string` | — | Weitergabe an Container-`<div>` |
| `style` | `CSSProperties` | — | Weitergabe an Container-`<div>` |

---

## Asset-Übersicht

Alle Dateien unter `public/brand/` (statische SVGs, kein Build-Schritt nötig):

| Datei | Format / ViewBox | Verwendungszweck |
|---|---|---|
| `edvance-symbol.svg` | SVG, `0 0 100 100` | Embeds, Stempel, einzelnes Symbol (Hairline-Hairline) |
| `edvance-app-icon.svg` | SVG, `0 0 1024 1024` | App-Store, PWA-Icons (calligraphic, Midnight-BG) |
| `edvance-favicon.svg` | SVG, `0 0 1024 1024` | Browser-Tab (identisch mit App-Icon-Shape) |
| `edvance-logo-light.svg` | SVG | Wortmarke auf hellem Hintergrund |
| `edvance-logo-dark.svg` | SVG | Wortmarke auf dunklem Hintergrund (Navbar, Navy-BG) |
| `public/favicon.svg` | SVG | Einstiegspunkt des Browsers (`<link rel="icon">` in index.html) |

### Interne Farbkonstanten in `EdvanceLogo.tsx`

Die Komponente hält eigene Fallback-Konstanten (nicht aus CSS-Variablen). Absichtlich so,
da SVG-Elemente CSS-Variablen nicht zuverlässig erben:

| Konstante | Hex | Entsprechende CSS-Variable |
|---|---|---|
| `midnight` | `#334D7A` | `--color-primary` |
| `white` | `#F7F7F5` | `--color-bg` / `--text-primary-on` |
| `black` | `#1A1A18` | `--color-text-base` |
| `gold` | `#E8A020` | `--color-accent` |

---

## Einschränkungen & Offene Punkte

### Bekannte Regel-Ausnahmen

- `EdvanceLogo.tsx` enthält Inline-Styles (`style={{ ... }}`). Dies ist eine bewusste Ausnahme:
  SVG-Elemente und dynamische Layout-Berechnungen (z. B. `gap = Math.round(size * 0.55)`)
  erfordern JS-seitige Werte. Statische Tailwind-Klassen sind hier nicht ausreichend.
  Die Ausnahme ist auf diese eine Datei begrenzt.
- Die Hardcodierung der Hex-Werte in `COLORS` ist ebenfalls eine Ausnahme für SVG-Fallbacks.
  Änderungen am Brand-Palette müssen sowohl in `tokens.css` als auch in `COLORS` synchron gehalten werden.
- `EdvanceNavbar.tsx` verwendet `border-[var(--border)]` — korrekt via CSS-Variable.

### Offene Punkte

- `public/favicon.svg` ist nur als SVG vorhanden. Für iOS-Homescreen und ältere Browser
  zusätzlich `favicon.ico` + `apple-touch-icon.png` generieren (ausstehend).
- Space Grotesk wird über Google Fonts (CDN) geladen. Kein Self-Hosting, kein Font-Subsetting.
  Bei Offline-Szenarien / Datenschutzanforderungen prüfen, ob Self-Hosting nötig ist.
- `edvance-logo-light.svg` und `edvance-logo-dark.svg` sind noch nicht in Komponenten
  integriert — nur als statische Assets vorhanden. Bei Bedarf in `EdvanceLogo` als
  `variant="light" | "dark"` für Raster-/Print-Ausgaben ergänzen.
- Die Komponente `EdvanceSymbol` wird aktuell in keiner Page direkt genutzt (nur intern in
  `EdvanceLogo` + `EdvanceAppIcon`). Showcase-Eintrag unter `/showcase` fehlt noch.

---

## Design-System-Entscheidung nach dem Retro (v2)

Nach dem Merge von PR #18 wurde im Notion Design System eine Breaking-Change-Entscheidung
getroffen:

**Level-Up Türkis (`#0E9E96`, `--color-levelup`) ist deprecated.**

Das Level-Up-Erlebnis wird in v2 nicht mehr mit Türkis visuell codiert, sondern mit:
- Navy-Hintergrund (`--color-primary`)
- Champagne-Krone (Illustration)
- Altgold-XP-Anzeige (`--color-accent`)

Die Tokens `--color-levelup`, `--color-moment-levelup`, `--gradient-levelup` und
`--shadow-glow-levelup` bleiben zunächst im Code, werden aber im Migrations-Branch
entfernt. Verweise auf diese Tokens in `EdvanceBadge`, `ToastBanner`, `ScenarioCelebration`
müssen aktualisiert werden.

Migration geplant unter:
- Branch: `feature/v2-migration`
- Prompt-Datei: `CLAUDE_CODE_MIGRATION_PROMPT.md`

Bis zum Abschluss der Migration keinen neuen Code gegen `--color-levelup` /
`--gradient-levelup` entwickeln.
