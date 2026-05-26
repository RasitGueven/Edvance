# Retro 2026-05-26 — Gesamtstand V1: Real-Data-Programm + Brand-System

## Überblick

In diesem Meilenstein wurde die gesamte Datenschicht von Mock-Objekten auf echte Supabase-Daten
migriert (Migrations 008–021, 14 neue Tabellen, vollständige RLS-Policies) sowie eine atomare
Lead-zu-Student-Conversion via Edge Function `provision_student` eingeführt. Parallel dazu
wurden das Brand-System mit echtem Logo und Wordmark etabliert und ein vollständiges
CSS-Design-Token-System (`tokens.css`) mit Level-Up-Türkis, Streak-Repair-Lila und vereinheitlichtem
Gold als zentrale Grundlage für alle UI-Komponenten fertiggestellt.

---

## Was gebaut wurde

### 1. Datenbankschema — Vollausbau (Migrations 008–021)

| Migration | Tabellen | Zweck |
|---|---|---|
| 008 | `tasks` (Constraint) | `task_source`-Enum-Constraint ergänzt |
| 009 | `task_assets` | Aufgaben-Assets (Bild/Audio/Video) mit Storage-Referenz |
| 010 | Storage-Policies | RLS für `task_assets`-Bucket |
| 011 | — | RLS-Fix für `students` / `parent_student` / `student_subjects` |
| 012 | `leads` | Erstkontakt-Erfassung (Stufe A); Status-Workflow `new→converted/rejected`; nur Coach/Admin; enthält PII |
| 013 | `intake_sessions` | Strukturiertes Erstgespräch-Protokoll (Stufe B) am bereits angelegten Schüler; Status `draft→final` |
| 014 | `screening_tests`, `screening_ratings` | Diagnose-Aggregat pro (Schüler, Fach); `screening_ratings` append-only; FK `behavior_snapshots.screening_test_id` |
| 015 | `tiers`, `student_subscriptions` | DB-Katalog für Tarife (ersetzt hardcodierte TIERS-Konstante); Abo-Status `active/paused/cancelled` |
| 016 | `student_coach` | Schüler↔Coach-Zuordnung; Admin-verwaltbar |
| 017 | `coaching_sessions`, `session_students` | Session-Betrieb inkl. Anwesenheitserfassung; ersetzt `MOCK_SESSIONS` |
| 018 | `student_task_progress` | Aufgaben-Fortschritt pro (Schüler, Aufgabe); ersetzt `localStorage` Key `edvance_task_progress_v1` |
| 019 | `student_progress`, `xp_events` | Gamification: `xp_events` append-only; `student_progress` wird ausschließlich via Security-Definer-Trigger `apply_xp_event` aktualisiert (kein Client-Write) |
| 020 | `parent_reports` | Elternreport; Status `draft→published`; Eltern/Schüler sehen nur veröffentlichte |
| 021 | `app_provision_student` (RPC) | Atomare Transaktion: `profiles→students→parent_student→student_subjects→student_coach→student_subscriptions→leads` |

Alle Tabellen haben RLS aktiviert. Policies folgen dem Muster: Schüler sieht eigene Daten via `get_my_student_id()`, Eltern via `is_parent_of_student()`, Coach/Admin via `get_my_role()`.

---

### 2. Supabase-Lib — Vollständige Datenzugriffs-Schicht

Alle Supabase-Aufrufe ausschließlich in `src/lib/supabase/`. Jede Funktion gibt `SupabaseResult<T>` zurück (`{ data: T | null, error: string | null }`), jeder Call hat try/catch.

| Datei | Hauptfunktionen |
|---|---|
| `auth.ts` | `getCoaches()` |
| `behavior.ts` | `persistBehaviorSnapshot()` — append-only, optional mit `screeningTestId` |
| `intake.ts` | `createIntakeSession()`, `getIntakeByStudent()`, `updateIntakeSession()` |
| `leads.ts` | `createLead()`, `listLeads()`, `getLeadById()`, `updateLead()` |
| `parentReports.ts` | `getParentReportsByStudent()` |
| `profiles.ts` | `getProfile()` |
| `progress.ts` | `getStudentProgress()` (XP, Streak, Level) |
| `provision.ts` | `provisionStudent()` — Edge-Function-Wrapper |
| `screening.ts` | `createScreeningTest()`, `getActiveScreeningTest()`, `getScreeningTestById()`, `completeScreeningTest()` |
| `screeningRatings.ts` | `insertScreeningRating()` — append-only |
| `sessions.ts` | `getSessionsForCoach()`, `getSessionsForStudent()` |
| `storage.ts` | Asset-Upload/Download-Helpers |
| `studentCoach.ts` | `getCoachForStudent()` |
| `students.ts` | `listStudentsWithName()`, Fach-Mapping |
| `subscriptions.ts` | `getSubscriptionForStudent()` |
| `taskProgress.ts` | `markTaskCompleted()`, `getCompletedTaskIds()` |
| `tasks.ts` | `getTasksByCluster()`, `createDiagnosticTask()`, `updateTaskDiagnostic()`, `getMicroskillsByCluster()`, u.a. |
| `tiers.ts` | `listAllTiers()`, `createTier()`, `updateTier()` |

