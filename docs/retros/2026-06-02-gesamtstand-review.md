# Retro 2026-06-02 — Gesamtstand-Review (alle PRs bis heute)

Erstellt: 02.06.2026 | Branch zur Erstellung: `claude/sweet-ramanujan-U16Pu`

---

## Was gebaut wurde (kumulativ, alle Phasen)

### Phase 1 — Fundament & Diagnose-Engine
- Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui Setup
- Supabase Auth mit Rollen (`student | parent | coach | admin`)
- `ProtectedRoute`-Muster, kein manueller Rollen-Check in Pages
- Aufgaben-Schema (Migrations 001–010): `competency_areas`, `tasks`, `behavior_snapshots`, `task_assets`, Storage-RLS
- NRW Klasse 8 Mathe Taxonomie (`src/lib/taxonomy/nrw_math_klasse8.json`)
- Diagnostik-Generator (`src/lib/diagnostic/generator.ts`, `coverageReporter.ts`)
- Serlo-Import-Versuch → Migration 006 entfernte Serlo wieder komplett
- Mathebuch-Import-Pipeline (`scripts/import/lambacher.ts`) für Lambacher Schweizer 8 NRW

### Phase 2 — Design-System v1 (PR #15)
- Token-System: `src/styles/tokens.css` + `src/styles/globals.css`
- UI-Primitives: EdvanceCard, MasteryBar, XPBar, StatCard, EdvanceBadge, EmptyState, LoadingPulse, ToastBanner
- Demo-Scope: `/demo/design`, `/demo/widgets`, 5 Szenarien (Student, Coach, Celebration, Session-End, UIKit)
- shadcn-Komponenten (Badge, Button, Card) an Edvance-Token angebunden

### Phase 3 — Task-Widgets (PR #14)
- `MCWidget` (Multiple Choice), `MatchingWidget` (Zuordnung), `StepsWidget`, `DrawCanvas`
- `TaskAnswerArea` als Orchestrator, `TaskQuestionBlock` mit Cognitive-Hero
- `TaskFilterBar` (Suche, Cognitive, Difficulty), `TaskPreviewCard`, `TaskMetaRow`, `TaskPedagogyAccordion`
- `/demo/widgets`-Route ohne Login zugänglich

### Phase 4 — Real-Data-Programm (PR #16 + #17)
**Schema (Migrations 011–021, Supabase SQL Editor):**
| Migration | Inhalt |
|---|---|
| 011 | RLS-Fix `students`/`parent_student`/`student_subjects`, Security-Definer-Helper |
| 012 | `leads` |
| 013 | `intake_sessions` |
| 014 | `screening_tests` + append-only `screening_ratings` |
| 015 | `tiers` + `student_subscriptions` |
| 016 | `student_coach` |
| 017 | `coaching_sessions` + `session_students` |
| 018 | `student_task_progress` |
| 019 | `student_progress` + append-only `xp_events` + Trigger `apply_xp_event` |
| 020 | `parent_reports` |
| 021 | Atomare RPC `app_provision_student` (SECURITY DEFINER, nur service_role) |

**Lib-Layer (`src/lib/supabase/`) — alle mit `SupabaseResult<T>` + try/catch:**
`leads`, `students`, `intake`, `subscriptions`, `tiers`, `studentCoach`, `screening`, `screeningRatings`, `sessions`, `taskProgress`, `progress`, `parentReports`, `provision`, `behavior`, `storage`, `profiles`

**Edge Function** `supabase/functions/provision_student`: auth-User-Anlage (Schüler + Eltern-Invite) → RPC 021 → Cleanup bei Fehler

**Mock-Entfernung (U1–U10):**
- `MOCK_COACHES`, `MOCK_SESSIONS`, `mockDiagnosisTasks.ts`, `mockData.ts` komplett gelöscht
- `DiagnosisContext` ohne localStorage (nur ThemeContext bleibt kosmetisch)
- Screening `/screening` DB-gestützt mit DB-Resume

