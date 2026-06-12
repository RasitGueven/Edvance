# Retro 2026-05-17 — Brand-System, Dashboard-Tiles, Admin-Diagnostics

Commits: `9051995`, `3cf2c29` (Brand), `0c30186` (DashboardTiles), `17e8156`, `2326772` (Admin Diagnostics).
Branch: `dev` (direkt).

---

## Was gebaut wurde

### 1. Brand-System (`src/components/brand/EdvanceLogo.tsx` + `public/brand/`)

Drei wiederverwendbare React-Komponenten für die Edvance-Markenidentität:

- **`EdvanceSymbol`** — die alleinstehende J-Kurve (SVG, viewBox 0 0 100 100).
  Zwei Render-Modi: Hairline (Linie + Dot + Gold-Pfeil) und Calligraphic (gefüllter Pfad).
  Konfigurierbar via `size`, `color`, `accentColor`, `filled`, `className`, `style`.

- **`EdvanceLogo`** — Symbol + Wordmark nebeneinander.
  Wordmark in Space Grotesk, Größe und Gap skalieren proportional zum `size`-Prop.
  `symbolRight`-Prop für umgekehrte Anordnung (Wordmark links, Symbol rechts).

- **`EdvanceAppIcon`** — gerundetes Quadrat (App-Icon-Form) mit zentriertem Symbol.
  Border-Radius und innere Symbol-Größe werden anteilig vom `size`-Prop abgeleitet.
  `filled`-Prop wechselt zwischen Hairline- und Calligraphic-Modus.

Statische SVG-Dateien in `public/brand/` (fünf Assets):
`edvance-symbol.svg`, `edvance-logo-light.svg`, `edvance-logo-dark.svg`,
`edvance-app-icon.svg`, `edvance-favicon.svg`.

`public/favicon.svg` → echtes Edvance-Favicon (vorher Vite-Placeholder).

**Konsumenten:**
- `src/pages/Login.tsx` — verwendet `EdvanceAppIcon` mit `size=64`, eingebettet in einen
  Gold-Glow-Wrapper (`bg-gradient-gold blur-xl`).
- `src/components/edvance/EdvanceNavbar.tsx` — verwendet `EdvanceLogo` mit `size=20`
  (Symbol + Wordmark, Standard-Midnight-Blau).

**Typografie:** `index.html` lädt Space Grotesk (400/500/700) via Google Fonts Preconnect.

---

### 2. Dashboard-Schnellzugriff-Kacheln (`src/components/edvance/DashboardTiles.tsx`)

Neue generische Kachel-Komponente für Schnellzugriff auf Schüler-, Coach- und Eltern-Dashboards.

- `DashboardTile`-Typ: `to`, `icon`, `title`, `description`, `anchor?`.
  `anchor=true` rendert ein natives `<a href>` (für Seitenmarken), sonst React-Router `<Link>`.
- Layout: responsives Grid (1 Spalte → 2 Spalten ab `sm` → 3 Spalten ab `lg`), `gap-4`.
- Icon-Hintergrund via `color-mix(in srgb, var(--primary) 12%, transparent)` —
  kein Hex, kein fester Alpha-Wert, sondern Token-basiert.
- Touch-Target: `min-h-[44px]` auf Link/Anchor, Kachelhöhe natürlich größer.
- Hover: `hover:-translate-y-0.5` für subtile Elevation.
- Intern: `TileBody` als private Hilfsfunktion (nicht exportiert), nutzt `EdvanceCard`.

---

### 3. Admin Diagnostics

#### `src/lib/supabase/tasks.ts` — zwei neue Funktionen

- **`updateTaskDiagnostic(taskId, patch)`** — setzt diagnostik-relevante Felder
  (`is_diagnostic`, `difficulty`, `input_type`, `cognitive_type`, `is_active`) auf
  einer vorhandenen Aufgabe. RLS-Policy `admin_write_tasks` (nur Admin).
  Gibt die aktualisierte Task-Zeile zurück.

- **`createDiagnosticTask(input)`** — legt eine neue manuelle Diagnose-Aufgabe an.
  Setzt `content_type='exercise'`, `is_diagnostic=true`, `is_active=true`,
  `source='manual'`. Alle optionalen Felder werden explizit auf `null` gesetzt,
  wenn nicht übergeben. `estimated_minutes` fällt auf `3` zurück.

Beide Funktionen folgen dem bestehenden `SupabaseResult<T>`-Muster mit
`try/catch` und aussagekräftiger Fehlermeldung.

#### `src/pages/admin/DiagnosticsPage.tsx` (427 Zeilen)

Admin-interne Seite zum manuellen Seeden und Justieren von Diagnose-Aufgaben.

**Aufbau:**
- Fach-/Cluster-Auswahl (kaskadierend: Fach → Cluster → Aufgabenliste).
- `NewTaskForm` — Inline-Formular zum Anlegen einer neuen Diagnose-Aufgabe
  (Cluster, Microskill, Schwierigkeit, Input-Typ, Kognitiver Typ, Klassenstufe,
  Frage, Lösung). Validierung: Frage darf nicht leer sein.
