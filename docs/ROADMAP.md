# Edvance – Roadmap

## Fertig

- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- Design-System: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse
- CLAUDE.md Harness konfiguriert
- Aufgaben-Schema: Tabellen, RLS-Policies, Seed-Script für KMK-Cluster
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator
- **Real-Data-Programm (PR #16, siehe Retro 2026-05-16):**
  - Schema-Migrationen 011–021 (RLS-Fix, leads, intake_sessions, screening_tests/
    screening_ratings, tiers/subscriptions, student_coach, sessions, gamification,
    parent_reports, provision-RPC)
  - Vollständiger Supabase-Lib-Layer + Edge Function `provision_student`
  - Erstgespräch Stufe A `/admin/leads` + Stufe B `/coach/intake`
  - Tarif-Verwaltung `/admin/tiers` (DB-Katalog statt Hardcode)
  - Diagnose-/Screening-Engine de-mockt (echter Generator + Content)
  - Coach-/Student-/Parent-Dashboard auf Echtdaten; alle Mock-Daten entfernt
  - U4: Onboarding + Lead-Konvertierung an `provisionStudent()` (Edge Function live)
  - U5c: `/screening` DB-gestützt + DB-Resume; localStorage komplett raus (außer ThemeContext)
- **Brand-System + Farbsystem-Feinschliff (PR #18, siehe Retro 2026-05-17):**
  - `EdvanceLogo`-Komponente: Symbol, Wordmark, AppIcon (Space Grotesk)
  - SVG-Assets unter `public/brand/` (symbol, logo-light/dark, app-icon, favicon)
  - Level-Up-Türkis-Tokens (`--color-levelup`, `--gradient-levelup`, `--shadow-glow-levelup`)
  - Streak-Repair-Tokens: `--color-moment-repair` (Lila) + Gradient
  - Gold-Aliase vereinheitlicht (Single Source: `--color-accent`)
  - `EdvanceBadge` + `ToastBanner` um `levelup`/`repair`-Varianten erweitert
  - `DesignShowcase`: Gruppe „Emotionale Momente" mit allen Gamification-Swatches
- **Schnellzugriff-Kacheln + Admin-Diagnostics:**
  - `DashboardTiles`-Grid in allen drei Dashboards (min 44px Touch-Targets)
  - `/admin/diagnostics` — Seeding-Oberfläche für `is_diagnostic=true`-Aufgaben
  - `updateTaskDiagnostic` + `createDiagnosticTask` in `src/lib/tasks.ts`

## In Arbeit

- Diagnostik-Content-Seeding (`tasks.is_diagnostic=true` befüllen → `/screening` produktiv)
- Code-Review-Blocker aus Retro 2026-06-15 beheben (EdvanceLogo Inline-Styles, CoachDashboard Shadow)

## Nächste Schritte

1. **BLOCKER beheben** (vor nächstem Feature):
   - `EdvanceLogo.tsx` — COLORS-Konstante auf CSS-Vars, statische Inline-Styles → Tailwind
   - `CoachDashboard.tsx` — `SHADOW_CARD`/`SHADOW_ACTIVE` → Shadow-Utilities
2. **Diagnostik-Content seeden** (`is_diagnostic=true`) → `/screening` aktiv
3. **Browser-Verifikation** durch Rasit: U4-Flow + `/screening`-End-to-End
4. **`DiagnosticsPage.tsx` refactoren** — 427 Zeilen (Limit 400) → `NewTaskForm.tsx` + `TaskRow.tsx`
5. **Mathebuch-Import** (Lambacher Schweizer 8. Klasse NRW)
6. **Gamification M01** — XP-Engine v2 (Sparks, Boss-Challenge, Mastery-Score)
7. **Realtime-Sync** — Zwei-Geräte-Flow Schüler-Tablet + Coach (eigener Feature-Branch)
8. **Home-Quest Flow**
