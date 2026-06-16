# Retro 2026-06-16 — Brand-System vollständig + Code-Review

Branch: `feature/brand-system` → Merge via PR #18 in `dev`.
Direkte Commits auf `dev`: Schnellzugriff-Kacheln, Admin-Diagnostics, Lib-Seeding.

**TypeScript:** ✅ `npx tsc --noEmit` — Exit 0, keine Fehler.

---

## Was wurde gebaut

### Strang A — Brand-System (PR #18, 5 Commits)

**A1: Echtes Logo aus Design-Handoff** (`9051995`)
Neue Komponente `src/components/brand/EdvanceLogo.tsx` mit drei Exports:
- `EdvanceSymbol` — reine J-Kurve als SVG
- `EdvanceLogo` — Symbol + „edvance"-Wordmark (Space Grotesk)
- `EdvanceAppIcon` — Symbol auf gerundetem Quadrat-Hintergrund

SVG-Assets unter `public/brand/` (symbol, logo-light/dark, app-icon, favicon).
`public/favicon.svg` ersetzt Platzhalter.

**A2: Wordmark in der Navbar** (`3cf2c29`)
`EdvanceNavbar` nutzt `<EdvanceLogo size={20}>`.
Space Grotesk per Google-Fonts-Preconnect in `index.html` geladen.

**B1: Level-Up-Tokens, Gold vereinheitlicht — P1** (`bb7af96`)
Neue Tokens in `src/styles/tokens.css`:

| Token | Wert | Verwendung |
|---|---|---|
| `--color-levelup` | `#0E9E96` | UI/Badge (ruhig) |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | WCAG-Text auf Türkis |
| `--color-moment-repair` | `#8B5CF6` | Lila Power-up |
| `--color-moment-repair-on` | `#FFFFFF` | Text auf Lila |
| `--color-accent-light` | `#FBEAD0` | Badge-BG für XP |
| `--gradient-levelup` | `135deg, #1FD3C6→#0B8B85` | Level-Up Badge/Toast |
| `--gradient-repair` | `135deg, #A78BFA→#7C3AED` | Streak-Repair Gradient |
| `--shadow-glow-levelup` | `0 0 44px rgba(25,201,188,.36)` | Glow auf Level-Up |

Legacy-Aliase in `globals.css` auf Single Source umgebogen:
- `--xp-gold` → `var(--color-accent)`
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

**B2: Consumer — P2** (`4c921ec`)
- `ScenarioCelebration`: Level-Badge auf `--gradient-levelup` + `--shadow-glow-levelup`
- `EdvanceBadge`: neue Varianten `levelup` (Türkis) und `repair` (Lila)
- `ToastBanner`: neuer Typ `levelup` mit `.toast-levelup`-Klasse
- `XPBar`: nutzt automatisch das vereinheitlichte Gold

**B3: Sichtbarkeit + Doku — P3** (`401ad6c`)
`DesignShowcase.tsx`: neue Gruppe „Emotionale Momente" mit Swatches für Level-Up, Moment-Levelup, Streak-Repair, Boss-Grün, Streak-Rot.

### Strang B — Schnellzugriff + Admin (direkte Dev-Commits)

**Schnellzugriff-Kacheln** (`0c30186`)
`DashboardTiles.tsx`: responsives Grid, `EdvanceCard`-Basis, Touch-Targets min 44px,
in Schüler-, Coach- und Eltern-Dashboard eingebunden.

**Admin-Diagnostics-UI** (`17e8156`)
Neue Route `/admin/diagnostics` — manuelles Seeden von `is_diagnostic=true`-Aufgaben.
`ProtectedRoute` korrekt auf `allowedRoles={['admin']}` gesetzt.

**Lib-Seeding-Funktionen** (`2326772`)
`updateTaskDiagnostic` + `createDiagnosticTask` in `src/lib/supabase/tasks.ts`.
Beide mit `try/catch` und aussagekräftigen Fehlermeldungen.

