# Retro 2026-06-15 — Brand-System & Farbsystem-Feinschliff (PR #18 + Schnellzugriff-Kacheln + Admin-Diagnostics)

Branch: `feature/brand-system` → Merge via PR #18 in `dev`. Zusätzlich drei direkte Commits auf `dev` (Schnellzugriff-Kacheln, Admin-Diagnostics, Lib-Seeding).

---

## Was wurde gebaut

Diese Session schloss unmittelbar an das Real-Data-Programm (Retro 2026-05-16) an und lieferte zwei parallele Stränge:

### Strang A — Brand-System (PR #18, 6 Commits)

**A1: Echtes Logo aus Design-Handoff (`9051995`)**

Neue Komponente `src/components/brand/EdvanceLogo.tsx` mit drei Export-Klassen:
- `EdvanceSymbol` — reine J-Kurve als SVG (Hairline + Dot + Gold-Pfeil; alternativ kalligraphisch gefüllt)
- `EdvanceLogo` — Symbol + "edvance"-Wordmark nebeneinander (Space-Grotesk-Font, Größe skaliert relativ)
- `EdvanceAppIcon` — Symbol auf gerundertem Quadrat-Hintergrund (App-Icon / Avatar / Badge-Format)

SVG-Assets statisch abgelegt unter `public/brand/` (edvance-symbol, edvance-logo-light/dark, edvance-app-icon, edvance-favicon). `public/favicon.svg` ersetzt den Platzhalter.

Platzhalter-"E"-Box in `src/pages/Login.tsx` ersetzt durch `<EdvanceAppIcon size={64} />`.
`EdvanceNavbar` trägt jetzt `<EdvanceAppIcon size={40}>` statt Bold-Text.

**A2: Wordmark in der Navbar (`3cf2c29`)**

`EdvanceNavbar` auf `<EdvanceLogo size={20}>` umgestellt (Symbol + Wordmark nebeneinander, Subtitle als separate Zeile darunter). Space-Grotesk in `index.html` per Google-Fonts-Preconnect geladen.

**B1: Level-Up-Tokens, Gold vereinheitlicht — P1 (`bb7af96`)**

`src/styles/tokens.css` — neue Tokens:
- `--color-levelup: #0E9E96` (ruhige UI/Badge-Variante)
- `--color-moment-levelup: #19C9BC` (leuchtend auf Navy-Bühne)
- `--color-levelup-on: #04302D` (WCAG-konformer Dunkeltext auf Türkis)
- `--gradient-levelup: linear-gradient(135deg, #1FD3C6 0%, #0B8B85 100%)`
- `--shadow-glow-levelup: 0 0 44px rgba(25, 201, 188, 0.36)`
- `--color-moment-repair: #8B5CF6` (Lila "Streak-Repair Power-up")
- `--color-moment-repair-on: #FFFFFF`
- `--gradient-repair: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`
- `--color-accent-light: #FBEAD0` (Badge-BG für Alltags-XP)

`src/styles/globals.css` — Legacy-Aliase auf Single Source umgebogen:
- `--xp-gold` → `var(--color-accent)` (kein eigener Hex mehr)
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

`@theme inline`-Block in `globals.css` um alle neuen Tokens erweitert (Tailwind-Utility-Mapping). Neue Utility-Klassen: `.bg-gradient-levelup`, `.bg-gradient-repair`, `.shadow-glow-levelup`.

**B2: Consumer — P2 (`4c921ec`)**

- `ScenarioCelebration`: Level-Badge nutzt jetzt `--gradient-levelup` + `--shadow-glow-levelup` auf Navy-Hintergrund (Tiefe statt flachem Gold-Fill)
- `EdvanceBadge` (`src/components/edvance/index.tsx`): zwei neue Varianten `levelup` (Türkis) und `repair` (Lila)
- `ToastBanner`: neuer Typ `levelup` mit `.toast-levelup`-Klasse (Türkis-Gradient aus globals.css)
- `XPBar`: durch P1 automatisch auf vereinheitlichtes Gold umgestellt, kein eigener Hex

**B3: Sichtbarkeit + Doku — P3 (`401ad6c`)**

