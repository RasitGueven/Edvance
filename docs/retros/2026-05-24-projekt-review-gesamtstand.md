# Projekt-Review 2026-05-24 — Gesamtstand Edvance

---

## Überblick: Was wurde gebaut

### Phase 1 — Fundament & Cleanup (08.05.2026)

- Vite + React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui Basis
- Supabase Auth mit Rollen: `student | parent | coach | admin`
- Vollständiges Design-System in `src/components/edvance/index.tsx`:
  `EdvanceCard`, `EdvanceBadge`, `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials`,
  `ToastBanner`, `EmptyState`, `LoadingPulse`, `ProgressStep`
- `EdvanceNavbar` als gemeinsame Navbar für alle Rollen
- Onboarding-Wizard (AdminDashboard) in eigenständige Step-Komponenten aufgeteilt:
  `StudentDataStep`, `SubjectsStep`, `TierStep`, `CoachStep`, `SummaryStep`
- Page-Struktur nach Rollen: `coach/`, `student/`, `parent/`, `admin/`
- `ProtectedRoute` mit strikt typisierten `UserRole[]`-Allowlists
- Zentrales `src/types/index.ts` als Single Source of Truth für alle Types
- `src/lib/supabase/` Lib-Layer mit `{ data, error }`-Pattern und try/catch
- CLAUDE.md Harness konfiguriert

### Phase 2 — Aufgaben-Schema & Taxonomie (08.–13.05.2026)

- NRW Klasse 8 Mathe Taxonomie: 5 KMK-Kompetenzbereiche, 17 Mikroskills
- Datenbank-Migrationen 001–010 (Competency Areas, BehaviorSnapshots append-only,
  Diagnostic Fields, Serlo-Entfernung, Task-Source-Constraint, Task-Assets + Storage-RLS)
- Diagnose-Engine: `src/lib/diagnostic/generator.ts` + `coverageReporter.ts`
- Behavior-Tracking: `src/hooks/useBehaviorTracker.ts` + `src/lib/supabase/behavior.ts`
- `src/lib/behaviorAnalysis.ts` — Analyse-Logik ausschließlich hier
- Lambacher-Import-Pipeline: `scripts/import/lambacher.ts` (Dry-Run/Write, idempotent
  via `source_ref`-Unique-Constraint), Briefing für Chrome-Plugin in
  `scripts/import/PLUGIN_BRIEFING.md`
- `schema_content.sql` kumulativer Snapshot (Stand Migration 007)
- Task-Widget-Komponenten: `MCWidget`, `MatchingWidget`, `StepsWidget`, `TaskAnswerArea`,
  `TaskFilterBar`, `TaskMetaRow`, `TaskPedagogyAccordion`, `TaskPreviewCard`,
  `TaskQuestionBlock`, `TaskAssetEditor`
- `/demo/widgets` (TaskWidgetDemo), `/showcase` (DesignShowcase), `/demo/design`
  (DesignDemo mit Scenarios)

### Phase 3 — Real-Data-Programm (13.–17.05.2026)

Vollständige Entkoppelung von Mock-Daten. Alle Runtime-Mock-Treffer entfernt.

**Schema (Migrationen 011–021):**
- 011 RLS-Fix `students`/`parent_student`/`student_subjects` + Security-Definer-Helper
- 012 `leads` (Erstgespräch Stufe A, PII Coach/Admin only)
- 013 `intake_sessions` (Erstgespräch Stufe B, strukturiertes Protokoll)
- 014 `screening_tests` + `screening_ratings` (append-only) + `behavior_snapshots.screening_test_id`
- 015 `tiers` + `student_subscriptions`
- 016 `student_coach`
- 017 `coaching_sessions` + `session_students`
- 018 `student_task_progress`
- 019 `student_progress` (read-only, nur via Trigger) + `xp_events` (append-only)
- 020 `parent_reports`
- 021 atomare RPC `app_provision_student` (SECURITY DEFINER, service_role only)

**Lib-Layer `src/lib/supabase/`:**
`leads`, `students`, `intake`, `subscriptions`, `tiers`, `studentCoach`, `screening`,
`screeningRatings`, `sessions`, `taskProgress`, `progress`, `parentReports`, `provision`,
`profiles`, `behavior`, `auth`, `client`, `storage`, `tasks`

**Edge Function:** `supabase/functions/provision_student` (Deno)
— Lead→Schüler-Konvertierung: auth-User-Anlage + RPC 021 + Rollback bei Fehler

