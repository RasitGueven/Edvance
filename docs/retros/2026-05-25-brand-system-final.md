# Retro 2026-05-25 — Brand-System Final (Logo + Farbsystem)

Branch: `feature/levelup-tuerkis` → gemergt in `dev` via PR #18 (2026-05-17).

## Überblick

PR #18 fasst zwei thematisch verwandte Feature-Stränge zusammen, die in einer
Session gebaut und per Merge nach `dev` integriert wurden:

1. **Brand-Identität** — Echte Logo-Komponenten aus dem Design-Handoff (Commits
   `9051995`, `3cf2c29`)
2. **Emotionales Farbsystem** — Level-Up-Türkis + Streak-Repair-Lila als eigene
   Premium-Tokens (Commits `bb7af96`, `4c921ec`, `401ad6c`)

Insgesamt wurden **6 Commits** in `dev` integriert. Die Merge-Basis war Commit
`8a30cd4` (Real-Data-Programm).

---

## Was gebaut wurde

### 1. Brand-Komponenten (`src/components/brand/EdvanceLogo.tsx`, 249 Zeilen)

Neue Datei, drei exportierte Komponenten:

| Komponente | Zweck | Typische Verwendung |
|---|---|---|
| `EdvanceSymbol` | J-Kurve allein (Hairline oder kalligraphisch gefüllt) | Dekorativ, SEO-Icons |
| `EdvanceLogo` | Symbol + Wordmark „edvance" nebeneinander | Navbar, Landing |
| `EdvanceAppIcon` | Gerundetes Quadrat mit Symbol innen | Login-Screen, Avatar-Badge |

SVG-Paths sind im `PATHS`-Objekt zentralisiert (Zeile 8–16):
- `spine` — Hairline J-Kurve für Standard-Einsatz
- `arrow` — Pfeilspitze in Gold am Endpunkt
- `calligraphic` — kalligraphisch gefüllte Variante für App-Icon/Siegel

Standard-Farben im `COLORS`-Objekt (Zeile 18–23): `midnight #334D7A`,
`white #F7F7F5`, `black #1A1A18`, `gold #E8A020`.

**Vor dem Commit:** Navbar zeigte einen simplen Bold-Text „edvance" + generischen
App-Icon-Platzhalter. Login zeigte ein hartes „E" in einem Box-Div.

**Nach dem Commit:** `EdvanceNavbar` nutzt `<EdvanceLogo size={20} />` (Zeile 24),
`Login.tsx` nutzt `<EdvanceAppIcon size={64} className="relative shadow-premium-md" />`.

#### SVG-Assets in `public/brand/`

Fünf statische SVG-Dateien für externe Nutzung (E-Mail-Footer, Druckmaterialien,
Favicon-Varianten):

- `edvance-app-icon.svg` — Kalligraphisch auf Navy-Hintergrund
- `edvance-favicon.svg` — Optimiert für 16/32px
- `edvance-logo-dark.svg` — Wordmark für dunklen Hintergrund
- `edvance-logo-light.svg` — Wordmark für hellen Hintergrund (Midnight + Gold-Pfeil)
- `edvance-symbol.svg` — Kalligraphisch gefülltes Symbol allein

`public/favicon.svg` wurde auf das echte Edvance-Favicon aktualisiert.

#### Space Grotesk Font (`index.html`)

Google Fonts werden über `<link rel="preconnect">` + `display=swap` geladen
(Gewichte 400, 500, 700). Die Fontfamilie wird ausschließlich im `EdvanceLogo`-
Wordmark referenziert (`fontFamily: "'Space Grotesk', sans-serif"`).

---

### 2. Level-Up Token-Erweiterung (`src/styles/tokens.css`, 89 Zeilen)

Neue Tokens in `tokens.css` (unter `@layer base`, `:root`):