**Neue UI-Seiten:**
- `/admin/leads` — Lead-Erfassung + Status-Workflow
- `/coach/intake` — Erstgespräch-Protokoll (draft → final)
- `/admin/tiers` — Tarif-Verwaltung aus DB
- `/admin/diagnostics` — manuelles Seeding-Interface
- `/student/cluster/:id` — ClusterView aus `student_task_progress`
- `/student/tasks/:id` — TaskPlayer
- Schnellzugriff-Kacheln (`DashboardTiles`) auf alle drei Rollen-Dashboards

### Phase 5 — Brand-System (PR #18)
**Logo-Assets:**
- `public/brand/edvance-logo-light.svg`, `edvance-logo-dark.svg`, `edvance-symbol.svg`
- `public/brand/edvance-app-icon.svg`, `edvance-favicon.svg`
- `public/favicon.svg` aktualisiert; `index.html` mit Favicon + Apple-Touch-Icon

**Komponente `src/components/brand/EdvanceLogo.tsx`:**
- Varianten: `wordmark` (Logo + Schrift), `symbol` (nur Icon), `inline` (kompakt)
- Modi: `light`, `dark`, `auto` (passt sich `prefers-color-scheme` an)
- Größen: `sm/md/lg/xl`, Animationsoption `animate`
- Eingebunden in `EdvanceNavbar`, `Login`-Seite, `ScenarioCelebration`

**Level-Up Türkis-Tokens (tokens.css, globals.css):**
> ⚠️ **Veraltet** — Design-System-v2-Entscheidung vom 27.05.2026 streicht Türkis.
> Diese Tokens sind im Code vorhanden, sollen in der v2-Migration ersetzt werden.
- `--color-levelup #0E9E96`, `--color-moment-levelup #19C9BC`
- `--gradient-levelup`, `--shadow-glow-levelup`
- `--color-moment-repair #8B5CF6` (v2: `#7B5EA7`)
- `EdvanceBadge` `levelup`/`repair`-Varianten, `ToastBanner` `levelup`-Typ

---

## Architektur-Entscheidungen (dokumentiert)

| Entscheidung | Begründung |
|---|---|
| Supabase statt Moodle | RLS, Echtzeit, Auth out-of-the-box; schnellerer Dev-Cycle |
| `SupabaseResult<T>` in allen Lib-Funktionen | Einheitliches Error-Handling, kein unbehandelter throw |
| Security-Definer-Helper statt Inline-RLS-Joins | Performance + Nicht-rekursivität für `is_parent_of_student()` |
| `app_provision_student` als atomare plpgsql-RPC | Edge Function hat nur anon-Key; service-role-Logik im Backend |
| Append-only für `xp_events`, `screening_ratings`, `behavior_snapshots` | Audit-Trail, keine Datenmanipulation möglich |
| jsonb statt Normalisierung für `generated_test`/`result_summary` | Flexibilität bei wechselnden Test-Strukturen |
| `tsc -b` (nicht `--noEmit`) als TypeScript-Prüfung | Solution-tsconfig hat `files: []`, `--noEmit` funktioniert nicht korrekt |
| Serlo entfernt (Migration 006) | Import-Qualität unzureichend; Lambacher-Buchimport als Ersatz |
| ThemeContext bleibt localStorage | Kosmetisch, kein Sicherheitsrisiko, kein Datenverlust |
| Design-System v2 Big Bang statt Migration | Beschlossen 27.05.2026; keine Legacy-Aliase, sauberer Cut |

---

## Seiten-Übersicht (aktueller Status)

| Seite | Route | Status | Anmerkung |
|---|---|---|---|
| Login | `/login` | Produktionsbereit | EdvanceLogo eingebunden |
| AdminDashboard | `/admin` | Produktionsbereit | Echtdaten, DashboardTiles |
| LeadsPage | `/admin/leads` | Produktionsbereit | CRUD + Status-Workflow |
| TiersPage | `/admin/tiers` | Produktionsbereit | DB-Katalog |
| DiagnosticsPage | `/admin/diagnostics` | Dev-Tool | Nur für manuelles Seeding |
| LambacherPreview | `/admin/lambacher` | Dev-Tool | Buchimport-Vorschau |
| CoachDashboard | `/coach` | Produktionsbereit | Echtdaten, Sessions |
| IntakePage | `/coach/intake` | Produktionsbereit | draft → final |
| StudentDashboard | `/student` | Produktionsbereit | XP/Streak aus DB |
| ClusterView | `/student/cluster/:id` | Produktionsbereit | Fortschritt aus DB |
| TaskPlayer | `/student/tasks/:id` | Beta | Widgets ok, kein echter Submit-Flow |
| DiagnosisSession | `/diagnosis` | Produktionsbereit | In-memory, kein DB-Persist |
| DiagnosisResult | `/diagnosis/result` | Produktionsbereit | |
| ScreeningSession | `/screening` | Wartet auf Content | EmptyState ok; `is_diagnostic=true` fehlt |
| ParentDashboard | `/parent` | Produktionsbereit | Echtdaten |
| DesignShowcase | `/showcase` | Entwicklungs-Tool | Alle Tokens + Komponenten |
| Demo-Screens | `/demo/*` | Demo | 5 Szenarien, UIKit, Widgets |