**UI-Anbindung (U1–U10):**
- U1: `MOCK_COACHES` → `getCoaches()`
- U2: `/admin/leads` — Lead-Erfassung, Liste, Status-Workflow
- U3: `/coach/intake` — Erstgespräch-Protokoll (draft → final)
- U4: Onboarding + Lead-Konvertierung über `provisionStudent()` (Edge Function live)
- U5a/b: Diagnose-Engine auf echten Generator + Content, `mockDiagnosisTasks.ts` gelöscht
- U5c: `/screening` DB-gestützt, localStorage komplett raus aus DiagnosisContext,
  DB-Resume via `rebuildRunTasks`, `createScreeningRating` append-only
- U6: `/admin/tiers` — TIERS-Konstante raus, DB-Katalog
- U7: CoachDashboard — echte Sessions/Anwesenheit, MOCK_SESSIONS gelöscht
- U8: ClusterView — Fortschritt aus `student_task_progress`
- U9: StudentDashboard — XP/Streak aus `student_progress`
- U10: ParentDashboard — echte Kind-Daten + Reports
- Schnellzugriff-Kacheln (`DashboardTiles`) für Student/Coach/Parent-Dashboards
- `/admin/diagnostics` — Admin-UI zum manuellen Seeden von Diagnostic-Tasks

### Phase 4 — Brand-System & Design-Feinschliff (17.–24.05.2026)

- Echtes Edvance-Logo aus Design-Handoff: `src/components/brand/EdvanceLogo.tsx`
  mit drei Varianten (wordmark, icon, stacked) und zwei Themes (dark, light)
- Space Grotesk Webfont in Navbar via `EdvanceLogo`
- Level-Up Farbsystem: `--color-levelup` (Türkis), `--color-moment-levelup`, `--gradient-levelup`,
  `--shadow-glow-levelup` in `src/styles/tokens.css`
- Streak-Repair Token: `--color-moment-repair` (Lila) + Gradient
- Gold vereinheitlicht: `--xp-gold` → `var(--color-accent)` (Single Source)
- `EdvanceBadge`: neue Varianten `levelup` und `repair`
- `ToastBanner`: neuer Typ `levelup`
- `DesignShowcase`: neue Gruppe „Emotionale Momente"

---

## Architektur-Status

### Tech Stack

| Schicht | Technologie |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v4 + CSS Custom Properties (`src/styles/tokens.css`, `globals.css`) |
| UI-Primitiven | shadcn/ui (`src/components/ui/`) |
| Eigene Komponenten | `src/components/edvance/index.tsx` + Sub-Ordner |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge Functions | Deno (`supabase/functions/provision_student`) |

### Datenbankschema

21 Migrationen abgeschlossen. Schema vollständig dokumentiert in `docs/SCHEMA.md`
und `schema.sql` / `schema_content.sql`. Alle Tabellen haben RLS aktiviert.

Append-only Tabellen (korrekt eingehalten):
- `behavior_snapshots` — kein Update/Delete im Lib-Layer nachgewiesen
- `xp_events` — kein Update/Delete im Lib-Layer nachgewiesen
- `screening_ratings` — kein Update/Delete im Lib-Layer nachgewiesen

Security-Definer-Helper (nicht-rekursiv): `get_my_role()`, `get_my_student_id()`,
`is_parent_of_student(uuid)`

### Lib-Layer

Alle Supabase-Aufrufe liegen ausschließlich in `src/lib/supabase/`. Keine direkten
Aufrufe in Pages oder Komponenten festgestellt. Alle Wrapper folgen dem
`SupabaseResult<T>` + try/catch-Pattern. `tasks.ts` ist mit 342 Zeilen die größte
Lib-Datei — noch unterhalb der 400-Zeilen-Grenze.

### Auth-Flow

- `src/context/AuthContext.tsx` nutzt Wrapper aus `lib/supabase/auth.ts` und `profiles.ts`
- Alle geschützten Routen via `ProtectedRoute` mit strikt typierten `UserRole[]`
- Kein manueller Rollen-Check in Pages
- Service-Role-Key nur in Edge Function (Deno, serverseitig) — nicht im Frontend
- `.env` steht korrekt in `.gitignore` und ist nicht gestaged

### Routing-Übersicht

