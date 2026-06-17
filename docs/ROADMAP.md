# Edvance – Roadmap

## Fertig

- Vite + React + TypeScript + Tailwind + shadcn Fundament
- Supabase Auth mit Rollen (student|parent|coach|admin)
- Design-System: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse
- CLAUDE.md Harness konfiguriert
- Aufgaben-Schema: Tabellen, RLS-Policies, Seed-Script für KMK-Cluster
- NRW Klasse 8 Mathe Taxonomie + Diagnostic-Generator

### Real-Data-Programm (PR #16, retro: 2026-05-16 + 2026-06-17)

- Schema-Migrationen 011–021 (RLS-Fix, leads, intake_sessions, screening_tests/
  screening_ratings, tiers/subscriptions, student_coach, sessions, gamification,
  parent_reports, provision-RPC)
- Vollständiger Supabase-Lib-Layer (`src/lib/supabase/`) + Edge Function `provision_student`
- U1: MOCK_COACHES → getCoaches()
- U2: `/admin/leads` — Lead-Erfassung + Liste + Status-Workflow
- U3: `/coach/intake` — Erstgespräch-Protokoll (draft→final)
- U4: Onboarding + Lead-Konvertierung an `provisionStudent()` (Edge Function live)
- U5a/b: Diagnose-Engine de-mockt (echter Generator + Content), `mockDiagnosisTasks.ts` gelöscht
- U5c: `/screening` DB-gestützt + DB-Resume; localStorage komplett raus (außer ThemeContext)
- U6: TIERS-Konstante raus, DB-Katalog + `/admin/tiers` Tarif-Verwaltung
- U7: CoachDashboard echte Sessions/Anwesenheit, `mockData.ts` gelöscht
- U8: ClusterView-Fortschritt aus `student_task_progress`
- U9: StudentDashboard XP/Streak aus `student_progress`
- U10: ParentDashboard echte Kind-Daten + Reports
- DashboardTiles: Schnellzugriff-Kacheln in Student/Coach/Parent-Dashboards
- `/admin/diagnostics`: Oberfläche zum manuellen Seeden von Diagnostik-Content

### Brand-System + Farbsystem-Feinschliff (PR #18, retro: 2026-05-17 + 2026-06-17)

- `src/components/brand/EdvanceLogo.tsx` (EdvanceSymbol / EdvanceLogo / EdvanceAppIcon)
- Brand-Assets unter `public/brand/` (SVG: Symbol, Wordmark hell/dunkel, App-Icon, Favicon)
- Echtes Edvance-Favicon (`public/favicon.svg`)
- Space Grotesk Font in `index.html` eingebunden (Wordmark-Schrift)
- Navbar + Login nutzen echte Logo-Komponenten
- Level-Up-Türkis-Tokens (`--color-levelup`, `--color-moment-levelup`, `--gradient-levelup`, `--shadow-glow-levelup`)
- Streak-Repair-Lila-Tokens (`--color-moment-repair`, `--gradient-repair`)
- `--color-accent-light` für XP-Badge-BG
- Legacy-Aliase auf Single Source umgebogen (`--xp-gold`, `--xp-gold-light`, `--level-purple`)
- `EdvanceBadge`: Varianten `levelup` + `repair`
- `ToastBanner`: Typ `levelup`
- `ScenarioCelebration`: Level-Badge mit Türkis-Gradient + Glow auf Navy
- `DesignShowcase`: Gruppe „Emotionale Momente"

## In Arbeit

- Aufgaben-DB-Befüllung (Diagnostik-Content `is_diagnostic=true` fehlt → `/screening` leer)
- Browser-Verifikation U4-Conversion + `/screening`-Flow durch Rasit

## Nächste Schritte

1. **Diagnostik-Content seeden** (`tasks.is_diagnostic=true`) → `/screening` aktiv nutzbar
2. **Browser-Verifikation** U4-Conversion-Flow + `/screening`-DB-Flow (Rasit)
3. **`DiagnosticsPage.tsx` refactoren** — aktuell 427 Zeilen, Formularblock als Subkomponente auslagern (Limit 400 Zeilen)
4. **WCAG-AA-Check** für `--color-levelup` (`#0E9E96`) und `--color-moment-repair` (`#8B5CF6`) via `/showcase`; Nachjustierung nur in `tokens.css`
5. **Mathebuch-Import** (Lambacher Schweizer 8. Klasse NRW)
6. **Home-Quest Flow** (Schüler-Aufgaben-Loop)
7. **Realtime-Sync** Zwei-Geräte-Flow Schüler-Tablet + Coach (eigener Feature-Branch)
8. **Streak-Repair + Boss-Gradient UI-Flows** (Tokens/Badges bereits vorbereitet)