---

## DB-Schema-Vollständigkeit

**Vorhanden (Migrations 001–021 + schema.sql):**
- Content: `competency_areas`, `tasks`, `task_assets`, `behavior_snapshots`
- Operations: `leads`, `intake_sessions`, `screening_tests`, `screening_ratings`
- Business: `tiers`, `student_subscriptions`, `student_coach`, `coaching_sessions`
- Progress: `student_task_progress`, `student_progress`, `xp_events`
- Reporting: `parent_reports`
- Auth: `profiles` mit Rollen, RLS auf alle Tabellen

**Ausstehend (Design-System-v2-Plan, Migrations 032–036):**
- 032: Zwei-Streak-Modell (`presence_streak_weeks`, `home_streak_sessions`)
- 033: 5-Stufen-Mastery (Introduced / Developing / Progressing / Proficient / Mastered)
- 034: Badge-Rarity + Badge-Catalog (Bronze/Silber/Gold/Platin)
- 035: Streak-Repair-Token
- 036: Aufräumen (veraltete Spalten entfernen)

---

## Brand-System-Status

| Element | Status |
|---|---|
| Logo-SVG-Assets (`public/brand/`) | Fertig |
| `EdvanceLogo`-Komponente | Fertig |
| Space Grotesk (Google Fonts) | Fertig |
| Token-System v1 (`tokens.css`) | Vorhanden, **v2-Migration ausstehend** |
| Türkis Level-Up Tokens | Vorhanden, **v2 streicht diese** |
| v2 Farbpalette (Notion-Spec) | Spec fertig, **Code-Migration ausstehend** |

---

## Offene Punkte (priorisiert)

### P0 — Blockiert Launch
- **Diagnostik-Content-Seeding** (`tasks.is_diagnostic=true`): Ohne Inhalt zeigt `/screening` nur EmptyState. Kein Code-Problem, nur Daten-Problem.
- **Browser-Verifikation** (U4 Lead-Conversion, `/screening`-Flow) durch Rasit — noch nicht durchgeführt.

### P1 — Vor Launch
- **Design-System v2 Migration** (Big Bang): `CLAUDE_CODE_MIGRATION_PROMPT.md` liegt lokal vor (966 Zeilen, 10 Phasen). Session muss gestartet werden.
- **DB-Migrationen 032–036** (Zwei-Streak, 5-Stufen-Mastery, Badge-Rarity, Streak-Repair-Token, Aufräumen).
- **WCAG-AA-Audit** für `--color-accent-streak` nach v2-Migration.
- **TaskPlayer Submit-Flow**: Widgets rendern, aber kein echter Antwort-Submit + XP-Vergabe-Loop.

### P2 — Nice to have / Post-MVP
- Mathebuch-Import vollständig befüllen (Lambacher Schweizer NRW).
- Cross-Tab-Sync (Realtime) für Zwei-Geräte-Flow (Schüler-Tablet + Coach-Screen).
- Home-Quest-Flow nach Session-Ende.
- Dark Mode (Custom Properties sind vorbereitet).
- Boss-Challenge-Character als Figur.
- Eddy (Lite-KI-Studybuddy).

---

## Qualität & TypeScript (Code-Review-Befunde)

**TypeScript:** `tsc -b --noEmit` — keine Fehler, Build ist sauber.