| Route | Rolle | Seite |
|---|---|---|
| `/login` | public | Login |
| `/student` | student | StudentDashboard |
| `/student/cluster/:id` | student | ClusterView |
| `/student/task/:id` | student | TaskPlayer |
| `/coach` | coach | CoachDashboard |
| `/coach/intake` | coach, admin | IntakePage |
| `/parent` | parent | ParentDashboard |
| `/admin` | admin | AdminDashboard |
| `/admin/leads` | admin, coach | LeadsPage |
| `/admin/tiers` | admin | TiersPage |
| `/admin/diagnostics` | admin | DiagnosticsPage |
| `/admin/lambacher-preview` | admin | LambacherPreview |
| `/diagnosis` | public (Tablet-Modus) | DiagnosisSession |
| `/diagnosis/result` | public | DiagnosisResult |
| `/screening` | student, coach, admin | DiagnosisSession (screening) |
| `/screening/result` | student, coach, admin | DiagnosisResult |
| `/showcase` | public | DesignShowcase |
| `/demo/*` | public | Demo-Scenarios |

Hinweis: `/diagnosis` und `/diagnosis/result` sind bewusst ungeschützt (Tablet-Modus
im Unterricht ohne Login). Das ist eine dokumentierte Designentscheidung.

---

## Design-System Status

### Token-Architektur

Zwei CSS-Dateien in `src/styles/`:
- `tokens.css` — primitive Tokens: Farben, Radien, Shadows, Gradients, Gamification-Tokens
- `globals.css` — semantische Tokens auf Basis von tokens.css, Tailwind-Mappings via
  `@theme inline`, Utility-Klassen (`.bg-gradient-levelup`, `.shadow-glow-levelup` etc.)

### Gamification-Farb-Mapping (Stand nach PR #18)

