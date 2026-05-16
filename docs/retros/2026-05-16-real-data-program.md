# Retro 2026-05-16 — Real-Data-Programm (Mock-Entfernung + Erstgespräch/Screening)

Branch: `feature/real-data-program` (von `dev`).

## Was gebaut wurde

**Schema (Migrationen 011–021, manuell im Supabase SQL Editor ausgeführt)**
- 011 RLS-Fix `students`/`parent_student`/`student_subjects` (waren default-deny)
  + Security-Definer-Helper `get_my_student_id()`, `is_parent_of_student()`
- 012 `leads`, 013 `intake_sessions`, 014 `screening_tests` + append-only
  `screening_ratings` + `behavior_snapshots.screening_test_id`
- 015 `tiers` + `student_subscriptions`, 016 `student_coach`,
  018 `student_task_progress`
- 017 `coaching_sessions` + `session_students`, 019 `student_progress` +
  append-only `xp_events` (+ Trigger `apply_xp_event`), 020 `parent_reports`
- 021 atomare RPC `app_provision_student` (SECURITY DEFINER, nur service_role)
- `schema.sql` + `docs/SCHEMA.md` durchgehend gespiegelt

**Lib-Layer (`src/lib/supabase/`)** — alles `SupabaseResult<T>` + try/catch:
leads, students (+ Fach-Mapping, listStudentsWithName), intake,
subscriptions, tiers, studentCoach, screening, screeningRatings, sessions,
taskProgress, progress (XP), parentReports, provision (Edge-Wrapper),
profiles.getCoaches, behavior (um `screening_test_id` erweitert).

**Edge Function** `supabase/functions/provision_student` (Deno, service-role):
auth-User-Anlage (Schüler + Eltern-Invite) → RPC 021 → Cleanup bei Fehler.

**UI / Mock-Entfernung**
- U1 `MOCK_COACHES` → `getCoaches()`
- U2 `/admin/leads` (Lead-Erfassung + Liste + Status-Workflow)
- U3 `/coach/intake` (Erstgespräch-Protokoll, draft→final)
- U5a/b Diagnose-Engine auf echten Generator + echten Task-Content,
  `mockDiagnosisTasks.ts` gelöscht
- U6 + `/admin/tiers` (TIERS-Konstante raus, DB-Katalog + Tarif-Verwaltung)
- U7 CoachDashboard echte Sessions/Anwesenheit, `mockData.ts` gelöscht
- U8 ClusterView-Fortschritt aus `student_task_progress`
- U9 StudentDashboard XP/Streak aus `student_progress`
- U10 ParentDashboard echte Kind-Daten + Reports
- Mock-Sweep: keine `mock`/`MOCK_`-Runtime-Treffer mehr

## Entscheidungen

- Append-only strikt: Coach-Rating als separate `screening_ratings`-Tabelle
  statt Spalten-ALTER auf `behavior_snapshots`.
- Nicht-rekursive RLS über Security-Definer-Helper statt Inline-Joins.
- Lead→Student-Conversion atomar in plpgsql-RPC; Edge Function nur für
  auth-User-Anlage (Client hat nur anon-Key).
- Eine Engine: `/diagnosis` de-mockt; Screening = produktisierter Einstieg
  derselben Engine (kein Mock-Zwilling).
- jsonb statt Normalisierung für `generated_test`/`result_summary`.
- **Verifikation:** korrekter Check ist `npm run lint` (`tsc -b`), nicht
  `npx tsc --noEmit` (Solution-tsconfig hat `files:[]`). `node_modules`
  muss installiert sein.
- ThemeContext bleibt bewusst localStorage (kosmetisch).

## Offene Punkte

- **U4 (Onboarding real + Conversion-Wiring)** und **U5c (Screening
  DB-Persistenz + `/screening`-Route + DB-Resume)** bewusst zurückgestellt:
  brauchen (a) deployte Edge Function `provision_student`, (b) echte
  Schüler, (c) geseedeten Diagnostik-Content (`tasks.is_diagnostic=true`).
  Daher persistiert `DiagnosisContext` weiterhin via localStorage
  (`edvance_diagnosis_state_v1`) — letzter verbleibender Nicht-Theme-
  localStorage, wird in U5c auf DB umgestellt.
- Edge Function muss von Rasit deployed werden (Dashboard „Via Editor"
  oder `supabase functions deploy provision_student`).
- Diagnostik-Content-Seeding offen → Screening zeigt bis dahin EmptyState.
- Branch `feature/real-data-program` → nach Verifikation in `dev` mergen.