---

### 3. Supabase Edge Function — provision_student

**Datei:** `supabase/functions/provision_student/`

**Zweck:** Atomare, serverseitige Konvertierung eines Leads zu einem vollständigen Schüler-Account. Die Funktion läuft unter `service_role` und verwendet die Supabase Auth Admin API, um Auth-User für Schüler und optional für ein Elternteil anzulegen. Danach ruft sie die RPC-Funktion `app_provision_student` (Migration 021) auf, die alle DB-Schritte in einer einzigen impliziten PostgreSQL-Transaktion ausführt.

**Input (ProvisionInput):**

```ts
{
  lead_id?: string | null
  full_name: string
  student_email?: string | null
  parent_email?: string | null
  class_level?: number | null
  school_type?: SchoolKind | null
  school_name?: string | null
  subjects?: string[]
  coach_id?: string | null
  tier_id?: string | null
}
```

**Output:** `{ student_id: string }` — die neu angelegte `students.id`.

**Rollback-Semantik:** Unbekanntes Fach in `subjects` löst `raise exception` in der RPC aus → ganzer DB-Block rollt zurück. Auth-User-Cleanup muss bei Fehlern manuell erfolgen (bekanntes offenes TODO).

**Frontend-Wrapper:** `src/lib/supabase/provision.ts` → `provisionStudent()`. Niemals direkt aus Komponenten aufrufen.

---

### 4. Real-Data-Programm (U1–U10 + F)

Alle Stationen wurden sequenziell von Mock-Daten auf die echte DB umgestellt:

| Unit | Was wurde de-mockt |
|---|---|
| U1 | `MOCK_COACHES` entfernt; Coaches via `getCoaches()` aus `profiles` |
| U2 | Lead-Erfassung `/admin/leads` — vollständige CRUD-UI |
| U3 | Erstgespräch-Protokoll `/coach/intake` — Create + Update |
| U4 | Onboarding-Wizard ruft `provisionStudent()` auf (statt lokalem State) |
| U5a | `DiagnosisContext` + Screening-Session auf echten Generator |
| U5b | `DiagnosisResult` de-mockt; `mockDiagnosisTasks.ts` gelöscht |
| U5c-1 | `/screening` DB-gestützt; DB-Resume wenn aktiver Test existiert |
| U5c-2 | `localStorage` komplett aus `DiagnosisContext` entfernt |
| U6 | Tarif-Verwaltung: `TIERS`-Konstante entfernt, DB-Katalog + `/admin/tiers` |
| U7 | `CoachDashboard` lädt echte Sessions aus `coaching_sessions` |
| U8 | `ClusterView`-Fortschritt aus `student_task_progress` statt `localStorage` |
| U9 | `StudentDashboard` XP/Streak aus `student_progress` |
| U10 | `ParentDashboard` lädt echte Kind-Daten |
| F | Mock-Sweep-Retro: alle verbliebenen `localStorage`-Keys außer `ThemeContext` entfernt |

---

### 5. Screening & Diagnose

**DiagnosisContext** (`src/context/DiagnosisContext.tsx`): Vollständig auf DB-Persistenz umgestellt. Beim Start prüft der Context via `getActiveScreeningTest()`, ob ein laufender Test existiert (Resume-Logik). Snapshots werden via `persistBehaviorSnapshot()` append-only gespeichert, verknüpft mit `screening_test_id`. `localStorage` ist vollständig entfernt.

**Route `/screening`:** Eigenständige Route mit DB-Resume. Kein visuelles Richtig/Falsch-Feedback für Schüler (Regel eingehalten).

