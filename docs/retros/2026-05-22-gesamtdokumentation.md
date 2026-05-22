# Edvance — Gesamtdokumentation (Stand: 2026-05-22)

Dieses Dokument ist das vollständige Entwicklungsprotokoll des Edvance-Projekts vom initialen Commit (2026-05-07) bis zum aktuellen Stand (2026-05-22). Es dient als Single Source of Truth für Architekturentscheidungen, Meilensteine, Schema-Übersicht und offene Punkte.

---

## 1. Zusammenfassung

**Was ist Edvance?**
Edvance ist eine hybride Lernakademie für Schülerinnen und Schüler der Klassen 5–13. Das Modell kombiniert Präsenzunterricht in Kleingruppen (max. 5 Personen) mit einem individuellen, KI-generierten Lernpfad auf dem Tablet. Ein Coach begleitet jede Session strukturierend, intervenierend und motivierend. Die Plattform adressiert vier Personas: Schüler, Eltern, Coach, Admin.

**Wo stehen wir heute (2026-05-22)?**

Die Plattform ist in der Pre-Launch-Phase in Köln. Alle zentralen Infrastruktur-Schichten sind produktionsbereit:

- ✅ Auth, Routing und RLS vollständig
- ✅ Vollständiges Datenbankschema (Migrationen 001–021) mit echten Daten in Supabase
- ✅ Alle Mock-Daten entfernt — Dashboards laufen auf Echtdaten
- ✅ End-to-End-Flow: Lead erfassen → Erstgespräch → Schüler anlegen (Edge Function) → Diagnose/Screening → Sessions → Reports
- ✅ Design-System mit Token-Hierarchie, Gamification-Moment-Mapping, Komponenten-Bibliothek
- ✅ Brand-Identität eingebunden (Logo, Wordmark, Space Grotesk)
- ✅ Task-Input-Widgets (MC, Matching, Schritte, Freihand-Zeichnung)
- ✅ Mathebuch-Import-Pipeline für Lambacher Schweizer 8. Klasse NRW
- 🔲 Diagnostik-Content (`is_diagnostic=true`) noch nicht geseedet → `/screening` zeigt korrekten EmptyState
- 🔲 Browser-Verifikation der Live-Flows durch Rasit noch ausstehend

**Team:**
- Rasit — Entwicklung, Reporting
- Ashkan — Leads, Erstkontakt
- Tolunay — Verträge, Planung, Zuweisung

**Tech Stack:**
- Frontend: Vite + React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
- Routing: React Router v6
- Edge Functions: Deno (Supabase Functions)
- Eigene Komponenten: `src/components/edvance/`
- Skripte: `scripts/` (Node/TSX für Import, Seeding, Asset-Generierung)

---

## 2. Meilensteine

### M0 — Projekt-Bootstrap (2026-05-07)
**Branch:** `main` (direkt)
**Commits:** `7735257` bis `24fb38b`

Erster lauffähiger Stand: Vite + React + TypeScript + Supabase Auth. Login-Flow mit Rollen-basiertem Routing. Bekannter Fix: Auth-Deadlock und RLS-Rekursion im Login behoben (`5347a1e`).

**Betroffene Dateien (initial):**
- `src/App.tsx`, `src/pages/Login.tsx`
- Supabase-Verbindung in `src/lib/supabase.ts` (damals noch monolithisch)

---

### M1 — Design-System-Fundament + Cleanup (2026-05-08)
**Branch:** `dev` + PRs #3, #4
**Commits:** `a3daf7b`, `545757f`, diverse

Zweiteilige Session: Zunächst ein vollständiges Design-System (Duolingo/Linear-Qualität) implementiert, danach ein umfassender Code-Audit und Strukturbereinigung durchgeführt.

**Was gebaut wurde:**

Design-System (`545757f`):
- Tailwind-Token-Schicht, shadcn/ui-Grundkomponenten
- `EdvanceCard`, `MasteryBar`, `XPBar`, `StatCard`, `EmptyState`, `LoadingPulse`, `ToastBanner` (erste Version)
- CLAUDE.md Harness konfiguriert

Strukturbereinigung (`a3daf7b`):
- `src/components/edvance/` eingeführt als Namespace für eigene Komponenten
- `src/lib/supabase/` aufgeteilt: `client.ts`, `auth.ts`, `profiles.ts`, `students.ts`
- Pages nach Rollen aufgeteilt: `coach/`, `student/`, `parent/`, `admin/`
- `src/hooks/` mit `useAuth`, `useTheme` als saubere Re-Exports
- `src/types/index.ts` als zentraler Type-Hub
- `EdvanceNavbar.tsx` als gemeinsame Navbar (vorher 4× dupliziert)
- `AdminDashboard` von 455 Zeilen auf ~130 Zeilen reduziert; Wizard-Steps ausgelagert
- Kein einziges `any` mehr im Code

**Entscheidungen:**
- Mock-First-Strategie: Alle Dashboards zunächst mit Mock-Daten, spätere Supabase-Anbindung
- `useAuth` als Re-Export statt eigener Hook-Logik (React-State bleibt beim Provider)
- Inline-Styles für `color-mix()`-Funktionen bewusst nicht entfernt (wäre Verhaltensänderung)

