# Retro 2026-06-18 — Review: Brand-System + Real-Data-Programm

Branch: `feature/brand-system` gemergt via PR #18 nach `dev`; Real-Data-Commits
bereits über PR #16 / PR #17 in `dev` und `main`.

## Überblick

In dieser Phase wurden zwei parallele Stränge abgeschlossen und in `dev`
zusammengeführt. Erstens: Das echte Edvance-Markenzeichen (J-Kurve + Wordmark)
wurde als vollständige Komponenten-Familie in die App integriert und ersetzt
alle vorherigen Platzhalter-Logos. Zweitens: Das Farbsystem wurde um eine
dedizierte Premium-Türkis-Identität für Level-Up-Momente und einen Lila-Token
für Streak-Repair ergänzt — mit Single-Source-Disziplin in `tokens.css`.
Auf der Datenseite vervollständigt die Seeding-Oberfläche (`/admin/diagnostics`)
das Real-Data-Programm: Der einzige verbleibende Laufzeit-Blocker
(`is_diagnostic=true`-Content) kann jetzt ohne SQL-Editor befüllt werden.

---

## Was gebaut wurde

### 1. Brand-System & Logo

**Commits:** `feat(brand): echtes Edvance-Logo einbinden` · `feat(brand): Wordmark-Logo in Navbar`

Neue Datei `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` mit drei
exportierten Komponenten:

- `EdvanceSymbol` — SVG-J-Kurve (Hairline + Dot + Gold-Pfeil), skalierbar
  über `size`-Prop; unterstützt `filled`-Variante (kalligraphischer Pfad für
  App-Icons und Siegelprägungen).
- `EdvanceLogo` — Symbol + Wordmark nebeneinander; Font: Space Grotesk 400,
  `letterSpacing: 0.045em`. Prop `symbolRight` dreht die Reihenfolge um.
- `EdvanceAppIcon` — gerundetes Quadrat mit Navy-Hintergrund und weißem Symbol
  (Radius auto-berechnet aus `size * 0.22`); geeignet für App-Icons und
  Avatar-Slots.

Alle drei Komponenten haben `color`- und `accentColor`-Props (defaults:
`#334D7A` / `#E8A020`) und akzeptieren `className` + `style` für
Kompositions-Flexibilität.

**Hinweis:** Die Komponente enthält intern hardcodierte Hex-Werte in
`const COLORS` (`#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020`). Das ist
der einzige begründete Ausnahmefall: ein Low-Level-SVG-Primitive, das außerhalb
des CSS-Custom-Property-Scopes existiert. Alle Page-/Komponenten-Aufrufe
übergeben diese Farben als Props oder CSS-Variablen.

**Navbar-Integration** (`/home/user/Edvance/src/components/edvance/EdvanceNavbar.tsx`):
`EdvanceLogo size={20}` ersetzt den früheren Text-Platzhalter. Die Navbar
verwendet `glass-light` + `border-[var(--border)]` — keine Inline-Stile.
Darunter steht die `subtitle`-Prop als Caption-Text (`text-xs`, `var(--text-muted)`).

### 2. Farbsystem-Feinschliff (Level-Up Türkis + Repair Lila)

**Commits:** P1 · P2 · P3 (Tokens, Consumer, Showcase)

Alle Token-Definitionen liegen in `/home/user/Edvance/src/styles/tokens.css`
(@layer base · :root). Neue Tokens dieser Phase:

| Token | Wert | Verwendung |
|---|---|---|
| `--color-levelup` | `#0E9E96` | Badge/UI-Variante (ruhig) |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | Text-On-Color (WCAG) |
| `--gradient-levelup` | `135deg, #1FD3C6 → #0B8B85` | Gradient für Level-Up-Momente |
| `--shadow-glow-levelup` | `0 0 44px rgba(25,201,188,0.36)` | Glow auf Navy |
| `--color-moment-repair` | `#8B5CF6` | Streak-Repair Power-up (Lila) |
| `--color-moment-repair-on` | `#FFFFFF` | Text-On für Repair |
| `--gradient-repair` | `135deg, #A78BFA → #7C3AED` | Repair-Gradient |
| `--color-accent-light` | `#FBEAD0` | Badge-BG für XP/Accent |

