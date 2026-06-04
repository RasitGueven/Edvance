# Edvance – Roadmap

_Zuletzt aktualisiert: 2026-06-04 (Retro PR #16–18)_

## Fertig

- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- Design-System v1: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse
- CLAUDE.md Harness konfiguriert
- Aufgaben-Schema: Tabellen, RLS-Policies, Seed-Script für KMK-Cluster
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator
- **Real-Data-Programm (PR #16+17, Retro 2026-05-16):**
  - Schema-Migrationen 011–021 (RLS-Fix, leads, intake_sessions, screening_tests/
    screening_ratings, tiers/subscriptions, student_coach, sessions, gamification,
    parent_reports, provision-RPC)
  - Vollständiger Supabase-Lib-Layer (16 Module) + Edge Function `provision_student`
  - Erstgespräch Stufe A `/admin/leads` + Stufe B `/coach/intake`
  - Tarif-Verwaltung `/admin/tiers` (DB-Katalog statt Hardcode)
  - Diagnose-/Screening-Engine de-mockt; Coach-/Student-/Parent-Dashboard auf Echtdaten
  - Admin `/admin/diagnostics` — Oberfläche zum manuellen Seeden
  - Schnellzugriff-Kacheln für alle drei Dashboards
- **Brand-System (PR #18, Retro 2026-05-17):**
  - `EdvanceLogo`-Komponente (Symbol / Wordmark / AppIcon), SVG-Assets in `public/brand/`
  - Space Grotesk eingebunden (→ lokal migrieren vor Launch)
  - Level-Up-Tokens (Türkis) + Streak-Repair-Tokens (Lila) — ⚠️ durch v2-Spec überholt
  - `EdvanceBadge` + `ToastBanner` mit `levelup`/`repair`-Varianten
  - Legacy-Aliase (`--xp-gold`, `--level-purple`) auf Single Source umgebogen

## P0 — Blockiert aktiven Betrieb

- **Diagnostik-Content seeden** (`tasks.is_diagnostic=true`) → `/screening` aktiv
  - `/admin/diagnostics` ist bereit, Rasit muss es ausführen
- **Browser-Verifikation** (U4-Conversion, `/screening`-Flow inkl. Resume, alle Dashboards) durch Rasit

## P1 — Vor Launch

- **Design-System v2 Migration** (Big Bang) — `CLAUDE_CODE_MIGRATION_PROMPT.md` lokal bei Rasit (966 Zeilen, 10 Phasen), Branch: `feature/v2-migration`
  - Token-Cutover v1→v2 (u.a. Türkis-Level-Up durch Navy+Gold ersetzen)
  - DB-Migrationen 032–036 (Zwei-Streak-Modell, 5-Stufen-Mastery, Badge-Rarity, Streak-Repair-Token)
- **`DiagnosticsPage.tsx` splitten** — 427 Zeilen (Limit 400), `NewTaskForm` + `TaskRow` auslagern
- **`EdvanceLogo.tsx`** — Hex-Farben → CSS-Variablen; statische Inline-Styles → Tailwind
- **Space Grotesk lokal** — `public/fonts/` (DSGVO + Performance)
- **TaskPlayer Submit-Flow** — Widgets rendern, echter Antwort-Submit + XP-Vergabe

## P2 — Post-MVP

- Mathebuch-Import vollständig (Lambacher Schweizer 8. Klasse NRW)
- Realtime Cross-Tab-Sync (Schüler-Tablet + Coach-Monitor)
- Home-Quest-Flow nach Session
- Dark Mode (Custom Properties bereits vorbereitet)
- Eddy (Lite-KI-Studybuddy)
- WCAG-AA-Audit nach v2-Migration

## Review-Retros

| Datum | Thema | Datei |
|---|---|---|
| 2026-05-08 | Cleanup + Projekt-Setup | `retros/2026-05-08-*.md` |
| 2026-05-13 | Mathebuch-Import | `retros/2026-05-13-mathebuch-import.md` |
| 2026-05-16 | Real-Data-Programm | `retros/2026-05-16-real-data-program.md` |
| 2026-05-17 | Farbsystem-Feinschliff | `retros/2026-05-17-farbsystem-feinschliff.md` |
| 2026-06-04 | Gesamtreview PR #16–18 | `retros/2026-06-04-gesamtreview-pr16-18.md` |