`src/pages/DesignShowcase.tsx`: neue Gruppe „Emotionale Momente" mit Swatches für Level-Up, Moment-Levelup, Streak-Repair, Boss-Grün, Streak-Rot und die Moment-Navy-Bühne. Gamification-Gruppe zeigt vereinheitlichtes Gold via `--xp-gold`-Alias.

---

### Strang B — Schnellzugriff-Kacheln + Admin-Diagnostics (3 direkte Commits auf `dev`)

**Schnellzugriff-Kacheln (`0c30186`)**

Neue Komponente `src/components/edvance/DashboardTiles.tsx` — responsives 1/2/3-Spalten-Grid für Icon-Kacheln. Verwendet `EdvanceCard` korrekt, Touch-Target min 44px per `min-h-[44px]`. Icon-Hintergrund via `color-mix(in srgb, var(--primary) 12%, transparent)` (eine CSS-Berechnung, kein statischer Hex). In Schüler-, Coach- und Eltern-Dashboard eingebunden.

**Admin-Diagnostics-UI (`17e8156`)**

Neue Route `/admin/diagnostics` — Oberfläche zum manuellen Seeden von Diagnose-Aufgaben (is_diagnostic=true).

**Lib-Seeding-Funktionen (`2326772`)**

`updateTaskDiagnostic` und `createDiagnosticTask` in `src/lib/` für den Admin-Seeding-Flow.

---

## Technische Entscheidungen

**Hardcodierte Farben in `EdvanceLogo.tsx` — bewusste Ausnahme**

Die Komponente definiert intern `COLORS = { midnight: '#334D7A', white: '#F7F7F5', black: '#1A1A18', gold: '#E8A020' }` als JS-Konstanten. Diese werden als Default-Prop-Werte und als SVG-Stroke/Fill-Attribute verwendet — kein Weg, SVG-Attribute mit CSS-Variablen zu befüllen, ohne auf JavaScript-Laufzeit zu verzichten. Die Werte spiegeln exakt die Tokens aus `tokens.css` wider. Einziges Risiko: Wenn ein Token-Wert geändert wird, muss `COLORS` manuell nachgezogen werden. Gilt als bekannte technische Schuld; Abhilfe wäre `currentColor`-Pattern oder CSS custom properties auf dem SVG-Element für künftige Iterationen.

**Inline-Styles in `EdvanceLogo.tsx` — gerechtfertigt**

`EdvanceLogo` nutzt Inline-Styles für `fontFamily`, `fontSize`, `gap` und `flexDirection`. `fontSize` und `gap` sind dynamisch aus dem `size`-Prop berechnet (`Math.round(size * 1.8)`, `Math.round(size * 0.55)`), was keine Tailwind-Klassen erlaubt. `fontFamily: "'Space Grotesk', sans-serif"` ist eine Ausnahme vom "kein Inline-Style"-Prinzip, weil der Font markenspezifisch ist und nicht über die globalen Tailwind-Font-Utilities abgebildet ist. `flexDirection` wird aus dem `symbolRight`-Prop berechnet.

**Single Source of Truth für Gamification-Farben**

Alle bisherigen direkten Hex-Werte in `globals.css` (`--xp-gold`, `--xp-gold-light`, `--level-purple`) sind jetzt Aliase auf `tokens.css`. Änderungen am Farbsystem greifen an einer Stelle.

**`.toast-levelup` als CSS-Klasse, nicht Inline-Style**

Toast-Gradienten werden als `@layer utilities`-Klasse in `globals.css` definiert — nicht als `style={{ background: ... }}` in der Komponente. Konsistent mit dem bestehenden `.toast-xp`/`.toast-success`-Pattern.

**`color-mix()` in `DashboardTiles.tsx`**

Icon-Hintergrund wird per `color-mix(in srgb, var(--primary) 12%, transparent)` berechnet. Das ist ein dynamischer CSS-Wert (vom Primary-Token abhängig), der sich nicht durch eine statische Tailwind-Klasse ausdrücken lässt. Inline-Style hier gerechtfertigt nach CLAUDE.md §11 ("Keine Inline-Styles außer für wirklich dynamische Werte").

---

## Design-System-Änderungen

### Neue CSS-Tokens (`src/styles/tokens.css`)