**Validierung:** `npx tsc --noEmit` → Exit 0, `npm run build` → 1657 Module, 422 KB JS / 18 KB CSS

---

### M2 — Diagnose-Engine + Content-Schema (2026-05-09)
**Branch:** `feature/diagnosis-engine`, `feature/content-schema`
**PRs:** #4, #5, #6, #9

Content-Schema mit Serlo-Import-Anbindung (NRW Klasse 8 Mathe), KMK-Kompetenzbereiche als Cluster-Hierarchie, Diagnose-Engine für Initialdiagnostik.

**Migrationen (frühe Phase, manuell im Supabase SQL Editor):**
- `schema_content.sql` — `subjects`, `skill_clusters`, `microskills`, `tasks`, `task_coach_metadata`
- `migrations/001_competency_areas.sql` — Cluster auf 5 KMK-Kompetenzbereiche
- `migrations/003_behavior_snapshots.sql` — `behavior_snapshots` (append-only von Beginn an)

**Betroffene Dateien:**
- `src/lib/diagnostic/` — Generator-Logik
- `src/lib/behaviorAnalysis.ts`
- `src/lib/taxonomy/nrw_math_klasse8.json`
- `scripts/seed-clusters.ts`, `scripts/seed-taxonomy.ts`

**Entscheidung:** Serlo als initiale Content-Quelle angebunden, später (PR #9/`feature/remove-serlo`) vollständig entfernt — alle Serlo-Spalten und -Daten gelöscht (Migration 006).

---

### M3 — Mathebuch-Import-Pipeline + Task-Preview (2026-05-13/14)
**Branch:** `feature/mathebuch-import`, `feature/task-preview-redesign`
**PRs:** #10, #11, #12
**Retro:** `docs/retros/2026-05-13-mathebuch-import.md`

Vollständige Import-Pipeline für Lambacher Schweizer 8. Klasse NRW, plus Admin-UI zur Vorschau und Verwaltung.

**Was gebaut wurde:**

Import-Pipeline:
- `scripts/import/lambacher.ts` — idempotenter Importer (Upsert via `source` + `source_ref`), Default Dry-Run, `--write` für echten Supabase-Write
- `scripts/import/PLUGIN_BRIEFING.md` — Briefing für Chrome-Plugin-Claude (Output-Format, Pflichtfelder, Topic-Code-Tabelle)
- `src/lib/taxonomy/nrw_math_klasse8.json` — 17 Microskills aus NRW Klasse 8 mit `cognitive_type`, `estimated_minutes`, `curriculum_ref`
- `scripts/import/runs/<timestamp>.json` — Run-Log pro Lauf

Admin-UI Task-Preview (PR #12):
- `src/pages/admin/LambacherPreview.tsx` — Vorschau-Seite mit vollständiger Filterleiste
- `TaskFilterBar` (Search, Cognitive-Type, Difficulty-Filter)
- `TaskPreviewCard` — komponiert aus `TaskMetaRow` + `TaskPedagogyAccordion`
- `TaskQuestionBlock` mit Cognitive-Hero + Sub-Task-Split
- Asset-Upload-Pipeline (Supabase Storage + RLS + UI)
- `MathContent` rendert Markdown + LaTeX

**Migrationen (manuell ausgeführt):**
- Migration 005 `diagnostic_fields.sql` — `tasks.cognitive_type`, `input_type`, `is_diagnostic`, `curriculum_ref`, `question_payload`, `typical_errors`; `microskills.cognitive_type`, `estimated_minutes`, `curriculum_ref`
- Migration 006 `remove_serlo.sql` — alle `serlo_*`-Spalten entfernt, Serlo-Tasks gelöscht
- Migration 007 `task_source.sql` — `tasks.source` (NOT NULL, default `'unbekannt'`), `tasks.source_ref`, UNIQUE-Index `(source, source_ref)` (partial WHERE source_ref IS NOT NULL)
- Migration 008 — Partial Unique Index durch echten Constraint ersetzt

**Entscheidungen:**
- `source` mit Default `'unbekannt'`: Macht `ALTER ADD NOT NULL` sauber, auffälliger Wert bei manuellen Inserts ohne Quelle
- `source_ref` als Partial-Unique-Index (nicht NOT NULL): Manuell angelegte Aufgaben ohne Buchreferenz bleiben erlaubt
- `schema_content.sql` als kumulativer Snapshot (kein Migrations-Ersatz): Migrationen bleiben als Audit-Trail, `schema_content.sql` spiegelt Realstand für Greenfield + Lese-Referenz

---

### M4 — Asset-Generator (2026-05-14)
**Branch:** `feature/asset-generator`
**PR:** #13

Anthropic-API-basierter Asset-Generator für automatische Bild-Beschreibungen und Canva-Prompts.

**Was gebaut wurde:**
- `scripts/generate-assets.ts` — generiert Bild-Altexte und pädagogische Beschreibungen via Anthropic-API
- `scripts/canva-prompts/` — Magic-Media-Prompts für Lambacher 8 NRW (kontextuelle Farben statt Edvance-Pflichtpalette)

---

### M5 — Task-Input-Widgets (2026-05-15)
**Branch:** `feature/task-input-widgets`
**PR:** #14

Interaktive Antwort-Widgets für den Schüler-Task-Player.

**Was gebaut wurde:**
- `src/pages/student/TaskPlayer.tsx` — zentraler Task-Player
- `TaskAnswerArea` (in `src/components/edvance/tasks/`) mit vier Eingabe-Modi:
  - **MC** — Multiple Choice
  - **Matching** — Zuordnungsaufgaben
  - **Steps** — Schrittweise Lösungseingabe
  - **DRAW** — Freihand-Zeichnung (`DrawCanvas.tsx`)
- `src/pages/student/TaskWidgetDemo.tsx` → Route `/demo/widgets` (ohne Login erreichbar)
- `MathToolbar.tsx` für mathematische Sonderzeichen

**Edvance-Regel:** Korrekt/Falsch-Feedback ist in Schüler-Views verboten — die Widgets zeigen nur positives oder neutrales Feedback (CLAUDE.md §6, §11).

---

### M6 — Design-System Premium (2026-05-15)
**Branch:** `feature/design-system-premium`
**PR:** #15

Vollständige Token-Schicht, UI-Primitives, Premium-Polish auf Kern-Screens und interaktiver Design-Showcase.

**Was gebaut wurde:**

Design-System-Foundation:
- `src/styles/tokens.css` — alle CSS-Custom-Properties (Farben, Gradienten, Shadows, Typografie)
- `src/styles/globals.css` — `@theme inline` Mapping für Tailwind v4, Utility-Klassen, Screen-spezifische Regeln
- Tailwind v4 `@theme inline`-Integration: Design-Token direkt als Tailwind-Klassen nutzbar

Komponenten (in `src/components/edvance/`):
- `EdvanceCard` mit Varianten (Standard, Navy, Elevated)
- `EdvanceBadge` mit Varianten (xp, success, warning, danger, info — erweiterbar)
- `StatCard` für Metriken/KPIs
- `MasteryBar` für Fortschrittsanzeige
- `XPBar` mit Gamification-Animation
- `LoadingPulse` (Skeleton-Loader)
- `EmptyState` mit einladenden Texten
- `ToastBanner` mit Typen (xp, success, warning)
- `AvatarInitials` für personalisierte Avatare

Premium-Polish (`94daed1`):
- Coach-Dashboard: Navy-Header, weiße Cards, Datenhierarchie
- Student-Dashboard: große Touch-Targets, Gamification-Elemente
- Animationsklassen: `animate-bounce-pop`, `animate-fade-in`, `animate-scale-in`, `animate-xp-pulse`, `animate-skeleton`

Design-Showcase (`4099f0a`):
- `src/pages/DesignShowcase.tsx` — vollständiger Showcase aller Komponenten
- `src/pages/demo/DesignDemo.tsx` → Route `/demo/design` mit 5 Live-Szenarien:
  - `ScenarioStudent.tsx` — Schüler-Tablet-View
  - `ScenarioCoach.tsx` — Coach-Dashboard-Ausschnitt
  - `ScenarioCelebration.tsx` — Level-Up/XP-Momente
  - `ScenarioSessionEnd.tsx` — Session-Abschluss
  - `ScenarioUIKit.tsx` — Alle UI-Primitives

---

### M7 — Real-Data-Programm (2026-05-16/17)
**Branch:** `feature/real-data-program`
**PRs:** #16 (Feature auf `main`), #17 (Sync nach `dev`)
**Retro:** `docs/retros/2026-05-16-real-data-program.md`

Die größte Einzelsession: vollständige Mock-Entfernung, 11 neue Datenbank-Migrationen, vollständiger Supabase-Lib-Layer, Edge Function und UI für End-to-End-Flow.

**Was gebaut wurde — Schema-Migrationen (011–021):**

| Migration | Datei | Inhalt |
|---|---|---|
| 011 | `011_students_rls_fix.sql` | RLS-Fix für `students`/`parent_student`/`student_subjects` (waren policy-los = default-deny) + Security-Definer-Helper `get_my_student_id()`, `is_parent_of_student()` |
| 012 | `012_leads.sql` | `leads`-Tabelle (Erstgespräch Stufe A — Lead/Erstkontakt vor Account) |
| 013 | `013_intake_sessions.sql` | `intake_sessions` (strukturiertes Erstgespräch-Protokoll am Schüler) |
| 014 | `014_screening.sql` | `screening_tests` + append-only `screening_ratings` + `behavior_snapshots.screening_test_id` |
| 015 | `015_tiers_subscriptions.sql` | `tiers`-Katalog + `student_subscriptions` |
| 016 | `016_student_coach.sql` | Schüler↔Coach-Zuordnung |
| 017 | `017_coaching_sessions.sql` | `coaching_sessions` + `session_students` (ersetzt `MOCK_SESSIONS`) |
| 018 | `018_student_task_progress.sql` | `student_task_progress` (ersetzt localStorage) |
| 019 | `019_gamification.sql` | `student_progress` + append-only `xp_events` + Trigger `apply_xp_event` |
| 020 | `020_parent_reports.sql` | `parent_reports` (draft/published) |
| 021 | `021_provision_student_fn.sql` | Atomare RPC `app_provision_student` (SECURITY DEFINER, nur service_role) |

**Was gebaut wurde — Lib-Layer (`src/lib/supabase/`):**
Jede Datei gibt `SupabaseResult<T>` zurück und hat `try/catch`. Kein Supabase-Aufruf außerhalb von `src/lib/`.

| Datei | Verantwortung |
|---|---|
| `client.ts` | Supabase-Client-Singleton |
| `auth.ts` | Login, Logout, Session |
| `profiles.ts` | Profil + `getCoaches()` |
| `students.ts` | Schüler-CRUD + Fach-Mapping + `listStudentsWithName` |
| `leads.ts` | Lead-CRUD + Status-Workflow |
| `intake.ts` | Erstgespräch-Protokoll (draft→final) |
| `subscriptions.ts` | Tarif-Abos |
| `tiers.ts` | Tarif-Katalog |
| `studentCoach.ts` | Coach-Zuordnung |
| `screening.ts` | Diagnose-/Screening-Tests |
| `screeningRatings.ts` | Coach-Bewertungen (append-only) |
| `behavior.ts` | BehaviorSnapshots (append-only, `screening_test_id`) |
| `sessions.ts` | Coaching-Sessions + Anwesenheit |
| `taskProgress.ts` | Aufgaben-Fortschritt |
| `progress.ts` | XP + Streak (via `xp_events`) |
| `parentReports.ts` | Elternreporte |
| `provision.ts` | Edge-Function-Wrapper (kein Direkt-Aufruf aus Komponenten) |
| `storage.ts` | Supabase-Storage für Aufgaben-Bilder |
| `tasks.ts` | Task-CRUD inkl. `updateTaskDiagnostic`, `createDiagnosticTask` |

**Was gebaut wurde — Edge Function:**
- `supabase/functions/provision_student/index.ts` (Deno, service-role)
- Ablauf: Auth-User anlegen (Schüler + optionaler Eltern-Invite) → RPC `app_provision_student` → Cleanup bei Fehler (atomar)

**Was gebaut wurde — UI / Mock-Entfernung:**

| Schritt | Was entfernt / was ersetzt |
|---|---|
| U1 | `MOCK_COACHES` → `getCoaches()` |
| U2 | `/admin/leads` — Lead-Erfassung + Liste + Status-Workflow |
| U3 | `/coach/intake` — Erstgespräch-Protokoll, draft→final |
| U4 | AdminDashboard + LeadsPage → `provisionStudent()` (Edge Function) |
| U5a | Diagnose-Engine auf echten Generator (Context + Session) |
| U5b | `DiagnosisResult` de-mockt, `mockDiagnosisTasks.ts` gelöscht |
| U5c | `/screening` DB-gestützt + DB-Resume; `localStorage` aus `DiagnosisContext` entfernt |
| U6 | `TIERS`-Konstante raus → DB-Katalog; `/admin/tiers` Tarif-Verwaltung |
| U7 | `CoachDashboard` echte Sessions/Anwesenheit; `mockData.ts` gelöscht |
| U8 | `ClusterView`-Fortschritt aus `student_task_progress` |
| U9 | `StudentDashboard` XP/Streak aus `student_progress` |
| U10 | `ParentDashboard` echte Kind-Daten + Reports |

Zusätzlich (`17e8156`, `0c30186`):
- `/admin/diagnostics` — Admin-Seeding-Oberfläche für Diagnostik-Content
- Schnellzugriff-Kacheln für Schüler-/Coach-/Eltern-Dashboard (`DashboardTiles.tsx`)

**Entscheidungen:**
- Append-only strikt: Coach-Rating als separate `screening_ratings`-Tabelle (nicht per `UPDATE` auf `behavior_snapshots`)
- Nicht-rekursive RLS über Security-Definer-Helper statt Inline-Joins (verhindert Policy-Rekursion)
- Lead→Schüler-Conversion atomar in `plpgsql`-RPC; Edge Function nur für Auth-User-Anlage (Client hat nur `anon`-Key)
- `jsonb` statt Normalisierung für `generated_test`/`result_summary` (Flexibilität bei Schema-Drift)
- `ThemeContext` bleibt bewusst `localStorage` (rein kosmetisch, kein Sicherheitsrisiko)
- PR #16 mit Base `main` statt `dev` (Abweichung von CLAUDE.md §5; explizite Entscheidung Rasit)
- Korrekter Check ist `npm run lint` (`tsc -b`), nicht `npx tsc --noEmit` (Solution-tsconfig hat `files:[]`)

---

### M8 — Brand-System + Level-Up Farbsystem-Feinschliff (2026-05-17)
**Branch:** `feature/levelup-tuerkis`
**PR:** #18
**Retro:** `docs/retros/2026-05-17-farbsystem-feinschliff.md`

**Was gebaut wurde:**

Wordmark + Logo (`9051995`, `3cf2c29`):
- `EdvanceLogo.tsx` — echtes Edvance-Logo aus Design-Handoff eingebunden
- Wordmark in `EdvanceNavbar` (Space Grotesk Webfont)

P1 — Tokens (`bb7af96`):
- `--color-levelup: #0E9E96` (UI/Badge), `--color-moment-levelup: #19C9BC` (leuchtend auf Navy)
- `--color-levelup-on: #04302D` (Text-On, WCAG-AA)
- `--gradient-levelup: linear-gradient(135deg, #1FD3C6 0%, #0B8B85 100%)`
- `--shadow-glow-levelup`
- `--color-moment-repair: #8B5CF6` (Lila für Streak-Repair) + `--color-moment-repair-on: #FFFFFF`
- `--gradient-repair: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`
- `--color-accent-light: #FBEAD0` (XP-Badge-BG)
- Legacy-Aliases vereinheitlicht: `--xp-gold` → `var(--color-accent)`, `--xp-gold-light` → `var(--color-accent-light)`, `--level-purple` → `var(--color-moment-repair)`
- Tailwind-Utilities: `.bg-gradient-levelup`, `.bg-gradient-repair`, `.shadow-glow-levelup`

P2 — Consumer-Komponenten (`4c921ec`):
- `ScenarioCelebration` — Level-Badge nutzt `--gradient-levelup` + `--shadow-glow-levelup` auf Navy
- `EdvanceBadge` — neue Varianten `levelup` (Türkis) und `repair` (Lila)
- `ToastBanner` — neuer Typ `levelup` (`.toast-levelup` Türkis-Gradient)
- `XPBar` — nutzt vereinheitlichtes Gold automatisch via P1

P3 — Showcase/Dokumentation (`401ad6c`):
- `DesignShowcase` — neue Gruppe "Emotionale Momente" (Level-Up, Moment-Levelup, Repair, Boss-Grün, Streak-Rot, Moment-Bühne)
- `/demo/design` Level-Up-Tab zeigt Türkis via `ScenarioCelebration`

---

## 3. Technische Entscheidungen

### Architektur: Lib-Layer-Prinzip
Alle Supabase-Aufrufe ausschließlich in `src/lib/supabase/`. Keine `supabase.from()` in Komponenten oder Pages. Gründe: Testbarkeit, Single Point of Change bei Schema-Änderungen, Verhinderung von Policy-Fehlern durch versehentliche Client-Side-Queries.

### RLS-First
Jede neue Tabelle bekommt sofort RLS + Policies. Security-Definer-Helper (`get_my_role()`, `get_my_student_id()`, `is_parent_of_student()`) lösen das PostgreSQL-Problem der rekursiven RLS-Policies (Inline-Join auf `profiles` aus einer `profiles`-Policy würde rekursiv werden).

### Mock-First → Echtdaten
Bewusstes Mock-First-Vorgehen in der frühen Phase (M0–M2): schnelle UI-Iteration ohne DB-Abhängigkeit. Im Real-Data-Programm (M7) vollständige Entfernung aller Mocks — kein `mock`/`MOCK_`-Runtime-Treffer mehr nach dem Merge.

### Append-Only für Verhaltensdaten
`behavior_snapshots`, `screening_ratings` und `xp_events` sind append-only (kein `UPDATE`, kein `DELETE`). Begründung: Diagnostische Rohdaten dürfen nicht rückwirkend verändert werden (pädagogische Integrität, Audit-Trail). Coach-Bewertungen als separate `screening_ratings`-Tabelle statt `UPDATE` auf `behavior_snapshots`.

### Edge Function für Provisioning
Die Lead→Schüler-Conversion erfordert Auth-User-Anlage, die den `service_role`-Key benötigt. Dieser darf nie im Frontend sein. Lösung: Deno Edge Function `provision_student` mit `service_role`-Key, aufgerufen via `src/lib/supabase/provision.ts`. Die plpgsql-RPC `app_provision_student` (Migration 021) übernimmt die DB-Transaktion atomar mit Cleanup bei Fehler.

### `jsonb` für generierte Test-Daten
`screening_tests.generated_test` und `result_summary` als `jsonb` statt normalisierter Tabellen. Begründung: Der Diagnose-Generator kann sein Output-Format weiterentwickeln, ohne DB-Migrationen. Der `rebuildRunTasks()`-Algorithmus rekonstruiert den Testablauf deterministisch aus `generated_test` + Snapshots + Ratings für DB-Resume.

### localStorage-Eliminierung
`DiagnosisContext` nutzte localStorage für Session-Persistenz. Nach M7 vollständig entfernt (DB-Resume). Einziger verbleibender localStorage-Einsatz: `ThemeContext` (kosmetisch, bewusst beibehalten).

### Tailwind v4 `@theme inline`
Design-Token aus `tokens.css` werden via `@theme inline` in `globals.css` als Tailwind-Utility-Klassen verfügbar gemacht (z.B. `bg-gradient-levelup`, `shadow-glow-levelup`). Keine Tailwind-Config-Datei notwendig für Custom-Token.

---

## 4. Design-System-Status

### Token-Gruppen (`src/styles/tokens.css`)

| Gruppe | Beschreibung |
|---|---|
| Marke | `--color-primary`, `--color-primary-dark`, `--color-primary-light` (Navy-Palette) |
| Interaktiv | `--color-interactive`, `--color-interactive-hover` |
| Accent/XP | `--color-accent` (#E8A020 Gold), `--color-accent-light` (#FBEAD0), `--color-accent-celebration` |
| Feedback | `--color-success`, `--color-warning`, `--color-destructive` |
| Gamification-Momente | `--color-moment-gold`, `-green`, `-red`, `-bg` (Navy) |
| Level-Up (PR #18) | `--color-levelup` (#0E9E96), `--color-moment-levelup` (#19C9BC), `--color-levelup-on` (#04302D) |
| Streak-Repair (PR #18) | `--color-moment-repair` (#8B5CF6), `--color-moment-repair-on` (#FFFFFF) |
| Gradienten | `--gradient-primary`, `--gradient-levelup`, `--gradient-repair` |
| Shadows | `--shadow-card`, `--shadow-elevation-md`, `--shadow-elevation-lg`, `--shadow-glow-levelup` |
| Typografie | `--text-primary`, `--text-secondary`, `--text-muted` |
| Oberflächen | `--surface-card`, `--surface-elevated`, `--border-subtle` |

### Gamification Moment-Mapping (Single Source: `tokens.css`)

| Moment | Token | Farbe |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` (= `--xp-gold`) | Gold #E8A020 |
| Level-Up (Meilenstein) | `--color-levelup` / `--color-moment-levelup` + `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün auf Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

### Komponenten-Bibliothek (`src/components/edvance/`)

| Komponente | Status | Beschreibung |
|---|---|---|
| `EdvanceCard` | ✅ | Basis-Card mit Varianten (Standard, Navy, Elevated) |
| `EdvanceNavbar` | ✅ | Gemeinsame Navbar mit Logo + Wordmark |
| `EdvanceBadge` | ✅ | Status-Badges inkl. `levelup`, `repair` |
| `StatCard` | ✅ | Metriken-Kachel |
| `MasteryBar` | ✅ | Fortschrittsbalken |
| `XPBar` | ✅ | XP-Anzeige mit Gamification-Animation |
| `LoadingPulse` | ✅ | Skeleton-Loader |
| `EmptyState` | ✅ | Einladender Leer-Zustand |
| `ToastBanner` | ✅ | Typen: xp, success, warning, levelup |
| `AvatarInitials` | ✅ | Persönlicher Avatar |
| `DashboardTiles` | ✅ | Schnellzugriff-Kacheln für alle Dashboards |
| `ProtectedRoute` | ✅ | Rollen-basierter Routen-Guard |
| `DrawCanvas` | ✅ | Freihand-Zeichenfläche |
| `MathToolbar` | ✅ | Sonderzeichen für mathematische Eingabe |
| Task-Widgets | ✅ | MC, Matching, Steps, DRAW (in `tasks/`) |
| `EdvanceLogo` | ✅ | Echtes Logo aus Design-Handoff |
| Onboarding-Steps | ✅ | 5 Wizard-Steps (in `onboarding/`) |

### Animationsklassen

| Klasse | Einsatz |
|---|---|
| `animate-bounce-pop` | XP-Zähler, Level-Ups, Erfolge |
| `animate-fade-in` | EmptyState, Modal-Content |
| `animate-scale-in` | Neue Cards, Popups |
| `animate-xp-pulse` | XP-Zähler während Pulse |
| `animate-skeleton` | LoadingPulse (automatisch) |

### Shadow-Hierarchie

| Kontext | Utility |
|---|---|
| Ruhende Cards | `shadow-card` |
| Hover | `shadow-elevation-md` |
| Floating (Modals, Toasts) | `shadow-elevation-lg` |
| Level-Up Glow | `shadow-glow-levelup` |
| Eingebettet | kein Shadow |

---

## 5. Datenbankschema-Übersicht

### Initiales Schema (`schema.sql`)
- `profiles` — id, email, role, full_name, created_at
- `students` — id, profile_id, class_level, school_name, school_type
- `parent_student` — parent_id, student_id

### Content-Schema (`schema_content.sql`, Stand: Migration 007+)
- `subjects` — id, name
- `skill_clusters` — id, subject_id, name, class_level_min, class_level_max, sort_order
- `microskills` — id, cluster_id, code, name, description, class_level, prerequisite_ids[], sort_order, cognitive_type, estimated_minutes, curriculum_ref
- `tasks` — id, microskill_id, cluster_id, content_type, title, question, solution, hint, common_errors, coach_note, difficulty, estimated_minutes, class_level, is_active, cognitive_type, input_type, is_diagnostic, curriculum_ref, question_payload, typical_errors[], source, source_ref
- `task_coach_metadata` — id, task_id, typical_errors, observation_hints, intervention_triggers, updated_at

### Migrationen (Audit-Trail)

| Nr. | Datei | Zweck |
|---|---|---|
| 001 | `001_competency_areas.sql` | Cluster auf 5 KMK-Kompetenzbereiche |
| 003 | `003_behavior_snapshots.sql` | `behavior_snapshots` append-only |
| 005 | `005_diagnostic_fields.sql` | Diagnostik-Felder auf `tasks` + `microskills` |
| 006 | `006_remove_serlo.sql` | Serlo-Spalten + Daten entfernt |
| 007 | `007_task_source.sql` | `tasks.source` + `tasks.source_ref` + UNIQUE-Index |
| 008 | *(ohne Name)* | Partial Unique Index → echter Constraint |
| 011 | `011_students_rls_fix.sql` | RLS-Fix `students`/`parent_student`/`student_subjects` + Security-Definer-Helper |
| 012 | `012_leads.sql` | `leads` (Erstgespräch Stufe A) |
| 013 | `013_intake_sessions.sql` | `intake_sessions` (Erstgespräch Stufe B) |
| 014 | `014_screening.sql` | `screening_tests` + `screening_ratings` + `behavior_snapshots.screening_test_id` |
| 015 | `015_tiers_subscriptions.sql` | `tiers` + `student_subscriptions` |
| 016 | `016_student_coach.sql` | Schüler↔Coach-Zuordnung |
| 017 | `017_coaching_sessions.sql` | `coaching_sessions` + `session_students` |
| 018 | `018_student_task_progress.sql` | `student_task_progress` |
| 019 | `019_gamification.sql` | `student_progress` + `xp_events` + Trigger |
| 020 | `020_parent_reports.sql` | `parent_reports` |
| 021 | `021_provision_student_fn.sql` | RPC `app_provision_student` (SECURITY DEFINER) |

*Migrationen 002, 004, 009, 010 sind in dieser Dokumentation nicht explizit aufgeführt — entweder frühe Zwischenschritte oder nicht im SCHEMA.md dokumentiert.*

### Rollen-Hierarchie
`admin > coach > parent > student`

### RLS-Kernregeln
- Jede Tabelle hat RLS aktiviert
- Admins und Coaches sehen (fast) alles
- Eltern sehen nur eigene Kinder (via `parent_student`)
- Schüler sehen nur sich selbst
- `behavior_snapshots`, `screening_ratings`, `xp_events` — append-only, kein UPDATE/DELETE
- `student_progress` — read-only für Clients, Schreiben nur via Security-Definer-Trigger `apply_xp_event`
- `app_provision_student` RPC — SECURITY DEFINER, nur via Edge Function mit service_role

---

## 6. Routen-Übersicht

| Route | Zugriff | Seite |
|---|---|---|
| `/` | → `/login` | — |
| `/login` | öffentlich | `Login.tsx` |
| `/student` | student | `StudentDashboard.tsx` |
| `/student/cluster/:id` | student | `ClusterView.tsx` |
| `/student/task/:id` | student | `TaskPlayer.tsx` |
| `/coach` | coach | `CoachDashboard.tsx` |
| `/coach/intake` | coach | `IntakePage.tsx` |
| `/diagnosis` | student/coach | `DiagnosisSession.tsx` |
| `/diagnosis/result` | student/coach | `DiagnosisResult.tsx` |
| `/screening` | student | `DiagnosisSession.tsx` (DB-gestützt) |
| `/parent` | parent | `ParentDashboard.tsx` |
| `/admin` | admin | `AdminDashboard.tsx` |
| `/admin/leads` | admin | `LeadsPage.tsx` |
| `/admin/tiers` | admin | `TiersPage.tsx` |
| `/admin/content` | admin | `LambacherPreview.tsx` |
| `/admin/diagnostics` | admin | `DiagnosticsPage.tsx` |
| `/demo/widgets` | öffentlich | `TaskWidgetDemo.tsx` |
| `/demo/design` | öffentlich | `DesignDemo.tsx` |
| `/showcase` | öffentlich | `DesignShowcase.tsx` |
| `*` | → `/login` | — |

---

## 7. Offene Punkte

| Priorität | Punkt | Detail |
|---|---|---|
| P0 | Diagnostik-Content seeden | `tasks.is_diagnostic=true` fehlt → `/screening` zeigt EmptyState. `/admin/diagnostics` ist die UI dafür. |
| P0 | Browser-Verifikation durch Rasit | U4 (Lead→Schüler-Conversion), `/screening`-Flow, Schnellzugriff-Kacheln — kein Browser-Test seit dem Merge |
| P1 | PR #16 Base-Branch-Klärung | Feature-Branch hatte `main` statt `dev` als Base (Abweichung CLAUDE.md §5). Bereits gemergt — für Folgeprojekte klären. |
| P1 | Mathebuch-Content-Drop | `scripts/import/raw/lambacher-8-nrw/` ist leer — erster Import steht aus. Owner, Kapitelauswahl und Deadline noch nicht definiert. |
| P2 | Level-Up/Repair-Flows vollständig | Token und Badges sind vorbereitet; eigentliche UI-Flows (Streak-Repair-Screen, Boss-Gradient) sind separater Schritt |
| P2 | Türkis/Repair WCAG-AA-Verifikation | Hexwerte kalibriert aber noch nicht final durch `contrast-checker` oder `/showcase` visuell bestätigt |
| P2 | Home-Quest Flow | In ROADMAP erwähnt, noch nicht begonnen |
| P2 | Realtime-Sync | `/screening` hat nach DB-Umstieg keinen Cross-Tab-Sync mehr (vorher localStorage). Supabase Realtime = eigener Schritt |
| P3 | ESLint-Setup fehlt | Kein `noUnusedImports`-Enforcement. Manuelle Disziplin im Moment ausreichend. |
| P3 | `schema_content.sql` vs. `schema.sql` Konsolidierung | `subjects`-Definition in beiden Dateien (Duplikat mit Warnung). |
| P3 | Zombie-Feature-Branches | `content-schema`, `diagnosis-engine`, `diagnostic-engine`, `student-learning-path` — alle in `dev` integriert, nur Pointer-Cleanup nötig |

---

## 8. Technische Schulden / Risiken

### Schulden

| Bereich | Schuld | Eingetragen |
|---|---|---|
| Inline-Styles | Pre-existing `color-mix()` und Linear-Gradient Inline-Styles in einigen Pages — bewusst nicht entfernt (Retro 2026-05-08). Müssen auf Tailwind v4 `@theme inline` Custom-Utility-Klassen migriert werden. | M1 |
| `globals.css` Größe | `src/styles/globals.css` hat 356 Zeilen (Limit: 400). Bald Refactor nötig. | M6 |
| Zwei-Geräte-Flow | Schüler-Tablet + Coach haben im DB-Modus keinen Cross-Tab-Sync (vorher localStorage). Realtime-Anbindung fehlt. | M7 |
| Diagnostik-Content | `/screening` zeigt EmptyState bis Rasit `is_diagnostic=true`-Tasks manuell seedet. Keine automatische Lösung. | M7 |

### Risiken

| Risiko | Wahrscheinlichkeit | Maßnahme |
|---|---|---|
| `app_provision_student` RPC läuft mit SECURITY DEFINER — Fehler in der Funktion könnten ohne vollständiges Cleanup Halb-Zustände erzeugen | Niedrig (Cleanup-Logik implementiert) | Bei Änderungen: Rasit eskalieren (Auth/RLS-Regel) |
| `screening_tests` ist 1 aktiver Test pro (Schüler, Fach) — keine Versionierung. Wenn Generator sich ändert, kann DB-Resume inkonsistent werden | Mittel | `generated_test_version` Feld vorbereitet; `rebuildRunTasks` deterministisch |
| `jsonb`-Felder (`generated_test`, `result_summary`) ohne Schema-Validierung | Mittel | TypeScript-Typen in `src/lib/supabase/screening.ts` als Kompensation |
| PR #16 wurde auf `main` gebased, nicht `dev` | Einmalig passiert, gemergt | Für Folge-PRs konsequent CLAUDE.md §5 einhalten |

---

## 9. Verzeichnisstruktur (Stand 2026-05-22)

```
src/
  components/
    edvance/          Eigene Komponenten (EdvanceCard, Badges, Widgets, ...)
      onboarding/     Wizard-Steps (5 Schritte)
      tasks/          Task-Input-Widgets
    ui/               shadcn/ui (Button, Card, Input, ...)
  context/            AuthContext, DiagnosisContext, ThemeContext
  hooks/              useAuth, useTheme (Re-Exports)
  lib/
    supabase/         Alle Supabase-Aufrufe (19 Dateien)
    diagnostic/       Diagnose-Generator
    render/           MathContent (Markdown + LaTeX)
    screening/        Screening-Logik
    taxonomy/         NRW-Klasse-8-Taxonomie (JSON)
    behaviorAnalysis.ts
    utils.ts
  pages/
    admin/            AdminDashboard, LeadsPage, TiersPage, LambacherPreview, DiagnosticsPage
    coach/            CoachDashboard, IntakePage
    demo/             DesignDemo, Scenario-Seiten, TaskWidgetDemo
    parent/           ParentDashboard
    student/          StudentDashboard, ClusterView, TaskPlayer, TaskWidgetDemo
    DesignShowcase.tsx, DiagnosisSession.tsx, DiagnosisResult.tsx, Login.tsx
  styles/
    tokens.css        CSS-Custom-Properties (89 Zeilen)
    globals.css       @theme inline + Utilities (356 Zeilen)
  types/index.ts      Zentraler Type-Hub
  App.tsx
scripts/
  generate-assets.ts  Anthropic-API Asset-Generator
  import/
    lambacher.ts      Mathebuch-Importer (idempotent)
    PLUGIN_BRIEFING.md
  mark-diagnostic.ts
  seed-clusters.ts
  seed-taxonomy.ts
  canva-prompts/
supabase/
  functions/
    provision_student/index.ts  Deno Edge Function
docs/
  PRODUCT.md
  PROCESSES.md
  SCHEMA.md
  ROADMAP.md
  retros/
```
