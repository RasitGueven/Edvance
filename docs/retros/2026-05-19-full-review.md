# Retro: Full Branch Review — 2026-05-19

Branch: `claude/sweet-ramanujan-ltgGT` vs `main`

---

## Überblick

- **Gesamtzahl geänderter Dateien:** 104 (A=77, M=25, D=2)
- **Diff-Umfang:** +9 337 / -871 Zeilen (netto ~+8 466 LOC)
- **Zeitraum:** ca. 2026-05-14 bis 2026-05-17
- **Merges aus feature-Branches:**
  - `feature/task-input-widgets` (#13, #14)
  - `feature/asset-generator` (#12)
  - `feature/task-preview-redesign` (#12–14)
  - `feature/design-system-premium` (#15)
  - `feature/real-data-program` (#16, #17)
  - `feature/levelup-tuerkis` (#18)
- **Commits auf dem Branch:** 52 (inkl. 4 Merge-Commits)

---

## Was wurde gebaut (Feature-Übersicht)

### Brand & Design System

- **Design-System-Foundation** (`src/styles/globals.css`, `src/styles/tokens.css`):
  CSS-Custom-Properties für alle Farb-, Spacing- und Shadow-Tokens; Tailwind-`@theme inline`-Mappings; Animations-Utilities (`animate-bounce-pop`, `animate-fade-in`, `animate-scale-in`, `animate-xp-pulse`, `animate-skeleton`).
- **Level-Up Türkis** (`tokens.css`): Dedizierte Moment-Tokens für Level-Up (`--color-levelup`, `--color-moment-levelup`, `--gradient-levelup`, `--shadow-glow-levelup`), Streak-Repair (`--color-moment-repair`, `--gradient-repair`), Gold vereinheitlicht (`--color-accent` = #E8A020).
- **EdvanceLogo** (`src/components/brand/EdvanceLogo.tsx`): SVG-Komponente aus Design-Handoff mit Varianten `symbol`, `wordmark`, `dark`, `light` sowie statischen Brand-Asset-SVGs in `public/brand/`.
- **Wordmark in Navbar** (`src/components/edvance/EdvanceNavbar.tsx`): Space-Grotesk als Logotype-Font via `index.html`.
- **Demo-Screens** (`src/pages/demo/`): `/demo/design` mit 5 Live-Szenarien (Student, Coach, Session-End, Celebration, UI-Kit); `/demo/widgets` zeigt Task-Widgets ohne Login.

### Datenbankmigrationen (010–021)

Siehe eigener Abschnitt unten.

### Frontend — Seiten & Komponenten

**Admin:**
- `src/pages/admin/LeadsPage.tsx` — Lead-Erfassung + Listenansicht + Status-Workflow (neu → kontaktiert → Onboarding geplant → konvertiert / abgelehnt); Lead-zu-Schüler-Konvertierung via `provisionStudent()`.
- `src/pages/admin/TiersPage.tsx` — Tarif-Verwaltung (CRUD) aus DB-Katalog statt hartkodierter Konstante.
- `src/pages/admin/DiagnosticsPage.tsx` — Admin-Oberfläche zum manuellen Seeden von Diagnoseaufgaben (`is_diagnostic=true`); ruft `createDiagnosticTask` und `updateTaskDiagnostic`.
- `src/pages/admin/LambacherPreview.tsx` — Refactored auf neue Task-Komponenten.

**Coach:**
- `src/pages/coach/IntakePage.tsx` — Erstgespräch-Protokoll-Formular (draft → final); verknüpft Schüler + Lead + Coach; persistiert in `intake_sessions`.
- `src/pages/coach/CoachDashboard.tsx` — MOCK_SESSIONS entfernt; echte Sessions + Anwesenheitstracking aus `coaching_sessions`/`session_students`.

**Schüler:**
- `src/pages/student/StudentDashboard.tsx` — XP, Streak, Level aus `student_progress`; Cluster-Grid mit CSS-Variable-Tints.
- `src/pages/student/ClusterView.tsx` — Aufgaben-Fortschritt aus `student_task_progress` statt localStorage.
- `src/pages/student/TaskPlayer.tsx` — Task-Widget-Integration; `TaskAnswerArea` eingebunden.
- `src/pages/student/TaskWidgetDemo.tsx` — Demo/Test-Seite für Widgets.

**Eltern:**
- `src/pages/parent/ParentDashboard.tsx` — Echte Kind-Daten (Name, Klasse, XP, Streak, Reports) aus DB statt Stub.

**Diagnose/Screening:**
- `src/pages/DiagnosisSession.tsx` — De-mockt; nutzt echten Generator + DB-Content; inline Styles für dynamische Farb-Visualisierungen (über CSS-Variablen-Lookup).
- `src/pages/DiagnosisResult.tsx` — De-mockt; Ergebnis-Darstellung mit komponierten Charts; dynamische Farben über CSS-Variablen.
- `src/context/DiagnosisContext.tsx` — localStorage vollständig entfernt; `/screening`-Route mit DB-Persistenz, Resume und Coach-Rating.

**Task-Komponenten:**
- `src/components/edvance/tasks/MCWidget.tsx` — Multiple-Choice-Widget.
- `src/components/edvance/tasks/MatchingWidget.tsx` — Zuordnungs-Widget mit SVG-Verbindungslinien.
- `src/components/edvance/tasks/StepsWidget.tsx` — Schrittweise Eingabe.
- `src/components/edvance/tasks/TaskAnswerArea.tsx` — Dispatcher für alle Widget-Typen (MC, MATCHING, STEPS, DRAW, FREE_INPUT).
- `src/components/edvance/tasks/TaskAssetEditor.tsx` — Asset-Upload-UI für Admin.
- `src/components/edvance/tasks/TaskFilterBar.tsx`, `TaskMetaRow.tsx`, `TaskPedagogyAccordion.tsx`, `TaskPreviewCard.tsx`, `TaskQuestionBlock.tsx` — Bausteine für LambacherPreview/Admin.
- `src/components/edvance/DashboardTiles.tsx` — Schnellzugriff-Kacheln für Schüler-/Coach-/Eltern-Dashboard.

**shadcn/ui-Anpassungen:**
- `src/components/ui/badge.tsx`, `button.tsx`, `card.tsx` — Varianten-Erweiterungen (levelup, repair, moment).
- `src/components/ui/index.ts` — Barrel-Export.

### Supabase-Lib (Datenzugriffsschicht)

Alle neuen Module in `src/lib/supabase/` folgen dem `SupabaseResult<T>`-Muster mit try/catch:

| Datei | Zweck |
|---|---|
| `leads.ts` | CRUD + Status-Workflow für leads |
| `students.ts` | Schüler-Abfragen + Fach-Mapping + `listStudentsWithName` |
| `intake.ts` | Erstgespräch-Protokolle |
| `subscriptions.ts` | Tarif-Abonnements |
| `tiers.ts` | Tarif-Katalog (lesen + admin-CRUD) |
| `studentCoach.ts` | Coach-Zuordnung |
| `screening.ts` | Screening-Tests (create/complete/abort/getActive) |
| `screeningRatings.ts` | Coach-Bewertungen (append-only insert) |
| `sessions.ts` | Coaching-Sessions + Anwesenheit |
| `taskProgress.ts` | Aufgaben-Fortschritt pro Schüler |
| `progress.ts` | XP-Events + student_progress |
| `parentReports.ts` | Elternreports (Coach erstellt, Eltern lesen) |
| `provision.ts` | Edge-Function-Wrapper für Lead→Schüler-Konvertierung |
| `storage.ts` | Asset-Upload in `task-assets`-Bucket |
| `profiles.ts` | Ergänzt um `getCoaches()` |
| `behavior.ts` | Erweitert um `screening_test_id` |

**Gelöscht:** `src/lib/mockData.ts`, `src/lib/diagnosisMockData.ts`.

**Screening Runtime:** `src/lib/screening/runtime.ts` — Laufzeit-Hilfsfunktionen für den Screening-Flow (rebuildRunTasks, deterministische Wiederherstellung aus `generated_test`-JSONB).

**Edge Function:** `supabase/functions/provision_student/index.ts` — Deno, läuft mit service_role (vom Runtime injiziert, nicht im Frontend-Bundle). Führt Auth-User-Anlage (Schüler + optionales Eltern-Invite) + atomare RPC `app_provision_student` + Cleanup-bei-Fehler aus.

**Asset-Generator:** `scripts/generate-assets.ts` — Node-Script zur SVG-Generierung via Anthropic-API (nur für Dev-Workflow, nicht im Produktionsbundle).

### Typen & Konfiguration

- `src/types/index.ts`: 462 Zeilen; vollständiges Domain-Modell (Lead, Student, IntakeSession, TierPlan, StudentSubscription, StudentCoach, ScreeningTest, ScreeningRating, CoachingSession, StudentTaskProgress, StudentProgress, XpEvent, ParentReport u.a.).
- `src/types/payloads.ts`: Payload-Typen für die Edge Function.
- `.env.example`: Ergänzt um `SUPABASE_SERVICE_ROLE_KEY` (nur für Scripts) und `ANTHROPIC_API_KEY` (generate-assets) mit explizitem Hinweis "Niemals committen".

---

## Architektur-Entscheidungen

1. **Append-only strikt durchgehalten:** Coach-Screening-Bewertungen landen als separater Insert in `screening_ratings` — kein ALTER auf `behavior_snapshots`. `xp_events` ebenso append-only; `student_progress`-Totals werden ausschließlich durch Security-Definer-Trigger `apply_xp_event` abgeleitet (kein direktes Client-Write auf die Aggregat-Tabelle).

2. **Non-recursive RLS via Security-Definer-Helper:** `get_my_student_id()` und `is_parent_of_student()` vermeiden Policy-Rekursion beim Join über mehrere Tabellen. Muster aus Mig 011 durchgehend in 012–021 verwendet.

3. **Atomare Lead→Schüler-Conversion:** plpgsql-RPC `app_provision_student` (Mig 021) erledigt den gesamten DB-Teil (profiles → students → parent_student → student_subjects → student_coach → student_subscriptions → leads.status) in einer einzigen impliziten Transaktion. Die Edge Function ist nur für die Auth-Admin-API-Aufrufe nötig (anon-Key hat keine Auth-Admin-Rechte).

4. **JSONB statt Normalisierung für Diagnose-Tests:** `generated_test` und `result_summary` in `screening_tests` als JSONB — Reproduzierbarkeit und Versionierung über `generated_test_version`-Integer, YAGNI statt vorzeitiger Normalisierung.

5. **Supabase-Aufruf-Segregation:** Alle Supabase-Calls ausschließlich in `src/lib/supabase/`; kein direkter Client-Zugriff in Pages oder Components. Edge Function ist serverseitiger Code und von der Regel ausgenommen.

6. **Mock-Sweep abgeschlossen:** Keine `MOCK_*`-Konstanten mehr in Runtime-Pfaden. `mockData.ts` und `diagnosisMockData.ts` gelöscht. Letzter verbliebener localStorage ist `ThemeContext` (kosmetisch, bewusst beibehalten).

7. **Brandname-Fonts:** Space Grotesk als Logotype-Font über Google Fonts in `index.html` geladen; EdvanceLogo als React-Komponente mit SVG-Paths aus Design-Handoff statt externe Bilddateien.

---

## Datenbankschema-Änderungen

| Migration | Inhalt |
|---|---|
| 010 | RLS-Policies für `task-assets` Storage-Bucket: Admins können hochladen/aktualisieren/löschen; Public-Read bleibt am Bucket. |
| 011 | RLS-Fix für `students`/`parent_student`/`student_subjects` (waren default-deny). Security-Definer-Helper `get_my_student_id()` + `is_parent_of_student()`. |
| 012 | Tabelle `leads` mit Status-Workflow (new → contacted → onboarding_scheduled → converted/rejected). RLS: nur Coach/Admin. |
| 013 | Tabelle `intake_sessions` (Erstgespräch-Protokoll, draft→final). Coach/Admin Vollzugriff; Eltern lesen Protokoll des eigenen Kindes. |
| 014 | Tabellen `screening_tests` (mutierbares Aggregat) + `screening_ratings` (append-only Coach-Bewertungen). Partial-Unique-Index verhindert doppelte aktive Tests pro (Schüler, Fach). FK `behavior_snapshots.screening_test_id` (additiv nullable). |
| 015 | Tabellen `tiers` (DB-Katalog) + `student_subscriptions`. Initialer Seed mit Basic/Standard/Premium. Ersetzt hartkodierte TIERS-Konstante in Frontend. |
| 016 | Tabelle `student_coach` (Coach-Zuweisung). Admin-Vollzugriff; Coach/Schüler/Eltern lesen eigene Zeilen. |
| 017 | Tabellen `coaching_sessions` + `session_students` (Session-Betrieb + Anwesenheit). Coach verwaltet eigene Sessions; Schüler/Eltern lesen Sessions, in denen der Schüler eingetragen ist. (WICHTIG: beide Tabellen vor Policies angelegt — war initialer Reihenfolge-Bug in Mig 017, per fix-commit `e0efa3e` korrigiert.) |
| 018 | Tabelle `student_task_progress` (Aufgaben-Fortschritt). Ersetzt localStorage `edvance_task_progress_v1`. |
| 019 | Tabellen `student_progress` (Aggregat) + `xp_events` (append-only). Trigger `apply_xp_event` (Security Definer) berechnet XP-Total, Level (= 1 + xp_total/500) und Streak deterministisch. |
| 020 | Tabelle `parent_reports` (Elternreport draft→published). Eltern/Schüler sehen nur veröffentlichte Reports. |
| 021 | Funktion `app_provision_student` (plpgsql, SECURITY DEFINER). EXECUTE-Recht nur für `service_role`; anon/authenticated explizit revoked. Atomare Lead→Schüler-Konvertierung in einer Transaktion. |

---

## Komponenten & Seiten

### Neue Komponenten (Auswahl)

| Datei | Zweck |
|---|---|
| `src/components/brand/EdvanceLogo.tsx` | SVG-Logo-Varianten (Symbol, Wordmark, Dark, Light) |
| `src/components/edvance/DashboardTiles.tsx` | Schnellzugriff-Kacheln (Schüler/Coach/Eltern) |
| `src/components/edvance/tasks/MCWidget.tsx` | Multiple-Choice-Eingabe |
| `src/components/edvance/tasks/MatchingWidget.tsx` | Zuordnungs-Widget mit SVG-Connector |
| `src/components/edvance/tasks/StepsWidget.tsx` | Schrittweise Eingabe |
| `src/components/edvance/tasks/TaskAnswerArea.tsx` | Widget-Dispatcher (MC/MATCHING/STEPS/DRAW/FREE_INPUT) |
| `src/components/edvance/tasks/TaskAssetEditor.tsx` | Asset-Upload für Admin |
| `src/components/edvance/tasks/TaskFilterBar.tsx` | Filter-Leiste (Suche, Kognitionstyp, Schwierigkeit) |
| `src/components/edvance/tasks/TaskMetaRow.tsx` | Meta-Zeile (Schwierigkeit, Minuten, Quelle) |
| `src/components/edvance/tasks/TaskPedagogyAccordion.tsx` | Aufklappbare Pädagogik-Infos |
| `src/components/edvance/tasks/TaskPreviewCard.tsx` | Zusammengesetzte Preview-Card |
| `src/components/edvance/tasks/TaskQuestionBlock.tsx` | Frage-Block mit Cognitive-Hero-Visualisierung |
| `src/lib/screening/runtime.ts` | Screening-Laufzeit-Hilfsfunktionen |
| `src/pages/admin/LeadsPage.tsx` | Lead-Management-UI |
| `src/pages/admin/TiersPage.tsx` | Tarif-Verwaltungs-UI |
| `src/pages/admin/DiagnosticsPage.tsx` | Diagnoseaufgaben-Seeding-UI |
| `src/pages/coach/IntakePage.tsx` | Erstgespräch-Protokoll |
| `src/pages/demo/DesignDemo.tsx` + 5 Szenarien | Design-System-Showcase |

### Geänderte Kernseiten (Verhaltenssänderung)

| Datei | Änderung |
|---|---|
| `src/pages/coach/CoachDashboard.tsx` | MOCK_SESSIONS → DB |
| `src/pages/student/StudentDashboard.tsx` | Hardcoded XP/Streak → `student_progress` |
| `src/pages/student/ClusterView.tsx` | localStorage → `student_task_progress` |
| `src/pages/parent/ParentDashboard.tsx` | Stub → echte Kind-Daten + Reports |
| `src/pages/DiagnosisSession.tsx` | Mock-Engine → echter Generator + DB-Content |
| `src/pages/DiagnosisResult.tsx` | Mock-Ergebnis → echte Auswertung |
| `src/context/DiagnosisContext.tsx` | localStorage komplett entfernt |
| `src/pages/admin/AdminDashboard.tsx` | MOCK_COACHES → getCoaches(); Provision-Flow |

---

## Bekannte offene Punkte / TODOs

1. **Diagnostik-Content fehlt:** `tasks.is_diagnostic = true` ist noch nicht geseedet. `/screening` zeigt deshalb den korrekten `EmptyState`, ist aber inhaltlich leer. Voraussetzung für den echten Screening-Flow.

2. **Browser-Verifikation ausstehend:** U4 (Lead→Schüler-Conversion im Browser), U5c (kompletter `/screening`-Durchlauf mit DB-Resume) wurden noch nicht durch Rasit im Browser getestet.

3. **Zwei-Geräte-Sync (Schüler-Tablet + Coach):** Im DB-Modus kein Cross-Tab-Sync mehr (vorher localStorage). Echtes Realtime (Supabase Subscriptions) ist separater Folgeschritt.

4. **Branch-Base-Abweichung:** PR #16 wurde gegen `main` statt `dev` geöffnet (Abweichung von CLAUDE.md §5 Branch-Strategie, Entscheidung Rasit).

5. **Level/Streak-Regel vorläufig:** `level = 1 + xp_total / 500` ist eine erste Default-Fassung — mit Rasit zu schärfen (Epic U9).

6. **DiagnosisResult.tsx und DiagnosisSession.tsx über 400 Zeilen:** 946 bzw. 764 Zeilen — übersteigen das Dateigrößen-Limit aus CLAUDE.md §4. Refactoring auf Unterkomponenten ausstehend.

7. **edvance/index.tsx über 400 Zeilen:** 559 Zeilen — ebenfalls Refactoring-Kandidat.

8. **DiagnosticsPage.tsx 427 Zeilen:** Leicht über Limit; Kandidat für Aufspaltung in Form- und Listen-Unterkomponenten.

9. **Hardcodierte Hex-Farben in Widget-Code:** Mehrere Verstöße gegen "keine hardcodierten Farben" (CLAUDE.md §4, §11):
   - `src/components/edvance/tasks/MatchingWidget.tsx` Zeilen 14–17: TINTS-Array mit #2D6A9F, #16a34a, #d97706, #7c3aed direkt als Hex-Strings.
   - `src/components/edvance/tasks/MCWidget.tsx` Zeile 37: `color: active ? '#fff' : 'var(--primary)'` — #fff sollte `'var(--background)'` oder `'white'` über CSS-Variable sein.
   - `src/components/edvance/DrawCanvas.tsx` Zeilen 14/16: `STROKE_COLOR = '#0F172A'`, `BG_COLOR = '#FFFFFF'` — technisch vertretbar für Canvas-API (kein CSS-Kontext), aber idealer via CSS-Variable.
   - `src/components/edvance/index.tsx` Zeilen 309–310: AVATAR_PALETTE mit 8 Hex-Strings — kein CSS-Custom-Property-Equivalent vorhanden.
   - `src/pages/student/StudentDashboard.tsx` Zeile 305: `fg: '#9A6B00'` in CLUSTER_TINTS.
   - `src/components/brand/EdvanceLogo.tsx` Zeilen 19–22: COLORS-Objekt mit 4 Brand-Hex-Werten — vertretbar für SVG-Brand-Asset, aber sollte auf `tokens.css`-Variablen zeigen.

10. **Statisches `boxShadow` in Inline-Styles:** `AdminDashboard.tsx` Zeilen 71/183 und `CoachDashboard.tsx` Zeilen 82/110 verwenden `style={{ boxShadow: SHADOW_CARD }}` statt der `shadow-card` Tailwind-Utility — explizit verboten laut CLAUDE.md §11 ("Statische boxShadow in Inline-Styles — die shadow-* Utilities nutzen").

11. **`flexShrink: 0` Inline-Style** in einer Komponente (aus dem Diff): ersetzbar durch `shrink-0` Tailwind-Klasse.

12. **Mathebuch-Import (Lambacher Schweizer 8. Klasse NRW):** In der Roadmap aber noch nicht begonnen.

13. **Home-Quest Flow:** Noch nicht begonnen.

---

## TypeScript-Status

`npm run lint` (= `tsc -b --noEmit`) läuft sauber durch — keine Fehler, keine Warnungen.

```
> edvance@0.0.0 lint
> tsc -b --noEmit
```

Hinweis: Die Solution-tsconfig (`tsconfig.json` mit `files: []`) schließt `scripts/*.ts` und `vite.config.ts` aus dem Check aus. Diese Dateien zeigen bei isoliertem `npx tsc --noEmit` Fehler wegen fehlender `@types/node` — das ist bekanntes, bewusstes Setup (scripts laufen via `tsx`/`ts-node`, nicht über den Vite-Build).
