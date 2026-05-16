# Edvance – Roadmap

## Fertig
- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- Design-System: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse
- CLAUDE.md Harness konfiguriert
- Aufgaben-Schema: Tabellen, RLS-Policies, Seed-Script für KMK-Cluster
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator
- **Real-Data-Programm (Branch `feature/real-data-program`, siehe Retro 2026-05-16):**
  - Schema-Migrationen 011–021 (RLS-Fix, leads, intake_sessions, screening_tests/
    screening_ratings, tiers/subscriptions, student_coach, sessions, gamification,
    parent_reports, provision-RPC)
  - Vollständiger Supabase-Lib-Layer + Edge Function `provision_student`
  - Erstgespräch Stufe A `/admin/leads` + Stufe B `/coach/intake`
  - Tarif-Verwaltung `/admin/tiers` (DB-Katalog statt Hardcode)
  - Diagnose-/Screening-Engine de-mockt (echter Generator + Content)
  - Coach-/Student-/Parent-Dashboard auf Echtdaten; alle Mock-Daten entfernt

## In Arbeit
- Aufgaben-DB-Befüllung (Diagnostik-Content `is_diagnostic=true` fehlt → Screening leer)

## Nächste Schritte
- Edge Function `provision_student` deployen (Dashboard/CLI)
- U4: Onboarding-Wizard → echte Persistenz + Lead→Student-Conversion
- U5c: Screening DB-Persistenz + `/screening`-Route + DB-Resume
  (ersetzt letzten localStorage `edvance_diagnosis_state_v1`)
- `feature/real-data-program` nach Verifikation in `dev` mergen
- Mathebuch-Import (Lambacher Schweizer 8. Klasse NRW)
- Home-Quest Flow