Zusätzlich Premium-Erweiterungen:
`--color-hero-navy` (`#14213D`), `--color-hero-navy-2` (`#1F3157`),
`--gradient-brand`, `--gradient-hero`, `--gradient-primary-btn`,
`--gradient-gold`, `--gradient-surface`, `--gradient-celebration`,
`--shadow-premium-sm/md/lg/xl`, `--shadow-glow-primary`, `--shadow-glow-gold`,
`--shadow-inset-card`.

**Legacy-Aliase** in `/home/user/Edvance/src/styles/globals.css` zeigen jetzt
auf die neuen Token-Single-Sources:
`--xp-gold: var(--color-accent)`,
`--xp-gold-light: var(--color-accent-light)`,
`--level-purple: var(--color-moment-repair)`.

**Utility-Klassen** (in globals.css `@layer utilities`):
`.bg-gradient-levelup`, `.bg-gradient-repair`, `.shadow-glow-levelup`,
`.shadow-premium-sm/md/lg/xl`, `.shadow-glow-primary`, `.shadow-glow-gold`,
`.bg-gradient-brand`, `.bg-gradient-hero`, `.bg-gradient-primary-btn`,
`.bg-gradient-gold`, `.bg-gradient-success`, `.bg-gradient-surface`,
`.bg-gradient-celebration`, `.glass-light`, `.glass-dark`, `.hover-lift`,
`.noise-overlay`, `.text-display`, `.text-eyebrow`.

**Toast-Klassen** (ebenfalls utilities): `.toast-levelup` (Türkis-Gradient),
`.toast-success`, `.toast-xp`, `.toast-warning`, `.toast-error`.

**Consumer-Änderungen (P2):**
- `EdvanceBadge`: Varianten `levelup` und `repair` ergänzt.
- `ToastBanner`: Typ `levelup` zeigt `.toast-levelup` Türkis-Gradient.
- `ScenarioCelebration` (`/demo/design`): Level-Up-Tab zeigt Türkis via
  `--gradient-levelup` + `--shadow-glow-levelup` auf Navy.
- `XPBar`: nutzt durch P1 automatisch das vereinheitlichte Gold.

### 3. Real-Data-Programm — abschließende Units

Die Hauptarbeit des Real-Data-Programms ist in der Retro
`2026-05-16-real-data-program.md` dokumentiert. Diese Phase schließt die
verbleibenden offenen Units ab.

**Schnellzugriff-Kacheln (`DashboardTiles`):**

Neue Komponente `/home/user/Edvance/src/components/edvance/DashboardTiles.tsx`
(`DashboardTile`-Typ + `DashboardTiles`-Funktion). Rendert ein responsives
Grid (1→2→3 Spalten), unterstützt sowohl React-Router-`Link` als auch Anker-Links
(`anchor: true`). Icon-Hintergrund über `color-mix(in srgb, var(--primary) 12%, transparent)`,
kein Inline-Style für Farben.

Eingesetzt in:
- `StudentDashboard`: 2 Kacheln — „Screening starten" (`/screening`) + „Lernpfad"
  (Anker `#lernpfad`).
- `CoachDashboard`: 3 Kacheln — „Erstgespräch-Protokoll" (`/coach/intake`),
  „Screening Coach-Sicht" (`/screening?view=coach`), „Leads" (`/admin/leads`).
- `ParentDashboard`: Kacheln nur bei mehreren Kindern als Sprungmarken
  (`#child-[id]`).

**`/screening`-Route (U5c):**
- DB-Persistenz: `createScreeningTest`, Snapshot-Schreiben mit
  `screening_test_id`, Coach-Rating in `screening_ratings`.