**DiagnosticsPage** (`src/pages/admin/DiagnosticsPage.tsx`, 427 Zeilen — knapp über 400-Zeilen-Limit): Admin-Oberfläche zum manuellen Seeden von Diagnose-Tasks. Filtert nach Fach, Cluster, Mikroskill; erlaubt Erstanlage (`createDiagnosticTask()`) und Bearbeitung (`updateTaskDiagnostic()`) von `is_diagnostic`-Tasks.

---

### 6. Admin-Seiten

| Datei | Zeilen | Inhalt |
|---|---|---|
| `src/pages/admin/LeadsPage.tsx` | 382 | Lead-Liste + Inline-Create-Formular + Status-Workflow-Buttons + `provisionStudent()`-Trigger |
| `src/pages/admin/TiersPage.tsx` | 210 | Tarif-Liste + Create/Update (Name, Preis in Euro, Features als Zeilenblock, Sortierreihenfolge) |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | Diagnose-Seeding-Oberfläche (s.o.) |
| `src/pages/admin/LambacherPreview.tsx` | 208 | Vorschau für Lambacher-Schweizer-Content-Import |

---

### 7. Coach-Workflow

**IntakePage** (`src/pages/coach/IntakePage.tsx`, 324 Zeilen): Schüler-Auswahl via Dropdown; Create + Update von `intake_sessions`. Felder: `conducted_at`, `goals`, `motivation`, `learning_history`, `parent_expectations`, `agreed_next_steps`, `notes`, `known_weak_topics` (Freitext, wird beim Submit zu `text[]` konvertiert). Status `draft → final` über Toggle.

**CoachDashboard:** Lädt echte `coaching_sessions` inkl. `session_students`-Anwesenheit via `getSessionsForCoach()`.

**Schnellzugriff-Kacheln** (`src/components/edvance/DashboardTiles.tsx`): Generische Tile-Komponente für Schüler-, Coach- und Eltern-Dashboards. Nutzt `EdvanceCard`, respektiert 44px Touch-Target, unterstützt `anchor`-Modus für Same-Page-Anker.

---

### 8. Brand-System

**EdvanceLogo** (`src/components/brand/EdvanceLogo.tsx`, 249 Zeilen): Drei exportierte Komponenten:

- `EdvanceSymbol` — J-Kurve (Hairline + Dot + Gold-Pfeil) für Navbar und Cards, optional kalligraphisch gefüllt
- `EdvanceLogo` — Symbol + Wordmark (Space Grotesk, `fontWeight: 400`, `letterSpacing: 0.045em`) nebeneinander; `symbolRight`-Prop
- `EdvanceAppIcon` — Gerundetes Quadrat für App-Icon / Avatar / Badge

Die Logo-Komponente akzeptiert `color`, `accentColor`, `size` als Props. Inline-Styles werden bewusst für dynamisch berechnete Pixel-Werte (`symSize`, `gap`) und die Wordmark-Schrift verwendet — statische Layout-Eigenschaften via Tailwind.

**Brand-Assets** in `public/brand/`:
- `edvance-symbol.svg`
- `edvance-logo-light.svg`
- `edvance-logo-dark.svg`
- `edvance-app-icon.svg`
- `edvance-favicon.svg`

**Navbar:** `EdvanceLogo` mit `size={20}` ersetzt den früheren Text-Placeholder.

---

### 9. Design-Token-System

**Datei:** `src/styles/tokens.css` (89 Zeilen, `@layer base`)

Vollständiger Token-Katalog in CSS Custom Properties:

**Farb-Tokens:**

| Token-Gruppe | Tokens |
|---|---|
| Primär | `--color-primary`, `--color-primary-hover`, `--color-primary-light` |
| Hintergrund | `--color-bg-app` (`#F7F7F5`), `--color-bg-surface`, `--color-bg-subtle`, `--color-border` |
| Text | `--color-text-primary` (`#1A1A18`), `--color-text-secondary`, `--color-text-tertiary`, `--color-text-link` |
| Akzent/Gold | `--color-accent` (`#E8A020`), `--color-accent-light`, `--color-accent-celebration` (`#F5C842`), `--color-accent-on`, `--color-accent-celebration-on` |
| Status | `--color-success/light`, `--color-warning/light`, `--color-error/light`, `--color-info/light` |
| Level-Up-Türkis | `--color-levelup` (`#0E9E96`), `--color-moment-levelup` (`#19C9BC`), `--color-levelup-on` (`#04302D`) |
| Streak-Repair-Lila | `--color-moment-repair` (`#8B5CF6`), `--color-moment-repair-on` (`#FFFFFF`) |
| Emotionale Momente | `--color-moment-gold`, `--color-moment-green`, `--color-moment-red`, `--color-moment-bg` (`#1A2E4A`) |
| Premium-Navy | `--color-hero-navy` (`#14213D`), `--color-hero-navy-2` (`#1F3157`) |

