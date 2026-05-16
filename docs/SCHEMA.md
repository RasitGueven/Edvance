# Edvance – Datenbankschema

## Tabellen

### Auth & Personen
profiles            → id, email, role, full_name, created_at
students            → id, profile_id, class_level, school_name, school_type
parent_student      → parent_id, student_id

### Inhalte / Aufgaben
subjects            → id, name
skill_clusters      → id, subject_id, name, class_level_min, class_level_max, sort_order
                      (= 5 KMK-Kompetenzbereiche pro Fach, klassenstufenuebergreifend)
microskills         → id, cluster_id, code, name, description, class_level, prerequisite_ids[], sort_order, cognitive_type, estimated_minutes, curriculum_ref
tasks               → id, microskill_id, cluster_id, content_type, title, question, solution, hint, common_errors, coach_note, difficulty, estimated_minutes, class_level, is_active, created_at, cognitive_type, input_type, is_diagnostic, curriculum_ref, question_payload, typical_errors[]
task_coach_metadata → id, task_id, typical_errors, observation_hints, intervention_triggers, updated_at

#### KMK-Kompetenzbereiche Mathematik (Kl. 8-10)
1. Zahl & Rechnen
2. Algebra & Funktionen
3. Geometrie & Messen
4. Daten & Zufall
5. Sachrechnen & Modellieren

Aufgaben werden einem Cluster und (optional) Mikroskill zugeordnet.
Nicht zuordbare Tasks landen mit `cluster_id = NULL` und werden manuell
sortiert.

### Schueler-Fach Verknuepfung
student_subjects    → student_id, subject_id

### Erstgespraech & Screening (Migrationen 012-014)
leads               → id, created_at, full_name, contact_email, contact_phone, class_level, school_type, school_name, subjects[], goal, known_weak_topics[], source, status, owner_id, notes, converted_student_id, contacted_at, onboarding_scheduled_at
                      (Stufe A: Lead/Erstkontakt vor Account – nur Coach/Admin, PII)
intake_sessions     → id, created_at, student_id, lead_id, coach_id, conducted_at, goals, motivation, learning_history, parent_expectations, known_weak_topics[], agreed_next_steps, notes, status
                      (Stufe B: strukturiertes Erstgespraech-Protokoll am Schueler)
screening_tests     → id, created_at, student_id, subject, status, coach_id, coach_note, generated_test(jsonb), generated_test_version, result_summary(jsonb), estimated_total_minutes, started_at, completed_at
                      (mutables Aggregat pro (Schueler,Fach); 1 aktiver Test je Paar)
screening_ratings   → id, created_at, behavior_snapshot_id, screening_test_id, rating(1-4), coach_id
                      (APPEND-ONLY – Coach-Bewertung separat, haelt behavior_snapshots append-only)
behavior_snapshots  → + screening_test_id (additive nullable FK, Migration 014)

## Beziehungen

- `subjects 1—n skill_clusters` (Fach → Themencluster)
- `skill_clusters 1—n microskills` (Cluster → Mikroskills)
- `microskills 1—n tasks` (Mikroskill → Aufgaben; tasks koennen auch nur am Cluster haengen)
- `tasks 1—1 task_coach_metadata` (optionale Coach-Hinweise)
- `microskills.prerequisite_ids` zeigt auf andere `microskills.id` (Vorbedingung)

## Content-Typen (`tasks.content_type`)

`exercise` | `exercise_group` | `article` | `video` | `course`

## Rollen

student | parent | coach | admin

## RLS-Logik

- Coaches und Admins sehen alles
- Eltern sehen nur ihre Kinder (via parent_student)
- Schüler sehen nur sich selbst
- `subjects`, `skill_clusters`, `microskills`, `tasks`: Lesen fuer alle authentifizierten User
- `task_coach_metadata`: nur fuer Coaches und Admins
- Schreiben auf `tasks`: nur Admins
- `students` / `parent_student` / `student_subjects`: explizite Policies seit
  Migration 011 (vorher RLS aktiv, aber policy-los = default-deny)
- `leads`: nur Coach/Admin (interne PII, kein anon-Zugriff)
- `intake_sessions`: Coach/Admin Vollzugriff; Eltern lesen Protokoll eigenes Kind
- `screening_tests`: Schueler liest eigene; Eltern lesen eigenes Kind; Coach/Admin alles
- `screening_ratings`: append-only; Insert Coach/Admin; Lesen eigener Schueler/Eltern/Coach/Admin
- `behavior_snapshots`: weiterhin append-only (Migration 014 nur additive FK)

### Security-Definer-Helper (nicht-rekursiv, programmweit)

- `public.get_my_role()` → Rolle des eingeloggten Users
- `public.get_my_student_id()` → eigene `students.id` (Migration 011)
- `public.is_parent_of_student(uuid)` → ist User Elternteil dieses Schuelers (Migration 011)

## Supabase-Regeln

- Jede Tabelle hat RLS aktiviert
- Timestamps als UTC, Anzeige als Europe/Berlin
- BehaviorSnapshots sind append-only

## SQL-Dateien

- `schema.sql`                              – Auth + Schueler-Tabellen (initial)
- `schema_content.sql`                      – Content/Aufgaben-Tabellen (im Supabase SQL Editor manuell)
- `migrations/001_competency_areas.sql`     – Cluster auf 5 KMK-Kompetenzbereiche umstellen
- `migrations/003_behavior_snapshots.sql`   – BehaviorSnapshots (append-only)
- `migrations/011_students_rls_fix.sql`     – RLS-Policies students/parent_student/student_subjects + Security-Definer-Helper
- `migrations/012_leads.sql`                – leads (Erstgespraech Stufe A)
- `migrations/013_intake_sessions.sql`      – intake_sessions (Erstgespraech Stufe B)
- `migrations/014_screening.sql`            – screening_tests + screening_ratings + behavior_snapshots.screening_test_id