- `completeScreeningTest` bei Abschluss, DB-Resume via
  `getActiveScreeningTest` + Snapshots + Ratings (deterministisch über
  `rebuildRunTasks` aus `generated_test`-JSONB).
- `localStorage` vollständig aus `DiagnosisContext` entfernt — einziger
  verbleibender localStorage ist `ThemeContext` (kosmetisch, bewusst).

### 4. Admin-Seeding & Diagnostics

**Commits:** `feat: /admin/diagnostics`, `feat: Lib – updateTaskDiagnostic + createDiagnosticTask`

Neue Seite `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` (421 Zeilen):

- Zwei-Panel-Aufbau: `NewTaskForm` (Eingabe) + `TaskRow`-Liste (Edit vorhandener Tasks).
- Fach/Cluster/Microskill-Cascades laden aus Supabase (`getSubjects`,
  `getClustersBySubject`, `getMicroskillsByCluster`).
- `NewTaskForm` ruft `createDiagnosticTask` (lib), `TaskRow` ruft
  `updateTaskDiagnostic` (lib) — kein direkter Supabase-Aufruf in der Page.
- `LoadingPulse` und `EmptyState` korrekt eingebunden.
- Verlinkung aus `AdminDashboard` als Text-Link (`<Link>` mit Lucide-Icon
  `FlaskConical`).

**Lib-Ergänzungen in `/home/user/Edvance/src/lib/supabase/tasks.ts`:**
`createDiagnosticTask(input: DiagnosticTaskInput)` und
`updateTaskDiagnostic(id, patch)` — beide mit `SupabaseResult<T>` + try/catch.

---

## Komponenten-Übersicht

| Komponente / Datei | Was geändert |
|---|---|
| `src/components/brand/EdvanceLogo.tsx` | Neu: `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon` |
| `src/components/edvance/EdvanceNavbar.tsx` | `EdvanceLogo` integriert, kein Text-Platzhalter mehr |
| `src/components/edvance/DashboardTiles.tsx` | Neu: `DashboardTile`-Typ + `DashboardTiles`-Komponente |
| `src/styles/tokens.css` | Level-Up-Türkis, Repair-Lila, Premium-Gradients + Shadows |
| `src/styles/globals.css` | Legacy-Aliase auf tokens.css, neue Utility-Klassen, Toast-Klassen |
| `src/pages/admin/DiagnosticsPage.tsx` | Neu: Diagnostik-Content-Seeding-Oberfläche |
| `src/pages/admin/AdminDashboard.tsx` | Schnellzugriff-Links zu `/admin/diagnostics`, `/admin/tiers`, `/admin/leads` |
| `src/pages/student/StudentDashboard.tsx` | DashboardTiles, XP/Streak aus DB, Hero-Section mit `bg-gradient-hero` |
| `src/pages/coach/CoachDashboard.tsx` | DashboardTiles (3 Kacheln), Sessions aus DB |
| `src/pages/parent/ParentDashboard.tsx` | DashboardTiles (nur bei >1 Kind), Echtdaten über RLS |
| `src/pages/DesignShowcase.tsx` | Gruppe „Emotionale Momente" mit allen Level-Up/Repair/Moment-Tokens |
| `src/lib/supabase/tasks.ts` | `createDiagnosticTask`, `updateTaskDiagnostic` ergänzt |
| `src/context/DiagnosisContext` | localStorage-Nutzung vollständig entfernt |

---

## Offene Punkte

- **Diagnostik-Content-Seeding**: `tasks.is_diagnostic = true` fehlt noch für
  produktive Aufgaben. `/screening` zeigt bis dahin korrekt `EmptyState`.
  Die `DiagnosticsPage` macht das ohne SQL-Editor bearbeitbar — erfordert aber
  manuelle Eingabe pro Aufgabe, kein Bulk-Import.