### Moment-Mapping (Single Source: tokens.css)

| Moment | Token | Farbe |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` (=`--xp-gold`) | Gold `#E8A020` |
| Level-Up (Meilenstein) | `--color-levelup` / `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün/Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

---

## Code-Review Befunde (2026-06-16)

### BLOCKER — müssen vor nächstem Feature behoben werden

**B-1: Hardcodierte Hex-Farben in `EdvanceLogo.tsx:18–23`**
`COLORS`-Konstante mit vier Literalen (`#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020`).
Alle haben Entsprechungen in `tokens.css`. SVG-Attribute können keine CSS-Variablen direkt
aufnehmen — Lösung: `getComputedStyle`-Lookup oder CSS Custom Properties auf `<svg>`-Ebene.

**B-2: Inline-Styles für statische Layout-Properties in `EdvanceLogo.tsx`**
- `style={{ flexShrink: 0 }}` → Tailwind-Klasse `shrink-0`
- Wordmark-`<span>`: `fontFamily`, `fontWeight` statisch → Tailwind-Klassen
- Äußere `<div>`: `display`, `alignItems` statisch → Tailwind-Klassen
- `EdvanceAppIcon`: `display`, `alignItems`, `justifyContent`, `flexShrink` statisch → Tailwind

Nur `fontSize`, `gap` (size-abhängig), `color` (prop), `flexDirection` (symbolRight-abhängig),
`width`, `height` (size-abhängig) und `borderRadius`, `background` (size-abhängig oder berechnet)
sind als dynamisch vertretbar.

**B-3: `boxShadow` via Inline-Style in `CoachDashboard.tsx:25–26`**
`SHADOW_CARD` und `SHADOW_ACTIVE` als Konstanten, die per `style={{ boxShadow }}` eingesetzt werden.
CLAUDE.md §11 nennt das explizit als verbotenes Pattern.
Fix: `SHADOW_CARD` → `shadow-card`; `SHADOW_ACTIVE` → neues CSS-Variable-Token + Utility-Klasse.

### WARNUNGEN

| ID | Datei | Beschreibung |
|---|---|---|
| W-1 | `StudentDashboard.tsx:305` | `#9A6B00` Hex-Literal — Token `--color-accent-dark` fehlt |
| W-3 | `tasks.ts:57` + `DiagnosticsPage` | Admin-View filtert `is_active=false`-Tasks heraus (funktionaler Fehler) |
| W-4 | `StudentDashboard.tsx:225` | `bg-white` Literal → `bg-[var(--color-bg-surface)]` |
| W-5 | `DiagnosticsPage.tsx` | 427 Zeilen — Limit 400; `NewTaskForm` und `TaskRow` auslagern |
| W-6 | `DesignShowcase.tsx:254` | Neue `levelup`/`repair` Badge-Varianten + `levelup`-Toast fehlen im Showcase |
| W-7 | `ScenarioCelebration.tsx:39–43` | `boxShadow`/`background`/`color` via Inline, Utility-Klassen existieren bereits |
| W-9 | `DashboardTiles.tsx:21` | `color-mix()` via Inline-Style → Token `--color-primary-tint` anlegen |
| W-10 | `StudentDashboard.tsx:285,363` | Freitext statt `<LoadingPulse>` bei Ladezuständen |

### INFO

| ID | Beschreibung |
|---|---|
| I-2 | `EdvanceLogo`: `style`-Prop nach außen exponiert — in JSDoc dokumentieren, nur dynamische Werte |
| I-3 | `getTasksByClusterAdmin` ohne `is_active`-Filter anlegen (siehe W-3) |
| I-4 | Google Fonts in `index.html` — DSGVO-Einschätzung für DE-Betrieb dokumentieren |

### Positiv-Befunde