- `TaskRow` — EditCard pro bestehender Aufgabe: Checkbox `is_diagnostic`,
  Dropdowns für Difficulty/InputType/CognitiveType, Speichern-Button.
  Badge zeigt Diagnosestatus via `EdvanceBadge variant=success/muted`.
- Leerzustände via `EmptyState` (Cluster nicht gewählt / keine Aufgaben).
- Ladezustand via `LoadingPulse type="list" lines={4}`.
- Fehlermeldungen inline unterhalb des jeweiligen Formularbereichs.

---

## Entscheidungen

| Entscheidung | Begründung |
|---|---|
| SVG-Paths inline in TSX statt externe `.svg`-Imports | Farb-Props (`color`, `accentColor`) müssen zur Laufzeit gesetzt werden; externe SVGs wären statisch oder erforderten komplizierte SVGR-Konfiguration. |
| Hardcodierte Hex-Farben im `COLORS`-Objekt in `EdvanceLogo.tsx` | Logo-Farben sind Markenwerte, keine UI-Tokens. Sie werden nur in der Brand-Komponente selbst referenziert und nirgends sonst. Kein CSS-Var nötig, da Logo-Konsumenten via Props überschreiben können. |
| `color-mix()` für Icon-Hintergrund in `DashboardTiles` | Erzeugt halbtransparentes Primary-Tint ohne separaten Token oder festen Hex-Wert — Token-basiert, aber ohne explizite Alpha-Variable. |
| `DiagnosticsPage` direkt auf `dev`, kein Feature-Branch | Reine Admin-Seite ohne Schema-Änderung, kein Nutzer-Impact. Seite ist nur für angemeldete Admins erreichbar. |
| `createDiagnosticTask` setzt `source='manual'` fix | Klare Herkunftskennzeichnung für manuell geplante Diagnose-Aufgaben vs. importierte Inhalte (`mathebuch_*`). |

---

## Reviewer-Befunde (statische Prüfung)

- `npx tsc --noEmit` → **0 Fehler, 0 Warnungen**.
- `EdvanceLogo.tsx`: 249 Zeilen — unter dem 400-Zeilen-Limit, enthält drei Komponenten.
- `DiagnosticsPage.tsx`: 427 Zeilen — **knapp über dem 400-Zeilen-Limit**. Refactor empfohlen
  (z.B. `NewTaskForm` und `TaskRow` in eigene Dateien unter `src/components/admin/`).
- `DashboardTiles.tsx`: 62 Zeilen — sauber.
- Inline-Styles in `EdvanceLogo.tsx`: vorhanden, aber ausschließlich für dynamisch berechnete
  Werte (`size`, `gap`, `borderRadius`, `fontFamily`, `fontSize`, `letterSpacing`, `lineHeight`,
  `flexDirection`). Alle statischen Layout-Werte wären via Tailwind nicht abbildbar (dynamische
  px-Berechnungen aus Props). Akzeptiert.
- Supabase-Zugriffe: ausschließlich in `src/lib/supabase/tasks.ts`. Kein Verstoß.
- BehaviorSnapshots: nicht berührt. Kein Update/Delete auf dieser Tabelle.
- Kind-seitiges Feedback: nicht betroffen (reine Admin-/Navbar-/Login-Änderungen).
- `.env` nicht gestaged (keine Änderung).
- Auth/RLS: `updateTaskDiagnostic` setzt RLS `admin_write_tasks` voraus —
  keine neue Policy, Sicherheitsverantwortung liegt bei bestehender DB-Policy.
  Keine Auth-Logik-Änderung in diesem Diff.

---

## Offene Punkte

- `DiagnosticsPage.tsx` übersteigt 400 Zeilen (427). `NewTaskForm` und `TaskRow` sollten in
  `src/components/admin/` ausgelagert werden, wenn weitere Felder hinzukommen.
- `EdvanceLogo.tsx` hat keine `export` im Showcase (`/showcase`): Komponente ist noch nicht
  in `DesignShowcase` dokumentiert — ergänzen, damit Designprüfung möglich ist.
- Space Grotesk kommt über Google Fonts (CDN) — kein Self-Hosting. Bei Offline-Betrieb
  oder strengen Datenschutz-Anforderungen Fallback prüfen.
- `EdvanceLogo`-`symbolRight`-Prop ist implementiert, aber nirgends aktiv genutzt.
  Entweder baldigen Use-Case belegen oder bis dahin nicht dokumentieren.
- Static SVG-Assets in `public/brand/` (5 Dateien) und die TSX-Komponente sind momentan
  separate Systeme — bei weiteren Brand-Updates beide Quellen synchron halten.
- Admin-Route `/admin/diagnostics` ist noch nicht in der Admin-Navigations-/Sidebar-Struktur
  verlinkt (nur über direkten URL-Aufruf erreichbar, laut Commit-Scope bewusst).