**Gradient-Tokens:** `--gradient-brand`, `--gradient-hero`, `--gradient-primary-btn`, `--gradient-gold`, `--gradient-levelup` (135°, `#1FD3C6→#0B8B85`), `--gradient-repair`, `--gradient-success`, `--gradient-surface`, `--gradient-celebration`.

**Shadow-Tokens:** `--shadow-premium-sm/md/lg/xl` (brand-getönte Schatten mit Navy-RGB), `--shadow-glow-primary`, `--shadow-glow-gold`, `--shadow-glow-levelup` (44px Türkis-Glow), `--shadow-inset-card`.

**Semantische Regeln:** `--color-levelup` für ruhige Badge-/UI-Variante; `--color-moment-levelup` ausschließlich auf Navy-Bühne (`--color-moment-bg`). Level-Up-Events max. 1× pro Session.

---

### 10. Task-Komponenten

Alle in `src/components/edvance/tasks/`:

| Datei | Zeilen | Zweck |
|---|---|---|
| `MCWidget.tsx` | 48 | Multiple-Choice-Auswahl; kein Richtig/Falsch-Feedback |
| `MatchingWidget.tsx` | 120 | Drag-and-Drop-Zuordnung |
| `StepsWidget.tsx` | 44 | Schrittweise Lösung mit Checkbox-Fortschritt |
| `TaskAnswerArea.tsx` | 201 | Routing zu MC/Matching/Steps/DRAW je nach `input_type`; DRAW via `DrawCanvas` |
| `TaskAssetEditor.tsx` | 145 | Admin-Formular zum Anlegen/Bearbeiten von `task_assets` (Upload via `storage.ts`) |
| `TaskFilterBar.tsx` | 194 | Filterleiste für Tasks nach Fach, Cluster, Mikroskill, Schwierigkeit, `input_type` |
| `TaskMetaRow.tsx` | 74 | Meta-Zeile (Schwierigkeit, Kognitionstyp, Aufgabentyp) mit `EdvanceBadge` |
| `TaskPedagogyAccordion.tsx` | 98 | Aufklappbarer Bereich für pädagogische Hinweise / Lösungshinweis |
| `TaskPreviewCard.tsx` | 62 | Kompakte Vorschau-Card für Listen (`EdvanceCard` + `TaskMetaRow`) |
| `TaskQuestionBlock.tsx` | 170 | Aufgaben-Fragestellung inkl. Asset-Rendering (Bild/Audio/Video) |

---

### 11. Demo-Szenarien

Alle unter `/demo/*`, kein Auth-Gate, für Design-Präsentation und Onboarding:

| Route | Datei | Zeilen | Inhalt |
|---|---|---|---|
| `/demo/design` | `DesignDemo.tsx` | 113 | Einstiegs-Hub mit Links zu allen Szenarien |
| `/demo/student` | `ScenarioStudent.tsx` | 108 | MC-Widget + XPBar + MasteryBar + ToastBanner; Phase `idle→loading→done` |
| `/demo/celebration` | `ScenarioCelebration.tsx` | 94 | Level-Up-Screen mit `--gradient-levelup` + `animate-bounce-pop`; Reset-Button |
| `/demo/coach` | `ScenarioCoach.tsx` | 92 | Coach-Dashboard-Scenario |
| `/demo/session-end` | `ScenarioSessionEnd.tsx` | 99 | Session-Abschluss-Screen |
| `/demo/ui-kit` | `ScenarioUIKit.tsx` | 155 | Kompletter Komponenten-Showcase (Badges, Cards, Buttons, Tokens) |

Zusätzlich: `src/pages/student/TaskWidgetDemo.tsx` (193 Zeilen) — Demoseite für alle Task-Widgets ohne Auth, erreichbar via `/demo/widgets`.

---

## Architektur-Entscheidungen

**1. provision_student als Edge Function (nicht RPC direkt):** Die Auth Admin API für das Anlegen von Auth-Usern ist nur serverseitig verfügbar. Die Edge Function ist das einzige Stück, das `service_role` besitzt; die eigentliche DB-Logik liegt in der RPC `app_provision_student` (Security Definer), die vom Frontend nie direkt erreichbar ist.

