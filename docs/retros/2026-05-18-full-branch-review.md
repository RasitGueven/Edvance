# Retro 2026-05-18 — Full Branch Review: claude/sweet-ramanujan-G7QEM vs. main

Branch enthält die Merges von `feature/real-data-program` (PR #16+#17) und
`feature/levelup-tuerkis` (PR #18). 104 geänderte Dateien, +9337/-871 Zeilen,
~30 Commits.

## Übersicht

Der Branch transformiert Edvance vom Mock-Prototyp zur echten Produktionsplattform:
Alle Dashboards laufen auf Echtdaten aus Supabase, ein vollständiger
Supabase-Lib-Layer ist etabliert, 12 Datenbank-Migrationen bauen das operative
Schema auf (Leads → Intake → Screening → Gamification → Elternreports), und das
Brand- sowie Farbsystem ist finalisiert mit eigenem Logo, SVG-Assets und einem
vollständigen Emotion-Token-Set (Level-Up-Türkis, Repair-Lila, XP-Gold).

---

## 1. Brand & Design-System

**EdvanceLogo-Komponente** (`src/components/brand/EdvanceLogo.tsx`): Inline-SVG-
Wordmark mit Light-/Dark-Variante, eingebunden in `EdvanceNavbar`.

**Brand-Assets** (`public/brand/`): Fünf SVG-Dateien – App-Icon, Favicon, Logo
Light, Logo Dark, Symbol. Alle Farben sind SVG-intern als Markenwerte gesetzt
(korrekt, da Bild-Assets, nicht UI-Komponenten).

**Farbsystem-Tokens** (`src/styles/tokens.css`, `src/styles/globals.css`):
- Neue Emotion-Token-Gruppe: `--color-levelup #0E9E96` (Badge/UI),
  `--color-moment-levelup #19C9BC` (auf Navy), `--color-levelup-on #04302D` (Text)
- Gradient + Glow: `--gradient-levelup`, `--shadow-glow-levelup`
- Streak-Repair: `--color-moment-repair #8B5CF6`, `--gradient-repair`
- XP-Badge-Hintergrund: `--color-accent-light #FBEAD0`
- Legacy-Aliase auf Single-Source umgebogen: `--xp-gold` → `--color-accent`,
  `--xp-gold-light` → `--color-accent-light`, `--level-purple` → `--color-moment-repair`
- `@theme inline`-Mappings + Utility-Klassen `.bg-gradient-levelup`,
  `.bg-gradient-repair`, `.shadow-glow-levelup`

**Consumer-Updates**: `EdvanceBadge` erhält Varianten `levelup` + `repair`;
`ToastBanner` erhält Typ `levelup`; `ScenarioCelebration` zeigt Türkis-Gradient
auf Navy.

---

## 2. Datenbank — Migrationen 010–021

| Migration | Inhalt |
|---|---|
| 010 | RLS-Policies für Storage-Bucket `task-assets` |
| 011 | RLS-Fix für `students` / `parent_student` / `student_subjects` (waren default-deny); Security-Definer-Helper `get_my_student_id()`, `is_parent_of_student()` |
| 012 | Tabelle `leads` — Erstkontakt vor Account-Anlage, Status-Workflow `new→converted` |
| 013 | Tabelle `intake_sessions` — strukturiertes Erstgespräch-Protokoll (draft/final) |
| 014 | Tabellen `screening_tests` + `screening_ratings` (append-only) + FK `behavior_snapshots.screening_test_id` |
| 015 | Tabellen `tiers` + `student_subscriptions` — Tarif-Katalog DB-seitig statt Hardcode |
| 016 | Tabelle `student_coach` — Schüler-Coach-Zuordnung (n:m, mit Primär-Flag) |
| 017 | Tabellen `coaching_sessions` + `session_students` — Session-Betrieb + Anwesenheit |
| 018 | Tabelle `student_task_progress` — aufgabenbezogener Lernfortschritt |
| 019 | Tabellen `student_progress` + `xp_events` (append-only) — Gamification-Kern; Trigger `apply_xp_event` kalkuliert Level automatisch |
| 020 | Tabelle `parent_reports` — strukturierte Elternberichte pro Berichtsperiode |
| 021 | Atomare RPC `app_provision_student` (SECURITY DEFINER, nur service_role) — Lead→Student-Conversion in einer plpgsql-Transaktion |

Alle Migrationen tragen den Hinweis zur expliziten Rasit-Freigabe vor Ausführung.

---

## 3. Supabase-Lib-Layer (`src/lib/supabase/`)

Alle Dateien verwenden `SupabaseResult<T>` + try/catch. Kein direkter
Supabase-Aufruf in Komponenten oder Pages.

| Datei | Kernfunktionen |
|---|---|
| `behavior.ts` | `insertBehaviorSnapshot` (um `screening_test_id` erweitert) |
| `intake.ts` | `createIntakeSession`, `updateIntakeSession`, `getIntakeSessions` |
| `leads.ts` | `createLead`, `listLeads` (mit Status-Filter), `updateLeadStatus` |
| `parentReports.ts` | `getParentReport`, `listParentReports` |
| `progress.ts` | `getStudentProgress`, `addXpEvent` |
| `provision.ts` | `provisionStudent` — Edge-Function-Wrapper |
| `screening.ts` | `createScreeningTest`, `getActiveScreeningTest`, `completeScreeningTest` |
| `screeningRatings.ts` | `upsertScreeningRating`, `getScreeningRatings` |
| `sessions.ts` | `listCoachSessions`, `getSessionStudents`, `updateAttendance` |
| `storage.ts` | `uploadTaskAsset`, `getTaskAssetUrl` |
| `studentCoach.ts` | `assignCoach`, `getStudentCoach` |
| `students.ts` | `getStudent`, `listStudentsWithName`, Subject-Mapping |
| `subscriptions.ts` | `getStudentSubscription`, `createSubscription` |
| `taskProgress.ts` | `upsertTaskProgress`, `getClusterProgress` |
| `tasks.ts` | `getTask`, `listTasks`, `updateTaskDiagnostic`, `createDiagnosticTask` |
| `tiers.ts` | `listTiers`, `getTier` |

---

## 4. Real-Data-Programm — Mock-Entfernung

| Unit | Vorher (Mock) | Nachher (Echt) |
|---|---|---|
| U1 Coach-Auswahl | `MOCK_COACHES` Konstante | `getCoaches()` via `profiles.ts` |
| U2 Leads-Liste | statisch | Echtdaten aus `leads`-Tabelle |
| U3 Intake-Protokoll | statisch | `intake_sessions` DB mit draft/final |
| U4 Onboarding | keine Persistenz | `provisionStudent()` → Edge Function → RPC 021 |
| U5a/b Diagnose-Engine | `mockDiagnosisTasks.ts` | echter Task-Generator + DB-Content |
| U5c Screening-Flow | localStorage | `screening_tests` + `screening_ratings` DB; DB-Resume |
| U6 Tarif-Auswahl | `TIERS`-Konstante im Code | DB-Katalog via `tiers.ts` |
| U7 CoachDashboard | `mockData.ts` | echte Sessions + Anwesenheit |
| U8 ClusterView | localStorage-Fortschritt | `student_task_progress` DB |
| U9 StudentDashboard | statische XP/Streak-Werte | `student_progress` + `xp_events` |
| U10 ParentDashboard | Stub-Daten | echte Kind-Daten + `parent_reports` |

Gelöschte Mock-Dateien: `src/lib/diagnosisMockData.ts`, `src/lib/mockData.ts`.
Einziger verbleibender localStorage: `ThemeContext` (kosmetisch, bewusst beibehalten).

---

## 5. Neue Pages & Features

| Route | Datei | Zweck |
|---|---|---|
| `/admin/leads` | `LeadsPage.tsx` | Lead-Erfassung + Liste + Status-Workflow; Lead→Schüler-Konvertierung |
| `/admin/tiers` | `TiersPage.tsx` | Tarif-Verwaltung (DB-Katalog, CRUD) |
| `/admin/diagnostics` | `DiagnosticsPage.tsx` | Admin-Oberfläche zum manuellen Seeden von Diagnostik-Content |
| `/coach/intake` | `IntakePage.tsx` | Erstgespräch-Protokoll Stufe B (draft→final) |
| `/student/task/:taskId` | `TaskPlayer.tsx` | Aufgaben-Player mit Widget-Routing |
| `/demo/widgets` | `TaskWidgetDemo.tsx` | Entwickler-Demo aller Task-Widgets |
| `/demo/design` | `DesignDemo.tsx` | Design-System-Demo (Farbsystem, Animations) |
| `/demo/design` (Szenarien) | `ScenarioCelebration`, `ScenarioCoach`, `ScenarioStudent`, `ScenarioSessionEnd`, `ScenarioUIKit` | Interaktive Szenarien für Brand-/UX-Review |

Bestehende Pages mit wesentlichen Updates: `StudentDashboard` (XP/Streak-Anbindung,
DashboardTiles), `CoachDashboard` (echte Sessions), `ParentDashboard` (echte Kind-
Daten), `DiagnosisSession` + `DiagnosisResult` (localStorage entfernt),
`AdminDashboard` (provisionStudent-Anbindung).

---

## 6. Task-Widget-System

Neues Verzeichnis `src/components/edvance/tasks/`:

| Komponente | Funktion |
|---|---|
| `MCWidget` | Multiple-Choice-Widget (Schüler-Ansicht, kein richtig/falsch-Feedback) |
| `MatchingWidget` | Zuordnungs-Aufgaben |
| `StepsWidget` | Schrittweise geführte Aufgaben |
| `TaskAnswerArea` | Einheitliche Antwort-Eingabefläche mit Routing zu den Widgets |
| `TaskAssetEditor` | Asset-Upload für Admin/Coach (Bild, Audio, PDF) via `storage.ts` |
| `TaskFilterBar` | Filter-Leiste für Aufgabenlisten (Schwierigkeit, Typ, Fach) |
| `TaskMetaRow` | Metadaten-Zeile (Schwierigkeit, Dauer, Kognitionstyp) |
| `TaskPedagogyAccordion` | Aufklappbare Coach-Notizen + Interventions-Hinweise |
| `TaskPreviewCard` | Kompakte Aufgaben-Vorschau für Listen/Grids |
| `TaskQuestionBlock` | Frage-Rendering mit MathContent-Integration |

Architektur: `TaskPlayer.tsx` routet per `input_type` auf das passende Widget.
MathContent (`src/lib/render/MathContent.tsx`) + `taskQuestionParser.ts` rendern
LaTeX/Text aus `question_payload`.

---

## 7. Screening & Onboarding — Flow-Beschreibung

**Screening** (`/screening`, geschützt):
1. `getActiveScreeningTest` prüft DB auf offenen Test → Resume oder Neustart
2. `createScreeningTest` legt `screening_tests`-Eintrag mit `generated_test`-JSONB an
3. Jede Schülerantwort → `insertBehaviorSnapshot` mit `screening_test_id`
4. Coach-Rating → `upsertScreeningRating` in `screening_ratings` (append-only)
5. `completeScreeningTest` schließt Test ab und setzt `completed_at`
6. DB-Resume: `rebuildRunTasks` aus gespeichertem `generated_test` + vorhandenen Snapshots

**Onboarding / Lead-Konvertierung** (`/admin/leads`):
1. Lead anlegen (Stufe A) → `createLead` → Status `new`
2. Erstgespräch (Stufe B) → `createIntakeSession` / `updateIntakeSession`
3. Konvertierung: `provisionStudent()` → Edge Function `provision_student` (Deno,
   service-role) → Auth-User für Schüler + Eltern-Invite → RPC `app_provision_student`
   → atomare DB-Anlage (Student, Profil, Subscription, Coach-Zuordnung)
4. Lead-Status → `converted`

---

## 8. Gamification

- `DashboardTiles` (`src/components/edvance/DashboardTiles.tsx`): Schnellzugriff-
  Kacheln für Schüler-, Coach- und Eltern-Dashboard mit Shortcuts zu häufigen Aktionen
- `StudentDashboard`: XP-Wert + Streak aus `student_progress` via `getStudentProgress()`
- `xp_events`-Tabelle: append-only, Trigger `apply_xp_event` kalkuliert Level nach
  jeder Eintragung automatisch
- Token-System für alle Gamification-Momente vollständig in `tokens.css` definiert
  (XP-Gold, Level-Up-Türkis, Repair-Lila, Boss-Grün, Streak-Rot)
- Vollständige UI-Flows für Streak-Repair und Boss-Challenges sind als separater Schritt
  vorgesehen (Tokens und Badge-Varianten sind vorbereitet)

---

## 9. Types & Payloads

`src/types/index.ts` von ~150 auf 461 Zeilen gewachsen. Neue Typen:

- `Lead`, `LeadInput`, `LeadStatus`, `LeadGoal` — Lead-Domain
- `IntakeSession`, `IntakeSessionInput` — Erstgespräch
- `ScreeningTest`, `ScreeningTestStatus` — Screening-Domain
- `Tier`, `StudentSubscription` — Tarif/Abo
- `CoachingSession`, `SessionStudent`, `AttendanceRecord` — Session-Betrieb
- `StudentTaskProgress` — Aufgaben-Fortschritt
- `StudentProgress`, `XpEvent` — Gamification
- `ParentReport` — Elternberichte
- `Task`, `TaskAsset`, `ContentType`, `CognitiveType`, `InputType` — Aufgaben-Schema
- `DiagnosticTask`, `DiagnosticTest`, `OnboardingData` — Diagnose-Generator
- `TaskCoachMetadata` — Coach-seitige Aufgaben-Metadaten
- `BadgeVariant` ergänzt um `levelup`, `repair` (Farbsystem)

`src/types/payloads.ts` (neu, 42 Zeilen): Typisierte Edge-Function- und
RPC-Payloads — `ProvisionStudentPayload`, `ProvisionStudentResult`.

---

## 10. Offene Punkte & nächste Schritte

Aus ROADMAP.md:

1. **Diagnostik-Content-Seeding** (`tasks.is_diagnostic=true`): Bis dieser Content
   in der DB liegt, zeigt `/screening` einen korrekten EmptyState — der Flow ist
   fertig, aber ohne Testinhalt nicht nutzbar.
2. **Browser-Verifikation** durch Rasit: U4 (Onboarding-Conversion), `/screening`-Flow
   end-to-end.
3. **PR #16 Base-Branch**: Der PR ging gegen `main` statt `dev` (Abweichung CLAUDE.md §5).
   Für zukünftige Feature-Branches auf `dev` als Basis achten.
4. **Mathebuch-Import**: Lambacher Schweizer 8. Klasse NRW — Aufgaben-Befüllung.
5. **Home-Quest Flow**: Schüler-seitiger Lernpfad mit geführten Quests.
6. **Realtime Cross-Tab-Sync**: DB-Modus hat keinen Cross-Tab-Sync mehr (vorher
   localStorage); Supabase Realtime ist eigener Folgeschritt.
7. **Türkis/Repair WCAG-AA-Verifikation**: Kalibrierte Token-Werte final visuell
   prüfen unter `/showcase` und `/demo/design`.

---

## Technische Qualität

### TypeScript

`npm run lint` (`tsc -b --noEmit`) läuft **fehlerfrei** durch. Keine TypeScript-Fehler.

### Design-Regeln

**Warnungen (keine Blocker):**

- **Inline-Styles mit CSS-Variablen**: In mehreren neu hinzugefügten Dateien
  (Task-Widgets, Szenarien, DashboardTiles) wird `style={{ background: 'var(--...)' }}`
  und `style={{ color: 'var(--...)' }}` eingesetzt. Laut CLAUDE.md §11 sind
  Inline-Styles nur für "wirklich dynamische Werte (z.B. berechnete Prozentzahlen)"
  erlaubt. CSS-Variablen-Referenzen in statischen Kontexten sollten als
  Tailwind-Klassen oder CSS-Klassen umgesetzt werden.
  Betroffene Stellen (Auswahl): `DashboardTiles.tsx`, `ScenarioCoach.tsx`,
  `TaskPedagogyAccordion.tsx`, `StepsWidget.tsx`.

- **Inline-Styles für dynamisch berechnete Werte**: Einzelne Stellen nutzen
  `style={{ boxShadow: session.status === 'active' ? SHADOW_ACTIVE : SHADOW_CARD }}`
  statt bedingter Tailwind-Utility-Klassen. Empfehlung: `shadow-*`-Utilities über
  ternäre className-Auswahl.

- **Dateigrößen über 400 Zeilen**:
  - `src/types/index.ts` — 461 Zeilen (Empfehlung: domänenweise aufteilen,
    z.B. `types/domain.ts`, `types/ui.ts`)
  - `src/pages/DesignShowcase.tsx` — 478 Zeilen (Showcase-Datei, akzeptabel)
  - `src/pages/student/StudentDashboard.tsx` — 419 Zeilen
  - `src/pages/admin/DiagnosticsPage.tsx` — 427 Zeilen

- **Hardcodierte Farben in SVG-Assets**: Brand-SVGs in `public/brand/` enthalten
  Hex-Werte (`#334D7A`, `#F7F7F5`, `#E8A020`). Dies ist korrekt für Bild-Assets
  (kein UI-Code), stellt keine Regelverletzung dar.

**Keine Verstöße:**

- Kein direkter Supabase-Aufruf in Pages oder Komponenten — alle Zugriffe über
  `src/lib/supabase/`.
- Keine `update`/`delete` auf `behavior_snapshots` — append-only eingehalten.
- Kein Kind-seitiges richtig/falsch-Feedback in `MCWidget`, `MatchingWidget`,
  `StepsWidget`.
- `.env` nicht im Diff enthalten; `.env.example` korrekt committed.
- Alle neuen Pages hinter `ProtectedRoute` mit korrekter Rollenzuweisung.
- `BehaviorSnapshots` und `xp_events` bleiben append-only (keine Update/Delete-
  Operationen im Lib-Layer).
- Alle Migrationen tragen expliziten Rasit-Freigabe-Hinweis.