**Level-Up (Türkis — Meilenstein-Identität):**
- `--color-levelup: #0E9E96` — ruhige UI/Badge-Variante
- `--color-moment-levelup: #19C9BC` — leuchtend auf Navy-Bühne
- `--color-levelup-on: #04302D` — dunkler Text-On-Color (WCAG-AA)
- `--gradient-levelup: linear-gradient(135deg, #1FD3C6 0%, #0B8B85 100%)`
- `--shadow-glow-levelup: 0 0 44px rgba(25, 201, 188, 0.36)`

**Streak-Repair (Lila — Power-up):**
- `--color-moment-repair: #8B5CF6`
- `--color-moment-repair-on: #FFFFFF`
- `--gradient-repair: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`

**XP/Accent (Gold-Vereinheitlichung):**
- `--color-accent-light: #FBEAD0` — Badge-Hintergrund für Accent/XP

---

### 3. globals.css-Anpassungen (`src/styles/globals.css`, 356 Zeilen)

**Legacy-Aliase auf Single Source umgebogen (kein Hex mehr in globals.css):**
```css
--xp-gold:       var(--color-accent);
--xp-gold-light: var(--color-accent-light);
--level-purple:  var(--color-moment-repair);
```

**Neue Einträge im `@theme inline`-Block:**
`--color-levelup`, `--color-moment-levelup`, `--color-levelup-on`,
`--color-moment-repair`, `--color-moment-repair-on`, `--color-accent-light`.

**Neue Utility-Klassen (in `@layer utilities`):**
- `.bg-gradient-levelup` — Türkis-Gradient, für Level-Up-Badges/-Banners
- `.bg-gradient-repair` — Lila-Gradient, für Repair-Power-up-Elemente
- `.shadow-glow-levelup` — Türkis-Glow, für Celebration-Screens
- `.toast-levelup` — `background: var(--gradient-levelup)`, Text auf `--color-levelup-on`

---

### 4. Consumer-Anpassungen

**`src/components/edvance/index.tsx` (559 Zeilen — WARNUNG: über 400-Zeilen-Limit)**

`EdvanceBadge` hat zwei neue Varianten (`variant`-Union erweitert):
- `'levelup'` — Türkis (`--color-levelup` auf `--color-levelup-on`)
- `'repair'` — Lila (`--color-moment-repair` auf `--color-moment-repair-on`)

`ToastBanner` hat neuen Typ `'levelup'` in der `type`-Union (Zeile 497) und im
`TOAST_CLASS`/`TOAST_ICON`-Mapping (Zeilen 503–517). Klasse `toast-levelup`
kommt aus `globals.css`.

**`src/pages/demo/ScenarioCelebration.tsx`**

Level-Up-Badge im Celebration-Screen nutzt jetzt `--gradient-levelup` +
`--shadow-glow-levelup` statt dem alten flachen Gold-Fill. Erklärtext im
Showcase-Screen aktualisiert.

**`src/pages/DesignShowcase.tsx`**

Neue Swatch-Gruppe „Emotionale Momente" mit 6 Tokens:
Level-Up, Level-Up Moment, Repair (Lila), Erfolg/Boss, Streak-Verlust, Moment-Bühne.
Gamification-Gruppe zeigt vereinheitlichtes Gold mit korrektem Label `XP Gold (=Accent)`.

---

## Technische Entscheidungen

### Warum Inline-Styles in `EdvanceLogo.tsx`?

