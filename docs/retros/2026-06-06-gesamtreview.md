# Retro 2026-06-06 — Gesamt-Review: Vollständige Projekthistorie Mai 2026

Branch: `claude/sweet-ramanujan-EWCH3` / Stand: `dev` (HEAD = `9b4388f`, 2026-05-17)

## Überblick

Dieses Gesamt-Review erfasst die komplette Entwicklungshistorie von Edvance vom Projektstart (2026-05-07) bis zum letzten Merge (2026-05-17, PR #18). In 122 Commits wurden Fundament, Design-System, Content-Pipeline, Diagnose-Engine, vollständiges Real-Data-Programm (Mock-Entfernung) sowie Brand-System und Premium-Farbsystem aufgebaut. Die Datei dient als konsolidierte Wissensbasis und löst die Einzelretros aus der Woche ab.

---

## Was gebaut wurde

### Phase 1 — Fundament (2026-05-07 bis 2026-05-08)

- Vite 5 + React 18 + TypeScript + Tailwind v4 + shadcn/ui Bootstrap
- Supabase Auth mit Rollen (`student | parent | coach | admin`)
- `ProtectedRoute` mit role-spezifischer Allowlist
- `AuthContext`, `ThemeContext` (localStorage, bewusst)
- Erstes Design-System: `EdvanceCard`, `MasteryBar`, `XPBar`, `StatCard`, `EdvanceBadge`, `EmptyState`, `LoadingPulse`, `ToastBanner`, `AvatarInitials`, `ProgressStep`
- Strukturelle Reorganisation: `src/components/edvance/`, rollenbasierte Pages-Ordner (`coach/`, `student/`, `parent/`, `admin/`), `src/lib/supabase/` als disziplinierte Supabase-Schicht
- Onboarding-Wizard in Schritt-Komponenten extrahiert (`src/components/edvance/onboarding/`)
- `CLAUDE.md` Harness + Branch-Strategie (`main` / `dev` / `feature/*`)

### Phase 2 — Content-Schema + Serlo-Import (2026-05-09)

- Schema-Erweiterung: `subjects`, `skill_clusters` (5 KMK-Kompetenzbereiche), `microskills`, `tasks`
- Serlo-Import-Pipeline (wurde später wieder entfernt): KaTeX-Rendering, Plugin-Layer, Keyword-Mapping
- `BehaviorSnapshot`-Persistenz (append-only, Migration 003)
- Nativer `TaskPlayer`, `ClusterView`, Admin-Content-Preview mit Live-Suche

### Phase 3 — Diagnose-Engine (2026-05-09 bis 2026-05-10)

- `src/lib/diagnostic/generator.ts`: Testgenerator für Initialdiagnostik (NRW Klasse 8 Mathe)
- `src/lib/diagnostic/coverageReporter.ts`: Abdeckungsanalyse über Cluster/Kompetenz
- `src/lib/taxonomy/nrw_math_klasse8.json`: 17 Microskills mit Metadaten
- `scripts/mark-diagnostic.ts`: Heuristik-Script zum Setzen von `is_diagnostic=true`
- Migration 005: `tasks.cognitive_type`, `input_type`, `is_diagnostic`, `curriculum_ref`, `question_payload`, `typical_errors`
- `DiagnosisContext`, `DiagnosisSession` (`/diagnosis`), `DiagnosisResult` als lokaler, in-memory Tab-Flow
- `MathToolbar`, `DrawCanvas` (Hand-Zeichnen auf Touch-Geräten)

### Phase 4 — Sub-Agent-Pipeline (2026-05-11 bis 2026-05-13)

- `.claude/agents/`: `coder.md`, `reviewer.md`, `deployer.md`, `refactor.md`
- Vier-Stufen-Pipeline dokumentiert und verdrahtet: `coder → refactor → reviewer → deployer`
- Serlo vollständig entfernt (`b5d7c54`): Serlo-Import-Scripts, `serlo_*`-Spalten, abhängige Renderer

### Phase 5 — Mathebuch-Import-Pipeline (2026-05-13 bis 2026-05-14)

- `scripts/import/lambacher.ts`: idempotenter Importer für Lambacher Schweizer 8 NRW (Dry-Run + `--write`)
- Normalisierung loser Roh-JSONs, Upsert via `(source, source_ref)` Unique-Constraint
- `scripts/import/PLUGIN_BRIEFING.md`: Briefing für Chrome-Plugin-Claude, Topic-Code-Tabelle
- Migration 006 (Serlo-Entfernung) + 007 (`task_source`) + 008 (Unique-Constraint-Fix)
- `LambacherPreview`-Seite (`/admin/lambacher-preview`) als Admin-Vorschau
- `scripts/generate-assets.ts`: Asset-Generator via Anthropic API + Canva-Prompts
- Asset-Upload-Pipeline: Supabase Storage + RLS + Admin-UI (`task_assets`, Migration 009, 010)
- `src/lib/render/MathContent.tsx`: Markdown + LaTeX-Rendering
- Task-Komponenten-Bibliothek: `TaskMetaRow`, `TaskPedagogyAccordion`, `TaskPreviewCard`, `TaskQuestionBlock`, `TaskFilterBar`

### Phase 6 — Design-System Premium (2026-05-15)

- `src/styles/tokens.css`: vollständiges CSS-Token-System (Primär, Hintergrund, Text, Akzent, Status, Emotionale Momente, Premium-Gradients, Shadows)
- `src/styles/globals.css`: `@theme inline`-Mapping auf Tailwind v4, Tailwind-Utilities, Toast-, Animations-, Bar-Klassen
- Komponenten-Upgrade: alle `EdvanceCard`-Varianten (`default | raised | navy | blue-pale | hero | glass | premium`), Accent-Borders
- Task-Input-Widgets: `MCWidget` (Multiple Choice), `MatchingWidget` (Zuordnung), `StepsWidget` (Schritt-für-Schritt), DRAW-Modus via `DrawCanvas`
- `TaskAnswerArea` als kombinierter Wrapper
- Szenarien-Demo: `/demo/design` mit 5 Live-Szenarien (`ScenarioStudent`, `ScenarioCoach`, `ScenarioSessionEnd`, `ScenarioCelebration`, `ScenarioUIKit`)

### Phase 7 — Real-Data-Programm (2026-05-16 bis 2026-05-17)

Vollständige Mock-Entfernung und Supabase-Echtdaten-Anbindung. Alle Details in `docs/retros/2026-05-16-real-data-program.md`. Kurzfassung:

**Migrationen 011–021** (manuell im Supabase SQL Editor):
- 011: RLS-Fix `students/parent_student/student_subjects` + Security-Definer-Helper
- 012: `leads` (Erstkontakt, PII, Coach/Admin)
- 013: `intake_sessions` (Erstgespräch-Protokoll)
- 014: `screening_tests` + `screening_ratings` (append-only) + `behavior_snapshots.screening_test_id`
- 015: `tiers` + `student_subscriptions`
- 016: `student_coach`
- 017: `coaching_sessions` + `session_students`
- 018: `student_task_progress` (ersetzt localStorage)
- 019: `student_progress` + `xp_events` (append-only) + Trigger `apply_xp_event`
- 020: `parent_reports`
- 021: atomare RPC `app_provision_student` (SECURITY DEFINER, nur service_role)

**Lib-Layer** (`src/lib/supabase/`): 19 Module, alle mit `SupabaseResult<T>` + try/catch:
`auth`, `behavior`, `client`, `intake`, `leads`, `parentReports`, `profiles`, `progress`, `provision`, `screening`, `screeningRatings`, `sessions`, `storage`, `studentCoach`, `students`, `subscriptions`, `taskProgress`, `tasks`, `tiers`

**Edge Function** `supabase/functions/provision_student` (Deno, service-role):
Auth-User-Anlage (Schüler + optionaler Eltern-Invite) → RPC 021 → Cleanup bei Fehler

**UI-Flows** (U1–U10 + Finales):
- U1: `MOCK_COACHES` → `getCoaches()`
- U2: `/admin/leads` — Lead-Erfassung + Liste + Status-Workflow
- U3: `/coach/intake` — Erstgespräch-Protokoll (draft→final)
- U4: AdminDashboard + LeadsPage → `provisionStudent()` (Edge Function live)
- U5a/b: Diagnose-Engine auf echten Generator, `mockDiagnosisTasks.ts` gelöscht
- U5c: `/screening` — DB-gestützt + DB-Resume, `DiagnosisContext` ohne localStorage
- U6: `/admin/tiers` — DB-Katalog statt Hardcode
- U7: `CoachDashboard` — echte Sessions/Anwesenheit, `mockData.ts` gelöscht
- U8: `ClusterView` — Fortschritt aus `student_task_progress`
- U9: `StudentDashboard` — XP/Streak aus `student_progress`
- U10: `ParentDashboard` — echte Kind-Daten + Reports

**Admin-Tooling:**
- `/admin/diagnostics` (`DiagnosticsPage`): manuelle Oberfläche zum Seeden von Diagnose-Tasks (Subject → Cluster → Microskill → Task, Flag `is_diagnostic=true` setzen)
- `createDiagnosticTask` + `updateTaskDiagnostic` in `src/lib/supabase/tasks.ts`

**`DashboardTiles`-Komponente** (`src/components/edvance/DashboardTiles.tsx`): Schnellzugriff-Kacheln für alle Rollen-Dashboards, nutzt `EdvanceCard`, Touch-Target `min-h-[44px]`

### Phase 8 — Brand-System + Farbsystem-Feinschliff (2026-05-17)

Details in `docs/retros/2026-05-17-farbsystem-feinschliff.md`. Kurzfassung:

**Brand-Assets:**
- `src/components/brand/EdvanceLogo.tsx`: `EdvanceSymbol`, `EdvanceLogo` (Symbol + Wordmark), `EdvanceAppIcon`
- `public/brand/`: `edvance-symbol.svg`, `edvance-logo-light.svg`, `edvance-logo-dark.svg`, `edvance-app-icon.svg`, `edvance-favicon.svg`
- `public/favicon.svg`: echtes Edvance-Favicon
- Space-Grotesk-Font via Google Fonts in `index.html`
- `EdvanceNavbar` nutzt `EdvanceLogo size=20` (Symbol + Wordmark) statt Placeholder-Text
- Login-Screen nutzt `EdvanceAppIcon size=64`

**Level-Up-Türkis (P1–P3):**
- `tokens.css`: `--color-levelup`, `--color-moment-levelup`, `--color-levelup-on`, `--gradient-levelup`, `--shadow-glow-levelup`
- `tokens.css`: `--color-moment-repair`, `--color-moment-repair-on`, `--gradient-repair`
- `tokens.css`: `--color-accent-light` (Badge-BG für Accent/XP)
- Legacy-Umleitung: `--xp-gold` → `var(--color-accent)`, `--xp-gold-light` → `var(--color-accent-light)`, `--level-purple` → `var(--color-moment-repair)` (Single Source)
- `globals.css`: `@theme inline`-Mapping + Utilities `.bg-gradient-levelup`, `.bg-gradient-repair`, `.shadow-glow-levelup`, `.toast-levelup`
- `EdvanceBadge`: neue Varianten `levelup` (Türkis) + `repair` (Lila)
- `ToastBanner`: Typ `levelup`
- `ScenarioCelebration`: Level-Badge via `--gradient-levelup` + `--shadow-glow-levelup`
- `DesignShowcase`: neue Gruppe „Emotionale Momente"

---

## Datenbankstruktur (Alle Migrationen)

| Migration | Zweck |
|---|---|
| 001 `competency_areas` | `skill_clusters` auf 5 KMK-Kompetenzbereiche umstellen |
| 002 `serlo_video_url` | (entfernt via Mig 006) |
| 003 `behavior_snapshots` | BehaviorSnapshots-Tabelle, append-only |
| 004 `serlo_content_raw` | (entfernt via Mig 006) |
| 005 `diagnostic_fields` | `tasks.cognitive_type/input_type/is_diagnostic/curriculum_ref/question_payload/typical_errors` |
| 006 `remove_serlo` | Serlo-Spalten + Tasks gelöscht |
| 007 `task_source` | `tasks.source` (NOT NULL) + `tasks.source_ref`, UNIQUE-Index (partial) |
| 008 `task_source_constraint` | Partial-Unique-Index durch echten Constraint ersetzt |
| 009 `task_assets` | `task_assets`-Tabelle + Storage-Integration |
| 010 `task_assets_storage_rls` | Storage-RLS für Asset-Uploads |
| 011 `students_rls_fix` | RLS-Policies `students/parent_student/student_subjects` + Security-Definer-Helper |
| 012 `leads` | `leads`-Tabelle (Erstkontakt, PII) |
| 013 `intake_sessions` | Erstgespräch-Protokoll |
| 014 `screening` | `screening_tests` + `screening_ratings` (append-only) + `behavior_snapshots.screening_test_id` |
| 015 `tiers_subscriptions` | `tiers`-Katalog + `student_subscriptions` |
| 016 `student_coach` | Schüler-Coach-Zuordnung |
| 017 `coaching_sessions` | `coaching_sessions` + `session_students` |
| 018 `student_task_progress` | Aufgaben-Fortschritt (ersetzt localStorage) |
| 019 `gamification` | `student_progress` + `xp_events` (append-only) + Trigger `apply_xp_event` |
| 020 `parent_reports` | Elternreport (draft/published) |
| 021 `provision_student_fn` | Atomare RPC `app_provision_student` (SECURITY DEFINER) |

---

## Architekturentscheidungen

- **Mock-first, dann Echtdaten:** Konsequente Trennung erlaubte unabhängige UI-Entwicklung; Mock-Entfernung in einer Session (U1–U10) durchgezogen.
- **Append-only strikt:** `behavior_snapshots`, `screening_ratings`, `xp_events` — kein Update, kein Delete. Coach-Bewertungen als separate Tabelle statt Column-ALTER.
- **Nicht-rekursive RLS via Security-Definer-Helper:** `get_my_role()`, `get_my_student_id()`, `is_parent_of_student(uuid)` vermeiden RLS-Rekursion und sind programmweit single source.
- **Lead→Student atomar:** plpgsql-RPC `app_provision_student` für den DB-Teil; Edge Function `provision_student` nur für Auth-User-Anlage (Client hat nur anon-Key). Cleanup bei Fehler.
- **jsonb statt Normalisierung** für `generated_test` (Screening) und `result_summary`: ermöglicht flexible Schemaevolution ohne Migrationsdruck.
- **DiagnosisContext ohne localStorage:** `/diagnosis` ist rein in-memory pro Tab; `/screening` ist DB-gestützt mit deterministischem Resume via `rebuildRunTasks`. Einziger verbleibende localStorage-Einsatz: `ThemeContext` (kosmetisch, bewusst).
- **Serlo entfernt:** Serlo-Import-Pipeline war technisch zu komplex und blockierend. Ersetzt durch Lambacher-Import-Pipeline mit Plugin-Briefing für Chrome-Extension.
- **`SupabaseResult<T>`-Wrapper:** Alle Lib-Funktionen geben `{ data: T | null, error: string | null }` zurück. Kein unkontrolliertes `throw` außerhalb von `src/lib/`.
- **Lint via `npm run lint` (`tsc -b`), nicht `npx tsc --noEmit`:** Solution-tsconfig hat `files: []`. `node_modules` muss installiert sein. In dieser Review-Umgebung fehlen `node_modules` — TS-Fehler im `npm run lint`-Output sind daher Umgebungsartefakte, keine Code-Fehler.
- **Sub-Agent-Pipeline:** 4-Stufen-Pipeline (`coder → refactor → reviewer → deployer`) in `.claude/agents/` kodiert. Hub-Spoke-Modell aus CLAUDE.md §8 ist damit operationalisiert.
- **Token-System Single Source:** `src/styles/tokens.css` ist die einzige Quelle für Farbwerte. Legacy-Variablen werden intern auf neue Tokens umgeleitet, nie verdoppelt.

---

## Bekannte Regelverstöße (technische Schuld)

### Hardcodierte Shadow-Strings als Inline-Styles (Verstoß gegen CLAUDE.md §11)

CLAUDE.md verbietet `"Statische boxShadow in Inline-Styles"` explizit. Folgende Dateien verwenden `SHADOW_CARD`/`SHADOW_ACTIVE` als konstante `rgba()`-Strings in `style={{ boxShadow: ... }}`:

- `/home/user/Edvance/src/pages/coach/CoachDashboard.tsx` Zeilen 25–26, 82, 110
- `/home/user/Edvance/src/pages/admin/AdminDashboard.tsx` Zeilen 20, 71, 183

Lösung: Diese Werte in `tokens.css` als `--shadow-*`-Variablen anlegen und über Tailwind-Utilities (`shadow-card`, `shadow-elevation-md`) konsumieren. Alternativ bestehende `shadow-premium-*`-Utilities nutzen.

### Dateigröße > 400 Zeilen (Verstoß gegen CLAUDE.md §4)

Folgende Pages überschreiten das Limit:

- `/home/user/Edvance/src/pages/DiagnosisSession.tsx`: 764 Zeilen — Refactor empfohlen
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx`: 946 Zeilen — Refactor dringend empfohlen
- `/home/user/Edvance/src/pages/student/StudentDashboard.tsx`: 419 Zeilen — knapp über Limit
- `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx`: 427 Zeilen — knapp über Limit

`DiagnosisResult.tsx` und `DiagnosisSession.tsx` sind die dringlichsten Kandidaten für Extraktion von Sub-Komponenten in `src/components/edvance/diagnosis/` oder vergleichbare Ordner.

### Inline-Style in `ScenarioCelebration.tsx` (Grenzfall)

`/home/user/Edvance/src/pages/demo/ScenarioCelebration.tsx`: `background: 'var(--gradient-levelup)'` und `boxShadow: 'var(--shadow-glow-levelup)'` als Inline-Style. Da ausschließlich CSS-Variablen verwendet werden, ist dies nach CLAUDE.md §11 („außer für wirklich dynamische Werte") grenzwertig tolerierbar — besser wäre eine dedizierte Tailwind-Utility-Klasse wie `.bg-gradient-levelup` (die in `globals.css` bereits existiert).

---

## Offene Punkte / Nächste Schritte

- [ ] Diagnostik-Content seeden (`tasks.is_diagnostic=true`) → `/screening` zeigt bis dahin korrekten EmptyState
- [ ] Browser-Verifikation (U4-Conversion, `/screening`-Flow, `/admin/diagnostics`) durch Rasit
- [ ] `DiagnosisResult.tsx` (946 Zeilen) und `DiagnosisSession.tsx` (764 Zeilen) in Sub-Komponenten aufteilen
- [ ] `SHADOW_CARD`/`SHADOW_ACTIVE` in `CoachDashboard.tsx` und `AdminDashboard.tsx` durch CSS-Variablen-Tokens ersetzen
- [ ] ESLint-Konfiguration einrichten (automatisches `noUnusedImports`, kein `any`)
- [ ] Erster Lambacher-Content-Drop: Kapitel-Auswahl + Deadline definieren (Owner: Rasit)
- [ ] Realtime-Sync für Zwei-Geräte-Flow (Schüler-Tablet + Coach) — aktuell kein Cross-Tab-Sync
- [ ] Branch-Hygiene: PR #16 hatte `main` statt `dev` als Base (Abweichung CLAUDE.md §5) — für künftige PRs sicherstellen
- [ ] Zombie-Feature-Branches aus früherer Phase prüfen (Pointer-Cleanup)
- [ ] Home-Quest Flow (steht in ROADMAP als nächster Schritt nach Diagnostik-Content)
- [ ] Mathebuch-Import erster End-to-End-Test (1 Kapitel × 15–25 Aufgaben)
- [ ] `docs/ROADMAP.md` nach Content-Seeding und Browser-Verifikation aktualisieren