- Alle Supabase-Aufrufe korrekt in `src/lib/` — keine direkten DB-Calls in Komponenten/Pages (§10 ✅)
- BehaviorSnapshots: kein `update`/`delete` auf dieser Tabelle (§6 ✅)
- Kein Kind-seitiges Richtig/Falsch-Feedback (§6 ✅)
- `ProtectedRoute` für `/admin/diagnostics` korrekt auf `allowedRoles={['admin']}` (§7 ✅)
- Touch-Targets in `DashboardTiles`: `min-h-[44px]` durchgehend (§11 ✅)
- Neue `tasks.ts`-Funktionen alle mit `try/catch` + aussagekräftigen Fehlermeldungen (§10 ✅)
- `.env` in `.gitignore` vorhanden (§7 ✅)
- `EdvanceBadge` `levelup`/`repair`-Varianten referenzieren nur CSS-Variablen (§11 ✅)
- `toast-levelup`-Klasse in `globals.css` ohne Hex-Literal (§11 ✅)
- `DashboardTiles` nutzt `EdvanceCard` korrekt, kein rohes `<div>` (§11 ✅)
- `DiagnosticsPage` hat `EmptyState` und `LoadingPulse` für Cluster-Wahl korrekt (§11 ✅)
- `AvatarInitials` Palette enthält Hardcode-Hex (Altlast, nicht durch diesen PR eingeführt)

---

## Offene Punkte / Next Steps

- [ ] **B-1/B-2:** `EdvanceLogo.tsx` — Inline-Styles für statische Properties auf Tailwind umstellen
- [ ] **B-3:** `CoachDashboard.tsx` — `boxShadow`-Konstanten → Shadow-Utilities
- [ ] **W-3:** `getTasksByClusterAdmin` ohne `is_active`-Filter für DiagnosticsPage
- [ ] **W-5:** `DiagnosticsPage.tsx` aufteilen → `NewTaskForm.tsx` + `TaskRow.tsx`
- [ ] **W-6:** `DesignShowcase.tsx` — `levelup`/`repair` Badge + `levelup`-Toast-Buttons ergänzen
- [ ] **W-7:** `ScenarioCelebration.tsx` — vorhandene Utility-Klassen nutzen, Inline-Styles entfernen
- [ ] **W-10:** `StudentDashboard.tsx:285,363` — `<LoadingPulse>` statt Freitext
- [ ] **Diagnostik-Content-Seeding:** `tasks.is_diagnostic=true` befüllen → `/screening` aktiv
- [ ] **Browser-Verifikation** durch Rasit: U4-Flow + `/screening`-End-to-End
- [ ] **Space-Grotesk als Tailwind-Font-Utility** — `font-space-grotesk` in `globals.css`
- [ ] **WCAG-AA-Check** für `--color-levelup-on` auf `--color-levelup` im Browser
- [ ] **DSGVO-Einschätzung** für Google Fonts Request aus Deutschland
- [ ] **ROADMAP.md:** Brand-System, DashboardTiles, Admin-Diagnostics als „Fertig" eintragen

---

## Commit-Referenzen

| Hash | Beschreibung |
|---|---|
| `9051995` | feat(brand): Echtes Edvance-Logo aus Design-Handoff |
| `3cf2c29` | feat(brand): Wordmark-Logo in Navbar |
| `bb7af96` | feat(design): P1 Level-Up-Türkis + Repair-Tokens |
| `4c921ec` | feat(design): P2 Level-Up-Türkis in Consumern |
| `401ad6c` | feat(design): P3 Showcase-Swatches + Retro |
| `9b4388f` | merge: PR #18 Brand-System + Farbsystem-Feinschliff |
| `2326772` | feat: Lib — updateTaskDiagnostic + createDiagnosticTask |
| `17e8156` | feat: /admin/diagnostics — Admin-Seeding-UI |
| `0c30186` | feat: Schnellzugriff-Kacheln für alle Dashboards |