**Lib-Layer:** Vollständig diszipliniert. 19 Module, kein direkter Supabase-Aufruf außerhalb `src/lib/`. `SupabaseResult<T>` konsistent, alle try/catch mit aussagekräftigen Fehlermeldungen.

**Auth/RLS:** Korrekt. `behavior_snapshots` und `screening_ratings` nur INSERT + SELECT (Append-Only erzwungen). `ProtectedRoute` konsequent genutzt. `.env` in `.gitignore`.

### Dateigröße-Verstöße (> 400 Zeilen, CLAUDE.md §4)

| Datei | Zeilen | Empfehlung |
|---|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 | Aufteilen in Result + Sub-Komponenten |
| `src/pages/DiagnosisSession.tsx` | 764 | Aufteilen in Session + Widget-Orchestrator |
| `src/components/edvance/index.tsx` | 559 | Gamification-Komponenten + Feedback-Komponenten auslagern |
| `src/pages/DesignShowcase.tsx` | 478 | Dev-Tool, niedriger Prio |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | Dev-Tool, niedriger Prio |
| `src/pages/student/StudentDashboard.tsx` | 419 | Grenzwertig |

### Inline-Style-Verstöße (CLAUDE.md §11 — statische boxShadow)

- `CoachDashboard.tsx:82,110` — `SHADOW_CARD`/`SHADOW_ACTIVE` als `style={{ boxShadow }}` → ersetzen durch `shadow-card`/`shadow-elevation-md`
- `AdminDashboard.tsx:71,183` — `SHADOW_CARD` als `style={{ boxShadow }}` → ersetzen durch `shadow-card`

### Hardcodierte Hex-Farben außerhalb CSS

- `DrawCanvas.tsx` — `STROKE_COLOR = '#0F172A'`, `BG_COLOR = '#FFFFFF'`
- `MatchingWidget.tsx:14–17` — 4 Farben in der Paarungspalette
- `src/components/edvance/index.tsx:309–310` — 8 Farben im KPI-Farb-Array
- `EdvanceLogo.tsx:19–22` — `COLORS`-Objekt mit 4 Werten (spiegeln tokens.css, aber nicht als CSS-Variablen referenziert)

### LoadingPulse-Lücken

`StudentDashboard.tsx` und `ClusterView.tsx` nutzen Textfallback (`"Lade Themen …"`) statt `LoadingPulse` — Verstoß gegen CLAUDE.md §11.

### Doppelte StatCard-Komponente

`CoachDashboard.tsx` und `AdminDashboard.tsx` definieren je eine lokale `StatCard`-Funktion, obwohl die globale Komponente in `src/components/edvance/index.tsx` verfügbar ist.

### Offene Architektur-Fragen (undokumentiert)

1. **`/diagnosis` ohne Auth-Schutz** — bewusste Entscheidung für Tablet-Präsenz-Nutzung, aber nicht in CLAUDE.md/ROADMAP dokumentiert.
2. **Zwei Primärfarb-Tokens divergieren:** `--color-primary #334D7A` (tokens.css) vs. `--primary #2D6A9F` (globals.css) — Übergangszustand oder dauerhaft?
3. **`BehaviorSnapshot`-Typ** in `src/types/diagnosis.ts` statt `src/types/index.ts` — undokumentierte Aufteilung.
4. **Kein `supabase gen types`** — Join-Typen werden manuell gecastet; Schema-Drift wird nicht durch TypeScript erkennbar.
5. **Demo-Routen in Produktion** (`/showcase`, `/demo/*`) — nicht auth-geschützt; Entscheidung vor Launch treffen.
6. **`schema.sql` nicht konsolidiert** — Migrations 015–021 nur als `.sql`-Dateien, nicht in `schema.sql` nachgeführt.
7. **Nicht-geroutete Demo-Dateien** (`ScenarioCelebration`, `ScenarioCoach`, etc.) — Leichen oder bewusst geparkt?

---

## Nächster Session-Start (empfohlen)

```
Priorität 1: Design-System v2 Migration
Befehl: CLAUDE_CODE_MIGRATION_PROMPT.md (966 Zeilen, autonomer Durchlauf)
Branch: feature/v2-migration von dev

Priorität 2: Diagnostik-Content seeden
Befehl: npx tsx scripts/seed-diagnostic-content.ts (noch zu erstellen)
```