`EdvanceLogo` nutzt berechnete dynamische Werte: `size` (Prop, Zahl), `gap`
(`Math.round(size * 0.55)`), `borderRadius` (`Math.round(size * 0.22)`),
`background` (String-Prop). Tailwind-Klassen können diese nicht abdecken.
Die Inline-Styles sind daher nach CLAUDE.md §11 explizit erlaubt
(„Keine Inline-Styles außer für wirklich dynamische Werte").

Allerdings: `flexShrink: 0` in Zeile 115 und `display: 'inline-flex'` /
`alignItems: 'center'` in Zeile 154 sind **statische Werte**, die mit
Tailwind-Klassen (`shrink-0`, `inline-flex`, `items-center`) abgedeckt werden
könnten. Und `fontFamily` / `userSelect` / `letterSpacing` / `lineHeight` auf
dem Wordmark-`<span>` (Zeilen 137–145) sind ebenfalls statisch. Diese sollten
mittelfristig in Tailwind-Klassen überführt werden.

### Single Source für Gold

`--xp-gold` war vorher als eigenständiger Hex-Wert in `globals.css` definiert.
Nach P1 leitet er auf `var(--color-accent)` in `tokens.css` weiter. Wer
`--xp-gold` referenziert, bekommt automatisch das aktualisierte Gold. Der Wert
verschob sich minimal von `#F59E0B` auf `#E8A020` (gewollt, für Konsistenz).

### Moment-Mapping (Single Source: `tokens.css`)

| Moment | Token | Farbe |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` (= `--xp-gold`) | Gold `#E8A020` |
| Level-Up (Meilenstein) | `--color-levelup` / `--color-moment-levelup` + `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün/Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

---

## Token-Übersicht (vollständig, Stand 2026-05-25)

Alle CSS-Variablen sind in `src/styles/tokens.css` definiert und in
`src/styles/globals.css` per `@theme inline` als Tailwind-Utilities verfügbar.

### Primär
`--color-primary` `--color-primary-hover` `--color-primary-light`

### Hintergrund / Oberfläche
`--color-bg-app` `--color-bg-surface` `--color-bg-subtle` `--color-border`

### Text
`--color-text-primary` `--color-text-secondary` `--color-text-tertiary` `--color-text-link`

### Akzent (Gold)
`--color-accent` `--color-accent-light` `--color-accent-celebration`
`--color-accent-on` `--color-accent-celebration-on`

### Status
`--color-success` `--color-success-light` `--color-warning` `--color-warning-light`
`--color-error` `--color-error-light` `--color-info` `--color-info-light`

### Emotionale Momente
`--color-moment-gold` `--color-moment-green` `--color-moment-red` `--color-moment-bg`
`--color-levelup` `--color-moment-levelup` `--color-levelup-on`
`--color-moment-repair` `--color-moment-repair-on`

### Premium / Hero
`--color-hero-navy` `--color-hero-navy-2`

### Gradients
`--gradient-brand` `--gradient-hero` `--gradient-primary-btn` `--gradient-gold`
`--gradient-levelup` `--gradient-repair` `--gradient-success` `--gradient-surface`
`--gradient-celebration`

### Shadows
`--shadow-premium-sm` `--shadow-premium-md` `--shadow-premium-lg` `--shadow-premium-xl`
`--shadow-glow-primary` `--shadow-glow-gold` `--shadow-glow-levelup`
`--shadow-inset-card`

### Legacy-Aliase (in `globals.css`, zeigen auf tokens.css)
`--xp-gold` → `--color-accent` | `--xp-gold-light` → `--color-accent-light`
`--level-purple` → `--color-moment-repair`

---

## Komponenten-API

### `EdvanceSymbol`
```tsx
<EdvanceSymbol
  size={32}           // px, default 32
  color="#334D7A"     // Stroke-Farbe
  accentColor="#E8A020" // Pfeilspitzen-Farbe
  filled={false}      // true = kalligraphisch gefüllt
/>
```

### `EdvanceLogo`
```tsx
<EdvanceLogo
  size={20}           // Font-Größe in px, Symbol skaliert proportional
  color="#334D7A"     // Symbol + Wordmark
  accentColor="#E8A020"
  symbolRight={false} // Symbol rechts vom Wordmark
/>
```

### `EdvanceAppIcon`
```tsx
<EdvanceAppIcon
  size={48}
  background="#334D7A"
  symbolColor="#F7F7F5"
  accentColor="#E8A020"
  borderRadius={11}   // default: size * 0.22
  filled={false}
/>
```

### `EdvanceBadge` (neue Varianten)
```tsx
<EdvanceBadge variant="levelup">Level 5 erreicht</EdvanceBadge>
<EdvanceBadge variant="repair">Streak gerettet</EdvanceBadge>
```

### `ToastBanner` (neuer Typ)
```tsx
<ToastBanner type="levelup" message="Level 5 erreicht!" />
```

---

## Auswirkungen auf andere Komponenten

- `XPBar` — nutzt `--xp-gold` und `--xp-gold-light`, die durch P1 auf
  `--color-accent` und `--color-accent-light` zeigen. Kein Code-Change nötig,
  Verhalten identisch.
- `MasteryBar` — referenziert `--xp-gold` via `getMasteryColor()`. Ebenfalls
  automatisch aktualisiert.
- Alle bestehenden `EdvanceBadge`-Instanzen — unverändert. Nur neue Varianten
  hinzugefügt.
- `ScenarioCelebration` — Level-Up-Badge optisch verändert (Türkis statt Gold).
  Das ist eine **gewollte Verhaltensänderung** (Design-Entscheidung, kein Bug).

---

## TypeScript-Check (npx tsc --noEmit)

Ausgeführt am 2026-05-25. Ergebnis: **keine Fehler, kein Output, Exit-Code 0**.

---

## Offene Punkte / Risiken

### Warnung: `src/components/edvance/index.tsx` — 559 Zeilen (Limit: 400)
Die Datei überschreitet das 400-Zeilen-Limit um fast 40%. Sie enthält acht
Komponenten: `EdvanceCard`, `EdvanceBadge`, `MasteryBar`, `XPBar`, `StatCard`,
`AvatarInitials`, `ProgressStep`, `EmptyState`, `LoadingPulse`, `ToastBanner`.
Empfehlung: Gamification-Komponenten (`XPBar`, `MasteryBar`) und Feedback-
Komponenten (`ToastBanner`, `EmptyState`, `LoadingPulse`) in eigene Dateien
auslagern (z.B. `src/components/edvance/gamification.tsx`,
`src/components/edvance/feedback.tsx`). Barrel-Export in `index.tsx` bleibt.

### Warnung: Inline-Styles für statische Werte in `EdvanceLogo.tsx`
`flexShrink: 0` (Zeile 115), `display: 'inline-flex'`, `alignItems: 'center'`
(Zeilen 154–155) und der gesamte `wordmark`-`<span>`-Style-Block (Zeilen 137–145)
sind statisch und verstoßen gegen CLAUDE.md §11. Sollte beim nächsten Touch der
Datei mit Tailwind-Klassen ersetzt werden. Der Logo-Font `Space Grotesk` hat
keine Standard-Tailwind-Utility — eine `font-space-grotesk`-Klasse kann in
`globals.css` ergänzt werden.

### WCAG-Verifikation noch ausstehend
Türkis- und Repair-Hexwerte sind kalibrierte Vorschläge. Finale visuelle +
WCAG-AA-Prüfung steht aus — am besten via `/showcase` und `/demo/design`.
Nachjustierung ist einfach: nur an einem Ort in `tokens.css`.

### Streak-Repair- und Boss-Gradient-Flows
Tokens und Badge/Toast-Varianten sind fertig. Die eigentlichen UI-Flows
(Repair-Modal, Boss-Challenge-Screen) sind noch nicht implementiert — separater
Schritt.

### Space Grotesk: kein Offline-Fallback
Der Font wird von Google Fonts geladen. Bei schlechter Verbindung oder
Offline-Betrieb (z.B. im Präsenz-Unterricht) fällt das Wordmark auf `sans-serif`
zurück. Das Symbol funktioniert weiterhin, die Wordmark verliert aber ihren
Charakter. Mittelfristig: Font als Variable-Font selbst hosten.

### Gold-Verschiebung (`--xp-gold` = `#F59E0B` → `#E8A020`)
Gewollte Änderung für Konsistenz. Visuell minimer Unterschied (wärmer, satter).
Keine bekannten Probleme.