**2. xp_events + student_progress via Trigger:** Schüler können `student_progress`-Totals nicht direkt schreiben. Kein `update`- oder `delete`-Policy auf `xp_events`. Der Trigger `apply_xp_event` (Security Definer) berechnet Level (`1 + xp_total / 500`) und Streak-Logik (Folgetag = +1, Lücke = Reset auf 1).

**3. screening_ratings append-only:** Coach-Bewertungen werden als separater Insert angelegt, um die `behavior_snapshots`-append-only-Semantik nicht zu verletzen. Die Verbindung erfolgt über `screening_test_id` als nullable FK auf `behavior_snapshots`.

**4. JSONB für screening_tests.generated_test:** Der generierte Test wird als `jsonb` im Aggregat gespeichert (Reproduzierbarkeit, YAGNI gegenüber Normalisierung). `result_summary` ebenfalls `jsonb`.

**5. tiers als DB-Katalog:** Die frühere TypeScript-Konstante `TIERS` in `onboarding/constants.ts` wurde vollständig durch die `tiers`-Tabelle ersetzt. Tarife sind zur Laufzeit bearbeitbar ohne Code-Deployment.

**6. DashboardTiles mit `anchor`-Prop:** Statt zwei separate Komponenten für React-Router-Links und Same-Page-Anker wurde ein `anchor?: boolean`-Flag eingeführt, das zwischen `<Link to>` und `<a href>` wählt.

**7. Design-Token-Hierarchie:** Level-Up-Türkis hat eine eigene semantische Schicht (`--color-levelup` für ruhige UI-Variante, `--color-moment-levelup` für leuchtende Moment-Bühne). Gold ist vereinheitlicht: Alltags-XP verwendet `--color-accent` (`#E8A020`), Celebration nutzt `--color-accent-celebration` (`#F5C842`). Streak-Repair-Lila (`--color-moment-repair`) ist als "seltenes Power-up" semantisch isoliert.

---

## Offene Punkte / Nächste Schritte

1. **Diagnostik-Content fehlt:** `is_diagnostic=true` Tasks müssen geseedet werden, damit `/screening` nicht leer bleibt. Aktuell zentrales Blocker für den echten Schüler-Flow.

2. **Browser-Verifikation durch Rasit:** U4-Conversion (`provisionStudent()` in Produktion) und `/screening`-DB-Resume müssen im Browser end-to-end getestet werden.

3. **DiagnosticsPage über 400 Zeilen:** `src/pages/admin/DiagnosticsPage.tsx` hat 427 Zeilen (Limit: 400). Empfehlung: `NewTaskForm`-Komponente in separate Datei auslagern.

4. **Inline-Styles in EdvanceLogo:** `EdvanceLogo` und `EdvanceAppIcon` nutzen Inline-Styles für dynamisch berechnete Pixel-Werte und die `fontFamily`-Deklaration (Space Grotesk). Die Wordmark-Schrift könnte als Tailwind-Plugin-Token (`font-wordmark`) definiert werden, um den Inline-Style für `fontFamily` zu eliminieren. Akzeptiert für jetzt, da es sich um wirklich dynamische Werte handelt.

5. **Auth-User-Cleanup bei provision_student-Fehler:** Wenn die RPC nach der Auth-User-Anlage fehlschlägt (z.B. unbekanntes Fach), werden die Auth-User nicht zurückgerollt. Manuelles Cleanup oder Retry-Logik fehlt noch.

6. **Home-Quest Flow:** Steht in der Roadmap, noch nicht begonnen.

7. **Lambacher-Schweizer-Import:** `/admin/lambacher-preview` ist vorbereitet, echter Bulk-Import steht noch aus.

8. **PR #16 Base-Branch:** CLAUDE.md §5 schreibt `dev` als Standard-Arbeitsbranch vor — bei PR-Erstellung prüfen.

---

## Datei-Übersicht

### Neue Migrations

