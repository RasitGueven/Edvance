# Edvance – Datenbankschema

## Tabellen

### Auth & Personen
profiles            → id, email, role, full_name, created_at
students            → id, profile_id, class_level, school_name, school_type
parent_student      → parent_id, student_id

### Inhalte / Aufgaben (Serlo-Import)
subjects            → id, name, serlo_id
skill_clusters      → id, subject_id, name, class_level_min, class_level_max, serlo_taxonomy_id, sort_order
                      (= 5 KMK-Kompetenzbereiche pro Fach, klassenstufenuebergreifend)
microskills         → id, cluster_id, code, name, description, class_level, prerequisite_ids[], sort_order
tasks               → id, microskill_id, cluster_id, serlo_uuid, serlo_url, content_type, title, question, solution, hint, common_errors, coach_note, difficulty, estimated_minutes, class_level, is_active, created_at
task_coach_metadata → id, task_id, typical_errors, observation_hints, intervention_triggers, updated_at

#### KMK-Kompetenzbereiche Mathematik (Kl. 8-10)
1. Zahl & Rechnen
2. Algebra & Funktionen
3. Geometrie & Messen
4. Daten & Zufall
5. Sachrechnen & Modellieren

Serlo-Inhalte werden beim Import per Keyword-Mapping einem dieser
5 Cluster zugeordnet (siehe `scripts/import-serlo.ts`). Nicht
zuordbare Tasks landen mit `cluster_id = NULL` und werden manuell sortiert.

### Schueler-Fach Verknuepfung
student_subjects    → student_id, subject_id

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

## Supabase-Regeln

- Jede Tabelle hat RLS aktiviert
- Timestamps als UTC, Anzeige als Europe/Berlin
- BehaviorSnapshots sind append-only

## SQL-Dateien

- `schema.sql`                              – Auth + Schueler-Tabellen (initial)
- `schema_content.sql`                      – Content/Aufgaben-Tabellen (im Supabase SQL Editor manuell)
- `migrations/001_competency_areas.sql`     – Cluster auf 5 KMK-Kompetenzbereiche umstellen
