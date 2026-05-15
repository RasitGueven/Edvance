# Edvance – Roadmap

## Fertig
- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- Coach-Dashboard mit Session-Übersicht (Mock-Daten)
- Onboarding-Flow (Mock-Daten)
- Design-System: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse
- CLAUDE.md Harness konfiguriert
- Diagnose-Engine mit Behavior-Tracking (Tablet-Sicht + Coach-Sicht + Result-Page)
- Aufgaben-Schema: Tabellen, RLS-Policies, Seed-Script für KMK-Cluster
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator

## In Arbeit
- EmptyState + LoadingPulse Komponenten (ROADMAP deklariert sie als fertig — noch nicht implementiert)

## Nächste Schritte
- **Erster Lambacher-Content-Drop:** Migrationen 008+009 im Supabase Studio ausführen, Storage-Bucket `task-assets` anlegen, erste Aufgaben via Chrome-Plugin einscannen
- Schüler-Tablet Session-View (Lernpfad-Rendering aus echten tasks — TaskPlayer bereits vorhanden)
- Home-Quest Flow
- Elternreport
- Supabase Echtdaten-Anbindung (Profiles/Students von Mock auf Supabase)