- **Browser-Verifikation**: U4 (Lead → Schüler via `provisionStudent`) und der
  komplette `/screening`-DB-Flow wurden nicht im Browser durch Rasit verifiziert
  (laut Retro 2026-05-16 offen).
- **PR #16 Base-Branch**: PR wurde mit Base `main` statt `dev` erstellt
  (Abweichung von CLAUDE.md §5). Status unklar — ob und wie das bereinigt wurde,
  ist nicht dokumentiert.
- **EdvanceBadge Varianten**: `levelup` und `repair` wurden in P2 ergänzt, aber
  im `DesignShowcase` (`Section "EdvanceBadge – alle Varianten"`) noch nicht
  angezeigt — die neuen Varianten fehlen in der Showcase-Auflistung.
- **Zwei-Geräte-Sync**: Schüler-Tablet + Coach haben im DB-Modus keinen
  Cross-Tab/Cross-Device-Sync mehr (localStorage entfernt). Realtime-Integration
  ist eigener Folgeschritt.
- **`/admin/diagnostics` Zeilenzahl**: `DiagnosticsPage.tsx` hat 427 Zeilen und
  nähert sich dem 400-Zeilen-Limit. Bei weiteren Features sollte
  `NewTaskForm` oder `TaskRow` in eigene Dateien ausgelagert werden.
- **Lambacher-Import** (`/admin/lambacher`): Bereits als Seite vorhanden, aber
  in ROADMAP und keiner Retro erwähnt — Status unklar.
- **Mathebuch-Import** (Lambacher Schweizer 8. Klasse NRW): In ROADMAP als
  nächster Schritt, noch nicht begonnen.

---

## Technische Schulden / Risiken

- **Hardcodierte Hex-Werte in `EdvanceLogo.tsx`**: Die `const COLORS`-Map
  enthält `#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020`. Das ist bewusst für das
  SVG-Primitive (kein CSS-Scope), sollte aber im CLAUDE.md als explizite Ausnahme
  dokumentiert werden, um Verwechslungen bei künftigen Reviews zu vermeiden.
- **Inline-Stile in `AdminDashboard.tsx`**: Die Konstanten `SHADOW_CARD` und
  `SUCCESS_ICON_BG` werden als `style={...}` übergeben (Zeilen 71, 73, 183).
  `SHADOW_CARD` ist ein statischer Box-Shadow-Wert — sollte eine Utility-Klasse
  (`shadow-card` oder `shadow-premium-md`) nutzen. `SUCCESS_ICON_BG` mit
  `color-mix()` ist dynamisch und akzeptabel als Ausnahme.
- **`CoachDashboard.tsx` lokales `StatCard`**: Die Page definiert eine eigene
  `StatCard`-Funktion (Zeile 70–97) anstatt die globale `StatCard`-Komponente
  aus `src/components/edvance` zu importieren. Duplikation — sollte migriert werden.
- **Inline-Styles in `CoachDashboard.tsx`**: `SHADOW_CARD`, `SHADOW_ACTIVE`
  werden per `style={{ boxShadow: ... }}` übergeben, statt Utility-Klassen
  (`shadow-card`, `shadow-elevation-md`) zu verwenden.
- **Token-Dualismus**: `globals.css` und `tokens.css` koexistieren mit
  Überlappungen. Die `@theme inline`-Mappings in `globals.css` brücken beide,
  aber einige Legacy-Variablen (z.B. `--primary`, `--success`) haben abweichende
  Hex-Werte im Vergleich zu `--color-primary` / `--color-success` aus
  `tokens.css`. Langfristig sollte auf eine einzige Quelle migriert werden.
- **`DiagnosisContext` in-memory**: Der `/diagnosis`-Modus (lokales Üben) ist
  nach der localStorage-Entfernung rein in-memory pro Tab. Tab-Reload verwirft
  den Zustand. Das ist dokumentiert als bewusste Entscheidung, kann aber für
  Nutzer überraschend sein.