| Moment | Token | Wert |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` | Gold `#E8A020` |
| Level-Up | `--color-levelup` / `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün/Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

### Komponenten-Bibliothek (`src/components/edvance/index.tsx`)

Exportierte Komponenten (559 Zeilen — ÜBER der 400-Zeilen-Grenze, siehe Risiken):
`EdvanceCard`, `EdvanceBadge`, `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials`,
`ToastBanner`, `EmptyState`, `LoadingPulse`, `ProgressStep`, `ThemeSwatch`

### Komponenten-Adoption in Pages

| Page | EdvanceCard | EmptyState | LoadingPulse | StatCard |
|---|---|---|---|---|
| LeadsPage | ja | ja | ja | nein |
| TiersPage | ja | ja | ja | nein |
| DiagnosticsPage | ja | ja | ja | nein |
| IntakePage | ja | ja | ja | nein |
| ParentDashboard | ja | ja | ja | nein |
| CoachDashboard | nein (lokale StatCard) | ja | ja | lokal |
| StudentDashboard | nein | nein | nein | lokal |
| DiagnosisSession | nein | nein | nein | nein |
| DiagnosisResult | nein | nein | nein | nein |

`DiagnosisSession.tsx` (764 Zeilen) und `DiagnosisResult.tsx` (946 Zeilen) sind die
ältesten großen Pages und nutzen das Design-System kaum — sie verwenden überwiegend
lokale Komponenten und rohe `div`-Elemente mit Inline-Styles.

---

## TypeScript-Status

**`npm run lint` (= `tsc -b --noEmit`) → Exit 0, keine Fehler.**

Der korrekte Check für dieses Projekt ist `npm run lint`, nicht `npx tsc --noEmit`,
weil die Solution-tsconfig (`tsconfig.app.json`) mit `tsc -b` aufgerufen wird.
`node_modules` muss installiert sein (war zum Zeitpunkt des Reviews nicht vorhanden,
nach `npm install` Exit 0 bestätigt).

Scripts (`scripts/*.ts`) und `vite.config.ts` verwenden eine eigene tsconfig
und werden separat von der App-tsconfig kompiliert. Die im Abschnitt
„Offene Punkte" genannten `@types/node`-Fehler in Scripts treten nur auf,
wenn `tsc -b` ohne installierte `node_modules` läuft oder wenn die App-tsconfig
fälschlicherweise auf die Scripts-tsconfig verweist. Nach `npm install`: clean.

---

## Offene Punkte & Nächste Schritte

### Aus ROADMAP.md

1. **Diagnostik-Content seeden** (`tasks.is_diagnostic=true`) — `/screening` zeigt
   korrekt einen EmptyState, ist aber ohne Content nicht vollständig testbar.
   Erster Lambacher-Content-Drop steht noch aus (Owner + Kapitel + Deadline offen).

2. **Browser-Verifikation** (U4-Conversion, `/screening`-Flow) durch Rasit —
   noch ausstehend.

3. **Mathebuch-Import** (Lambacher Schweizer 8. Klasse NRW) — Pipeline bereit,
   `scripts/import/raw/lambacher-8-nrw/` ist leer.

4. **Home-Quest Flow** — noch nicht begonnen.

5. **Zwei-Geräte-Flow** (Schüler-Tablet + Coach-View) — kein Cross-Tab-Sync
   nach localStorage-Entfernung. Supabase Realtime als Folgeschritt definiert,
   aber noch nicht gebaut.

### Aus Code-Review

6. **`src/components/edvance/index.tsx`** überschreitet mit 559 Zeilen die
   400-Zeilen-Grenze aus CLAUDE.md. Empfehlung: aufteilen in
   `EdvanceCard.tsx`, `Badges.tsx`, `Progress.tsx`, `Feedback.tsx`, `Skeleton.tsx`.

7. **`DiagnosisResult.tsx`** (946 Zeilen) und **`DiagnosisSession.tsx`** (764 Zeilen)
   sind weit über dem 400-Zeilen-Limit. Beide Seiten nutzen das Edvance-Design-System
   kaum und haben zahlreiche Inline-Styles. Refactor-Kandidaten für eigene Session.

8. **`StudentDashboard.tsx`** (419 Zeilen) nähert sich der Grenze. Die lokalen
   Komponenten (XPBadge, SubjectRow etc.) könnten in eigene Dateien ausgelagert werden.

9. **ESLint fehlt** — `noUnusedImports` und weitere Regeln werden nicht automatisch
   geprüft. Das Retro vom 08.05.2026 hat dies bereits gemeldet.

10. **Zombie-Branches** (lokal): `feature/content-schema`, `feature/diagnosis-engine`,
    `feature/diagnostic-engine`, `feature/student-learning-path` — alle bereits in
    `dev` integriert, nur Pointer-Cleanup nötig.

11. **`schema.sql` und `schema_content.sql`** doppeln die `subjects`-Definition.
    Konsolidierung steht noch aus.

---

## Risiken & Technische Schulden

### Schwerwiegend (Blocker-Kandidaten)

**Hardcodierte Hex-Farben außerhalb von CSS-Dateien (CLAUDE.md-Verstoß):**

- `/home/user/Edvance/src/components/edvance/DrawCanvas.tsx:14` —
  `const STROKE_COLOR = '#0F172A'` und Zeile 16 `const BG_COLOR = '#FFFFFF'`
  Diese sollten CSS-Variablen referenzieren.

- `/home/user/Edvance/src/components/edvance/tasks/MatchingWidget.tsx:14-17` —
  Vier hardcodierte Hex-Werte im `ACCENTS`-Array (`#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed`).
  Diese entsprechen `--primary`, `--success`, `--warning`, `--color-moment-repair` —
  CSS-Variablen müssten verwendet werden.

- `/home/user/Edvance/src/components/edvance/index.tsx:309-310` —
  8 hardcodierte Hex-Werte für Cluster-Farb-Palette (`#2D6A9F`, `#0F6E56`, etc.).

- `/home/user/Edvance/src/components/edvance/tasks/MCWidget.tsx:37` —
  `color: active ? '#fff' : 'var(--primary)'` — `'#fff'` ist hardcodiert.

- `/home/user/Edvance/src/pages/student/StudentDashboard.tsx:305` —
  `fg: '#9A6B00'` ist hardcodiert (sollte `var(--color-accent-dark)` o.ä. sein).

- `/home/user/Edvance/src/pages/student/TaskWidgetDemo.tsx:155` —
  `color="#7c3aed"` als Prop-Value hardcodiert.

- `/home/user/Edvance/src/context/ThemeContext.tsx:8-11` —
  Theme-Definitionen mit Hex-Werten (`#2D6A9F`, `#0E7490`, etc.). Diese liegen
  bewusst im Context (kosmetisch, ThemeContext bleibt localStorage), sind aber
  technisch ein CLAUDE.md-Verstoß.

- `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx:19-22` —
  Logo-interne Farben als Hex-Map. Grenzfall: Logo-Komponente als
  „Design-Handoff-Artefakt" könnte dokumentierte Ausnahme sein.

**Inline-Styles mit Literal-Strings (kein dynamischer Wert):**

- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:634,638,645` —
  `style={{ background: 'white' }}` auf dekorativen `div`-Elementen. Sollte
  Tailwind-Klasse `bg-white` oder `bg-[var(--surface)]` sein.

- `/home/user/Edvance/src/components/edvance/tasks/TaskQuestionBlock.tsx:57,119` —
  `color: 'white'` in Inline-Style neben dynamischem `backgroundColor`. Das
  `'white'` sollte `var(--text-inverse)` sein.

- `/home/user/Edvance/src/components/edvance/onboarding/SubjectsStep.tsx:44`,
  `TierStep.tsx:49,70`, `StepsWidget.tsx:25`, `CoachStep.tsx:48` —
  `style={{ background: 'var(--primary)' }}`. Dies ist technisch korrekt
  (CSS-Variable), aber statisch — sollte Tailwind-Klasse `bg-primary` o.ä. sein.

- `/home/user/Edvance/src/pages/DiagnosisSession.tsx` — 20+ Inline-Styles,
  überwiegend mit CSS-Variablen (akzeptabel für dynamische Werte wie `borderBottomWidth`),
  aber einige statisch (z.B. Zeile 401: `border: '2px dashed var(--border)'`).

### Mittel (Warnungen)

**Dateigröße-Limit überschritten:**

- `/home/user/Edvance/src/pages/DiagnosisResult.tsx` — 946 Zeilen (Limit: 400)
- `/home/user/Edvance/src/pages/DiagnosisSession.tsx` — 764 Zeilen (Limit: 400)
- `/home/user/Edvance/src/components/edvance/index.tsx` — 559 Zeilen (Limit: 400)
- `/home/user/Edvance/src/pages/DesignShowcase.tsx` — 478 Zeilen (Limit: 400)
- `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` — 427 Zeilen (Limit: 400)
- `/home/user/Edvance/src/pages/student/StudentDashboard.tsx` — 419 Zeilen (Limit: 400)

**Edvance-Komponenten nicht vollständig adoptiert in großen Pages:**

`DiagnosisSession.tsx` und `DiagnosisResult.tsx` importieren `EdvanceCard`, `EmptyState`,
`LoadingPulse` gar nicht. Sie verwenden rohe `div`-Elemente für Card-artige Strukturen,
was gegen die „Nie rohe div für Cards"-Regel verstößt. Vor dem nächsten Schüler-facing
Release sollte dies adressiert werden.

`StudentDashboard.tsx` importiert nur `XPBar` aus dem Design-System, obwohl mehrere
lokale `StatCard`-artige Elemente gebaut wurden, die durch die globale `StatCard`-Komponente
ersetzt werden könnten.

**Keine Tests:**

Keine automatisierten Unit- oder Integrationstests vorhanden. Die gesamte Validierung
erfolgt manuell via `npm run lint` + Browser-Verifikation durch Rasit. Besonders
`src/lib/behaviorAnalysis.ts` und `src/lib/diagnostic/generator.ts` sind logisch-kritisch
und sollten Test-Coverage haben.

**`DiagnosisSession` und `DiagnosisResult` als ungeschützte Routen:**

`/diagnosis` und `/diagnosis/result` sind bewusst ohne ProtectedRoute (Tablet-Modus).
Das ist dokumentiert, aber ein potenzielles Risiko wenn in Zukunft echte Schülerdaten
direkt in der lokalen Session verwendet werden.

### Gering (Dokumentiert, kein sofortiger Handlungsbedarf)

- **`ThemeContext.tsx`** bleibt mit localStorage (kosmetisch, bewusste Entscheidung)
- **Zwei Geräte / Cross-Tab-Sync** fehlt nach localStorage-Entfernung (Realtime-Schritt geplant)
- **Lambacher-Content-Drop** steht aus — Import-Pipeline ist bereit, aber `raw/`-Ordner leer
- **Zombie-Branches lokal** — nur Pointer-Cleanup
- **`schema.sql` und `schema_content.sql`** doppeln `subjects`

---

## Commit-Historie (letzte 30)

| Hash | Beschreibung |
|---|---|
| `9b4388f` | Merge PR #18: Brand-System + Level-Up Farbsystem-Feinschliff |
| `401ad6c` | feat(design): P3 Showcase-Swatches + Retro Farbsystem-Feinschliff |
| `4c921ec` | feat(design): P2 Level-Up-Türkis in Consumern + Badge/Toast-Varianten |
| `bb7af96` | feat(design): P1 Level-Up-Türkis + Repair-Tokens, Gold vereinheitlicht |
| `3cf2c29` | feat(brand): Wordmark-Logo in Navbar (EdvanceLogo + Space Grotesk) |
| `9051995` | feat(brand): echtes Edvance-Logo aus Design-Handoff einbinden |
| `58d5be3` | Merge PR #17: dev mit Real-Data-Programm synchronisieren |
| `8a30cd4` | Merge PR #16 from RasitGueven/feature/real-data-program |
| `0c30186` | feat: Schnellzugriff-Kacheln für Schüler/Coach/Eltern-Dashboard |
| `17e8156` | feat: /admin/diagnostics – Oberfläche zum manuellen Seeden |
| `2326772` | feat: Lib – updateTaskDiagnostic + createDiagnosticTask (Admin-Seeding) |
| `6157f5a` | feat: U5c-2 – localStorage komplett aus DiagnosisContext entfernt |
| `77bd4b8` | feat: U5c-1 – Screening DB-Persistenz + /screening-Route + DB-Resume |
| `2eb01b7` | feat: U4 – Onboarding + Lead-Konvertierung an provisionStudent angebunden |
| `bea0a9c` | refactor: provision_student – IDs per Destructuring (chat-copy-safe) |
| `0161ae5` | docs: F – Mock-Sweep-Retro + ROADMAP aktualisiert |
| `a611e26` | feat: U10 – ParentDashboard echte Kind-Daten statt Stub |
| `c693514` | feat: U9 – StudentDashboard XP/Streak aus student_progress |
| `b6327d6` | feat: U8 – ClusterView-Fortschritt aus DB statt localStorage |
| `f635a35` | feat: U7 – CoachDashboard echte Sessions, MOCK_SESSIONS raus |
| `a6c7daf` | feat: U6 + Tarif-Verwaltung – TIERS-Konstante raus, DB-Katalog + Admin-UI |
| `ebe8f53` | feat: U5b – DiagnosisResult de-mockt, mockDiagnosisTasks.ts gelöscht |
| `7b86acd` | feat: U5a – Diagnose-Engine auf echten Generator (Context+Session) |
| `f775604` | feat: U3 – Erstgespräch-Protokoll-Formular (/coach/intake) |
| `cc84dbb` | feat: U2 – Lead-Erfassung + Lead-Liste UI (/admin/leads) |
| `e0efa3e` | feat: U1 MOCK_COACHES raus + fix Tier-Kollision + Lint grün |
| `a046e8c` | feat: PI – Edge Function provision_student + atomare RPC (Mig 021) |
| `c3fa8ba` | feat: Lib-Layer L4 – sessions/taskProgress/progress/parentReports |
| `f959393` | feat: Lib-Layer L3 – screening.ts + screeningRatings.ts + Snapshot-FK |
| `3cd797f` | feat: Lib-Layer L2 – intake.ts + subscriptions.ts + studentCoach.ts |

---

## Review-Ergebnis Zusammenfassung

Passt:
- `npm run lint` → Exit 0, keine TypeScript-Fehler
- Supabase-Disziplin vollständig: keine direkten Aufrufe in Komponenten oder Pages
- Append-only-Regeln für `behavior_snapshots`, `xp_events`, `screening_ratings` eingehalten
- `.env` in `.gitignore`, nicht gestaged, kein `service_role`-Key im Frontend
- Auth via `ProtectedRoute` korrekt, kein manueller Rollen-Check in Pages
- Kein kind-seitiges Korrekt/Falsch-Feedback in Schüler-Views
- Vollständiger Mock-Sweep abgeschlossen (kein `MOCK_*` mehr in Runtime)
- Design-System vollständig vorhanden und in neueren Pages korrekt adoptiert

Warnungen:
- Sechs Dateien überschreiten das 400-Zeilen-Limit (größte: `DiagnosisResult.tsx` mit 946 Zeilen)
- `DiagnosisSession.tsx` und `DiagnosisResult.tsx` nutzen `EdvanceCard`/`EmptyState`/`LoadingPulse` gar nicht
- `StudentDashboard.tsx` nutzt Design-System nur für `XPBar`, Rest sind lokale Duplikate
- Keine automatisierten Tests für logisch-kritische Lib-Dateien

Blocker (vor nächstem Schüler-facing Release zu adressieren):
- Mehrere hardcodierte Hex-Farben in Komponenten-Dateien (CLAUDE.md-Verstoß):
  `DrawCanvas.tsx:14,16`, `MatchingWidget.tsx:14-17`, `index.tsx:309-310`,
  `MCWidget.tsx:37`, `StudentDashboard.tsx:305`
- `style={{ background: 'white' }}` in `DiagnosisResult.tsx:634,638,645` —
  statischer Literal-Wert in Inline-Style, kein dynamischer Grund
