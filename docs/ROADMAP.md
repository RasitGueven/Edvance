# Edvance – Roadmap

Letzte Aktualisierung: 02.06.2026

## Fertig

### Fundament
- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- CLAUDE.md Harness konfiguriert

### Content & Diagnose
- Aufgaben-Schema: Tabellen (001–010), RLS-Policies, Storage
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator
- Mathebuch-Import-Pipeline (Lambacher Schweizer 8 NRW, `scripts/import/lambacher.ts`)
- Serlo komplett entfernt (Migration 006)

### Design-System v1 (PR #15)
- Token-System (`src/styles/tokens.css`, `src/styles/globals.css`)
- Komponenten: EdvanceCard, MasteryBar, XPBar, StatCard, EdvanceBadge, EmptyState, LoadingPulse, ToastBanner
- Demo-Scope: 5 Szenarien + UIKit + Widget-Demo

### Task-Widgets (PR #14)
- MCWidget, MatchingWidget, StepsWidget, DrawCanvas
- TaskAnswerArea, TaskQuestionBlock, TaskFilterBar, TaskPreviewCard

### Real-Data-Programm (PR #16 + #17)
- Schema-Migrationen 011–021 (alle manuell im Supabase SQL Editor ausgeführt)
- Vollständiger Supabase-Lib-Layer (`src/lib/supabase/`)
- Edge Function `provision_student` (deployed)
- Erstgespräch: `/admin/leads` + `/coach/intake`
- Tarif-Verwaltung: `/admin/tiers`
- Diagnose-/Screening-Engine de-mockt (echter Generator + Content-Anbindung)
- Coach-/Student-/Parent-Dashboard auf Echtdaten; alle Mock-Daten entfernt
- U4: Lead → Schüler-Konvertierung via `provisionStudent()`
- U5c: `/screening` DB-gestützt + DB-Resume; localStorage komplett raus

### Brand-System (PR #18)
- EdvanceLogo-Komponente (Wordmark, Symbol, Inline; light/dark/auto)
- SVG-Assets in `public/brand/`
- Space Grotesk Schrift
- Level-Up Türkis Tokens (⚠️ durch v2-Entscheidung obsolet, Migration ausstehend)

---

## In Arbeit / Blockiert

- **Diagnostik-Content** (`tasks.is_diagnostic=true` fehlt) → `/screening` zeigt EmptyState
- **Browser-Verifikation** (U4 Lead-Conversion, `/screening`-Flow) — durch Rasit ausstehend

---

## Nächste Schritte (priorisiert)

### P0 — Blockiert
1. Diagnostik-Content seeden (`is_diagnostic=true`) → `/screening` aktiv
2. Browser-Verifikation (U4, `/screening`) durch Rasit

### P1 — Vor Launch
3. **Design-System v2 Migration** (Big Bang): `CLAUDE_CODE_MIGRATION_PROMPT.md` liegt vor (966 Zeilen, 10 Phasen)
   - Branch: `feature/v2-migration`
   - Enthält: DB-Migrationen 032–036, Token-Cutover, Komponenten-Update
4. WCAG-AA-Audit nach v2-Migration
5. TaskPlayer: echter Submit-Flow + XP-Vergabe-Loop

### P2 — Post-MVP
- Mathebuch-Import vollständig befüllen
- Realtime Cross-Tab-Sync (Schüler-Tablet + Coach)
- Home-Quest-Flow
- Dark Mode
- Eddy (Lite-KI-Studybuddy)
- Boss-Challenge-Character

---

## Retro-Docs

| Datum | Thema | Datei |
|---|---|---|
| 2026-05-08 | Projekt-Setup | `docs/retros/2026-05-08-projekt-setup.md` |
| 2026-05-08 | Cleanup | `docs/retros/2026-05-08-cleanup.md` |
| 2026-05-13 | Mathebuch-Import | `docs/retros/2026-05-13-mathebuch-import.md` |
| 2026-05-16 | Real-Data-Programm | `docs/retros/2026-05-16-real-data-program.md` |
| 2026-05-17 | Farbsystem-Feinschliff | `docs/retros/2026-05-17-farbsystem-feinschliff.md` |
| 2026-06-02 | Gesamtstand-Review | `docs/retros/2026-06-02-gesamtstand-review.md` |