| Datei | Inhalt |
|---|---|
| `migrations/008_task_source_constraint.sql` | `task_source`-Enum-Constraint |
| `migrations/009_task_assets.sql` | `task_assets`-Tabelle |
| `migrations/010_task_assets_storage_rls.sql` | Storage-RLS |
| `migrations/011_students_rls_fix.sql` | RLS-Fix Students |
| `migrations/012_leads.sql` | `leads` |
| `migrations/013_intake_sessions.sql` | `intake_sessions` |
| `migrations/014_screening.sql` | `screening_tests`, `screening_ratings` |
| `migrations/015_tiers_subscriptions.sql` | `tiers`, `student_subscriptions` |
| `migrations/016_student_coach.sql` | `student_coach` |
| `migrations/017_coaching_sessions.sql` | `coaching_sessions`, `session_students` |
| `migrations/018_student_task_progress.sql` | `student_task_progress` |
| `migrations/019_gamification.sql` | `student_progress`, `xp_events`, Trigger `apply_xp_event` |
| `migrations/020_parent_reports.sql` | `parent_reports` |
| `migrations/021_provision_student_fn.sql` | RPC `app_provision_student` |

### Neue Supabase-Lib-Dateien

`src/lib/supabase/behavior.ts`, `intake.ts`, `leads.ts`, `parentReports.ts`, `profiles.ts`, `progress.ts`, `provision.ts`, `screening.ts`, `screeningRatings.ts`, `sessions.ts`, `storage.ts`, `studentCoach.ts`, `students.ts`, `subscriptions.ts`, `taskProgress.ts`, `tasks.ts` (erweitert), `tiers.ts`

### Neue Seiten

| Datei | Route |
|---|---|
| `src/pages/admin/DiagnosticsPage.tsx` | `/admin/diagnostics` |
| `src/pages/admin/LeadsPage.tsx` | `/admin/leads` |
| `src/pages/admin/TiersPage.tsx` | `/admin/tiers` |
| `src/pages/admin/LambacherPreview.tsx` | `/admin/lambacher-preview` |
| `src/pages/coach/IntakePage.tsx` | `/coach/intake` |
| `src/pages/demo/DesignDemo.tsx` | `/demo/design` |
| `src/pages/demo/ScenarioCelebration.tsx` | `/demo/celebration` |
| `src/pages/demo/ScenarioCoach.tsx` | `/demo/coach` |
| `src/pages/demo/ScenarioSessionEnd.tsx` | `/demo/session-end` |
| `src/pages/demo/ScenarioStudent.tsx` | `/demo/student` |
| `src/pages/demo/ScenarioUIKit.tsx` | `/demo/ui-kit` |
| `src/pages/student/TaskWidgetDemo.tsx` | `/demo/widgets` |

### Neue Komponenten

| Datei | Exportiert |
|---|---|
| `src/components/brand/EdvanceLogo.tsx` | `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon` |
| `src/components/edvance/DashboardTiles.tsx` | `DashboardTiles`, `DashboardTile` |
| `src/components/edvance/tasks/MCWidget.tsx` | `MCWidget` |
| `src/components/edvance/tasks/MatchingWidget.tsx` | `MatchingWidget` |
| `src/components/edvance/tasks/StepsWidget.tsx` | `StepsWidget` |
| `src/components/edvance/tasks/TaskAnswerArea.tsx` | `TaskAnswerArea` |
| `src/components/edvance/tasks/TaskAssetEditor.tsx` | `TaskAssetEditor` |
| `src/components/edvance/tasks/TaskFilterBar.tsx` | `TaskFilterBar` |
| `src/components/edvance/tasks/TaskMetaRow.tsx` | `TaskMetaRow` |
| `src/components/edvance/tasks/TaskPedagogyAccordion.tsx` | `TaskPedagogyAccordion` |
| `src/components/edvance/tasks/TaskPreviewCard.tsx` | `TaskPreviewCard` |
| `src/components/edvance/tasks/TaskQuestionBlock.tsx` | `TaskQuestionBlock` |

### Neue Design-/Asset-Dateien

| Datei | Inhalt |
|---|---|
| `src/styles/tokens.css` | Vollständiges CSS-Custom-Property-Token-System |
| `public/brand/edvance-symbol.svg` | J-Kurven-Symbol |
| `public/brand/edvance-logo-light.svg` | Wordmark hell |
| `public/brand/edvance-logo-dark.svg` | Wordmark dunkel |
| `public/brand/edvance-app-icon.svg` | App-Icon |
| `public/brand/edvance-favicon.svg` | Favicon |

### Edge Function

`supabase/functions/provision_student/` — atomare Lead-zu-Student-Conversion (service_role)

---

## TypeScript-Status

`npx tsc --noEmit` — **Exit Code 0, keine Fehler.**
