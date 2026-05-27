# Retro 2026-05-27 — v2 Design-System Big-Bang Migration: Start

## Auftrag
Vollständige Migration des Edvance-Frontends von Design-System v1 auf v2 als
Big-Bang. Autonomer Durchlauf über alle Phasen (Token-Cutover → Komponenten →
Schema → Rollen-Flows → Demo-Scope abräumen → Final). Quelle: `CLAUDE_CODE_MIGRATION_PROMPT.md`
(Auftrag vom 27.05.2026, Rasit Güven).

## Branches
- Basis: `main` = `dev` = `claude/epic-hypatia-BEdsV` (alle drei am Commit `9b4388f`)
- Arbeitsbranch: `feature/v2-migration` (angelegt von `dev`)
- Merge-Ziel am Ende: `feature/v2-migration` → `dev` → `main`

## Ist-Zustand (Pre-Migration)
- `src/styles/tokens.css` (89 Z.): hybrid — v2-Primary/BG/Text vorhanden, aber Premium-Gradients,
  Premium-Shadows, Glow-Shadows, Türkis-Level-Up (`--color-levelup` `#0E9E96`,
  `--color-moment-levelup` `#19C9BC`) und Repair-Lila `#8B5CF6` (statt `#7B5EA7`) noch v1.
- `src/styles/globals.css` (356 Z.): Legacy-`:root`-Variablen aktiv
  (`--brand-navy`, `--brand-blue`, `--primary` `#2D6A9F`, `--success` `#0F6E56`,
  `--warning` `#D97706`, `--destructive` `#DC2626`, `--xp-gold`, `--streak-orange`,
  `--level-purple`), 4 Premium-Shadow-Utilities, 9 Gradient-Utilities,
  `noise-overlay`, `glass-light`/`glass-dark`.
- Kein `tokens-demo.css` im Repo (Doku-Vorgabe „löschen" entfällt).
- Kein `[data-design="v2"]`-Mechanismus im Code (`grep` 0 Treffer) — Demo-Scope-Trick gab
  es in diesem Repo nicht; in Phase 9 nichts abzuräumen außer ggf. Demo-Files.
- `src/components/edvance/index.tsx` (559 Z.) enthält alle Atome inline
  (`EdvanceCard`, `EdvanceBadge`, `EdvanceXPBar`, `EdvanceStatCard`, ...) — wird in
  Phase 3b in Subdateien gesplittet (CLAUDE.md §4 Hard-Limit 400 Z.).
- `src/pages/student/StudentDashboard.tsx` (419 Z.) — Splitt in Phase 7.
- `src/pages/admin/DiagnosticsPage.tsx` (427 Z.) — Splitt in Phase 8.
- Pages-Mappe deutlich schmaler als in der Doku angenommen:
  - Coach: `CoachDashboard.tsx`, `IntakePage.tsx` (keine `ScreeningResultsPage`, `ReportsPage`)
  - Parent: nur `ParentDashboard.tsx` (keine `ScreeningReportPage`)
  - Admin: 5 Files (`AdminDashboard`, `DiagnosticsPage`, `LambacherPreview`, `LeadsPage`, `TiersPage`)
    — keine `OnboardingPage`, `SchedulePage`, `CoachesPage`, `AssignmentsPage`,
    `XpRulesPage`, `ScreeningItemsPage`, `ScreeningItemEditorPage`, `ScreeningCoveragePage`.
  - Demo: `DesignDemo.tsx`, `ScenarioCelebration`, `ScenarioCoach`, `ScenarioStudent`,
    `ScenarioSessionEnd`, `ScenarioUIKit` — keine `V2Kit.tsx`, `V2Student.tsx`, `V2Parent.tsx`.
- Migrationen enden bei `021_provision_student_fn.sql`. Doku verlangt 032-036 — Lücke 022-031
  wird ignoriert, Numerierung folgt der Doku-Spezifikation.

## Plan: Phasenfahrplan
1. **Phase 0** (jetzt) ✅ Branches angelegt, Baseline-TSC grün, Retro geschrieben.
2. **Phase 1** Token-Cutover — `tokens.css` voll auf v2, `globals.css` ausmisten, v1-Variablen weg.
3. **Phase 2** Globale Animationen, Light-Source-Overlay, Glas-Foundations.
4. **Phase 3** Komponenten-Bibliothek splitten (Atome → Komposite), neue Komponenten anlegen
   (`StreakPill`, `RarityBadge`, `MasteryBar` neu, `XPBar` neu, Moment-Modals).
5. **Phase 4** DB-Migrationen 032-035 + Lib-Layer (`badges.ts`, `streakRepair.ts`, `mastery.ts`).
6. **Phase 5** Eltern-Flow (ruhiges Token-Set, kein Glas, kein Verlauf).
7. **Phase 6** Coach-Flow (Notfall-Flag rot, Live-Sync bleibt).
8. **Phase 7** Schüler-Flow (Glaseffekt-Pills, Light-Source-Hero, Moment-Modals).
9. **Phase 8** Admin-Flow (Premium-OK, aber kein Türkis-Levelup).
10. **Phase 9** Demo-Scope-Clean + Migration 036 (`streak_days` droppen).
11. **Phase 10** Visual QA + Final-Merge.

## Offene Punkte / Adaptionen ggü. Doku
- Pages, die in der Doku referenziert werden aber nicht existieren, lege ich als minimale
  Routenstubs an (mit `EmptyState` als Inhalt, klar als „in Aufbau" markiert) — sonst hängen
  Doku-Verweise ins Leere.
- V2Kit/V2Student/V2Parent: lege ich in `src/pages/demo/v2/` als Showcase-Files an —
  ohne `[data-design="v2"]`-Wrapper (gab es nie), direkt im v2-Tokenset.
- Stop-Bedingung „Datei > 400 Z. nach Refactor": melde ich, sobald ich auf eine treffe.

## Commit-Plan
- `chore(v2): start of big-bang migration baseline` (jetzt)
- `docs(retro): v2 migration start retro` (jetzt)
- `feat(v2): token cutover — single source v2` (Phase 1)
- `feat(v2): global animations + glass + light-source foundations` (Phase 2)
- ... pro Atom & Komposit ein Commit (Phase 3)
- `chore(db): migration 032 — two-streak model` etc. (Phase 4)
- ... Pages (Phase 5-8)
- Final-Cleanup (Phase 9-10)
