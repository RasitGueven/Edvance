# Edvance – Datenbankschema

## Tabellen
profiles         → id, email, role, full_name, created_at
students         → id, profile_id, class_level, school_name, school_type
parent_student   → parent_id, student_id
subjects         → id, name (Mathematik|Deutsch|Englisch)
student_subjects → student_id, subject_id

## Rollen
student | parent | coach | admin

## RLS-Logik
- Coaches und Admins sehen alles
- Eltern sehen nur ihre Kinder (via parent_student)
- Schüler sehen nur sich selbst

## Supabase-Regeln
- Jede Tabelle hat RLS aktiviert
- Timestamps als UTC, Anzeige als Europe/Berlin
- BehaviorSnapshots sind append-only