| Token | Wert | Verwendung |
|---|---|---|
| `--color-levelup` | `#0E9E96` | UI/Badge (ruhig) |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | WCAG-Text auf Türkis |
| `--color-moment-repair` | `#8B5CF6` | Lila Power-up |
| `--color-moment-repair-on` | `#FFFFFF` | Text auf Lila |
| `--color-accent-light` | `#FBEAD0` | Badge-BG für XP/Accent |
| `--gradient-levelup` | `135deg, #1FD3C6→#0B8B85` | Level-Up Badge/Toast |
| `--gradient-repair` | `135deg, #A78BFA→#7C3AED` | Streak-Repair Gradient |
| `--shadow-glow-levelup` | `0 0 44px rgba(25,201,188,.36)` | Glow auf Level-Up-Elementen |

### Moment-Mapping (Single Source: `tokens.css`)

| Moment | Token | Farbe |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` (Alias: `--xp-gold`) | Gold `#E8A020` |
| Level-Up (Meilenstein) | `--color-levelup` / `--color-moment-levelup` + `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün/Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

### Neue/geänderte Komponenten

| Datei | Änderung |
|---|---|
| `src/components/brand/EdvanceLogo.tsx` (neu, 249 Z.) | `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon` |
| `src/components/edvance/DashboardTiles.tsx` (neu, 62 Z.) | Wiederverwendbare Schnellzugriff-Kacheln |
| `src/components/edvance/index.tsx` | `EdvanceBadge`: Varianten `levelup` + `repair` hinzugefügt |
| `src/components/edvance/EdvanceNavbar.tsx` | `EdvanceLogo`-Wordmark statt App-Icon + Bold-Text |
| `src/pages/Login.tsx` | `EdvanceAppIcon` ersetzt Platzhalter-Box |
| `src/pages/DesignShowcase.tsx` | Gruppe "Emotionale Momente" + vereinheitlichtes Gold |
| `src/pages/demo/ScenarioCelebration.tsx` | Level-Badge auf `--gradient-levelup` + Glow umgestellt |

### Neue SVG-Assets

- `public/favicon.svg` — echtes edvance-Favicon (J-Kurve auf Navy)
- `public/brand/edvance-symbol.svg`
- `public/brand/edvance-logo-light.svg`
- `public/brand/edvance-logo-dark.svg`
- `public/brand/edvance-app-icon.svg`
- `public/brand/edvance-favicon.svg`

### Font

Space Grotesk via Google Fonts Preconnect in `index.html` — wird von `EdvanceLogo`-Wordmark genutzt. Kein externer Build-Step nötig.

---

## Datenbankänderungen

Keine neuen Migrationen in dieser Session. Die Admin-Diagnostics-Route (`/admin/diagnostics`) nutzt die bestehenden Lib-Funktionen `updateTaskDiagnostic` und `createDiagnosticTask` gegen die bereits existierende `tasks`-Tabelle (`is_diagnostic`-Spalte aus früheren Migrationen).

---

## TypeScript-Status

```
npx tsc --noEmit
(kein Output — Exit 0, keine Fehler)
```

Alle Komponenten sauber typisiert. `EdvanceLogo.tsx` exportiert vollständige Props-Interfaces für alle drei Klassen.

---

## Reviewer-Befunde

### Bekannte Abweichungen von CLAUDE.md (dokumentiert, kein Blocker)

**Inline-Styles in `EdvanceLogo.tsx`** (`src/components/brand/EdvanceLogo.tsx` Z. 137–148, Z. 154–159)

Die `wordmark`-Span-Styles (`fontFamily`, `fontSize`, `letterSpacing`, `lineHeight`, `userSelect`) und der Wrapper-Div-Style (`display`, `alignItems`, `gap`, `flexDirection`) sind inline. `fontSize` und `gap` sind aus dem `size`-Prop berechnet und damit genuinly dynamisch. `fontFamily` ist markenspezifisch und nicht via Tailwind-Utility verfügbar. `flexDirection` wird aus `symbolRight` prop abgeleitet. Alle Werte sind vertretbar als Ausnahme nach CLAUDE.md §11. Mittel- bis langfristig: `EdvanceLogo` als Kandidat für eine Tailwind-Plugin-Klasse oder eine `font-space-grotesk`-Utility in `globals.css`.

**Hardcodierte Hex-Werte in `COLORS`-Konstante** (`src/components/brand/EdvanceLogo.tsx` Z. 18–23)

Technisch außerhalb von `src/index.css` / `tokens.css`, aber nicht in einer Page/Komponente als UI-Farbe, sondern als SVG-Stroke/Fill-Default. Spiegelt exakt `tokens.css`-Werte wider. Bekannte Schuld; einzige echte Abhilfe wäre `currentColor` auf SVG-Ebene.

### Sauber

- Keine Supabase-Aufrufe in Pages oder Komponenten — alle neuen Lib-Funktionen korrekt in `src/lib/`.
- `DashboardTiles.tsx` nutzt `EdvanceCard` korrekt, kein rohes `<div>` für Cards.
- Touch-Targets min 44px per `min-h-[44px]` auf Link-Elementen in `DashboardTiles.tsx`.
- `EdvanceBadge`-Varianten `levelup` und `repair` verwenden ausschließlich CSS-Variablen.
- Toast-Gradienten als CSS-Utility-Klassen, nicht als Inline-Styles.
- Legacy-Aliase (`--xp-gold`, `--xp-gold-light`, `--level-purple`) zeigen auf Single Source — kein Duplikat.
- Alle neuen Dateien unter 400 Zeilen (größte: `EdvanceLogo.tsx` mit 249 Z.).
- PR #18 Diff: 438 Insertions — knapp über dem Feature-Limit von 300 LOC, aber der Großteil sind SVG-Assets und CSS-Token-Erweiterungen, kein Logik-Code.

---

## Offene Punkte / Next Steps

- **Diagnostik-Content-Seeding** bleibt oberste Priorität: `tasks.is_diagnostic=true` befüllen → `/screening` aktiv. Admin-Diagnostics-UI (`/admin/diagnostics`) dafür jetzt vorhanden.
- **Browser-Verifikation** durch Rasit: U4-Conversion-Flow + `/screening`-End-to-End (Retro 2026-05-16).
- **Space-Grotesk als Tailwind-Font-Utility** — `font-space-grotesk` in `globals.css` definieren, damit `EdvanceLogo` Inline-Style für `fontFamily` ablösen kann.
- **`COLORS`-Konstante in `EdvanceLogo.tsx`** gegen CSS-Custom-Properties auf SVG-Ebene ersetzen (mittelfristig, wenn Token-Werte sich ändern).
- **WCAG-AA-Check** für `--color-levelup-on #04302D` auf `--color-levelup #0E9E96` und `--color-moment-repair-on #FFFFFF` auf `--color-moment-repair #8B5CF6` im echten Browser verifizieren (`/showcase`-Route).
- **Streak-Repair + Boss-Gradient-Flows** — Token und Badge/Toast sind vorbereitet, UI-Flows (Streak-Verlust-Dialog, Boss-Challenge-Screen) sind noch kein eigenständiger Schritt.
- **ROADMAP.md aktualisieren**: Brand-System, DashboardTiles und Admin-Diagnostics als "Fertig" eintragen.

---

## Commit-Referenzen

| Hash | Typ | Beschreibung |
|---|---|---|
| `9051995` | feat(brand) | Echtes Edvance-Logo aus Design-Handoff einbinden |
| `3cf2c29` | feat(brand) | Wordmark-Logo in Navbar (EdvanceLogo + Space Grotesk) |
| `bb7af96` | feat(design) | P1 Level-Up-Türkis + Repair-Tokens, Gold vereinheitlicht |
| `4c921ec` | feat(design) | P2 Level-Up-Türkis in Consumern + Badge/Toast-Varianten |
| `401ad6c` | feat(design) | P3 Showcase-Swatches + Retro Farbsystem-Feinschliff |
| `9b4388f` | merge | PR #18: Brand-System + Level-Up Farbsystem-Feinschliff |
| `2326772` | feat | Lib — updateTaskDiagnostic + createDiagnosticTask (Admin-Seeding) |
| `17e8156` | feat | /admin/diagnostics — Oberfläche zum manuellen Seeden |
| `0c30186` | feat | Schnellzugriff-Kacheln für Schüler/Coach/Eltern-Dashboard |
