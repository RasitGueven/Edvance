# Retro 2026-05-29 — Gesamtstand & Review-Findings

Branch: `dev` (nach Merge PR #17 + #18). TypeScript: ✅ Exit-Code 0, keine Fehler.

## Kontext dieser Session

Dokumentations-Session ohne Codeänderungen. Vollständiger Review-Agent-Durchlauf
des aktuellen Standes auf `dev` (Stand: alle Commits bis inkl. PR #18, zuletzt
`9b4388f` vom 2026-05-17).

Parallel: Design-System-Migration v1 → v2 wurde am 2026-05-27 als Big-Bang-
Cutover beschlossen (Spec in `CLAUDE_CODE_MIGRATION_PROMPT.md`, 966 Zeilen,
10 Phasen). Start der Implementierung steht aus.

---

## Abgeschlossene Milestones (Stand 2026-05-29)

| Milestone | Branch / PR |
|---|---|
| Projekt-Fundament (Vite + React + Supabase Auth + Rollen) | main |
| Design-System v1 (EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse) | main |
| Diagnose-Engine: Initialdiagnostik-Flow + BehaviorTracking | feature/diagnosis-engine → dev |
| NRW Klasse 8 Mathe Taxonomie (17 Microskills) + Diagnostic-Generator | dev |
| Serlo komplett entfernt (Migration 006) | feature/remove-serlo → dev |
| Lambacher-Import-Pipeline (Skelett + Microskill-Lookup + Assets) | feature/mathebuch-import → dev |
| MathContent-Renderer: LaTeX (KaTeX) + Markdown | dev |
| Sub-Agents-Pipeline (.claude/agents: Coder, Reviewer, Deployer, Refactor) | dev |
| Migrationen 010–021: RLS, Leads, Intake, Screening, Tiers, Sessions, Gamification, provision_student | feature/real-data-program → dev (PR #16) |
| Supabase-Lib-Layer vollständig (16 Module in src/lib/supabase/) | feature/real-data-program → dev |
| Real-Data-Programm U1–U10: Alle Dashboards auf Echtdaten, Mocks entfernt | feature/real-data-program → dev |
| Lead → Intake → Screening → Onboarding-Flow (incl. provisionStudent Edge Function) | feature/real-data-program → dev |
| Task-Widget-System: MCWidget, MatchingWidget, StepsWidget, TaskFilterBar | feature/real-data-program → dev |
| Gamification-DB-Kern: student_progress + xp_events + Trigger apply_xp_event | feature/real-data-program → dev |
| Schnellzugriff-Kacheln DashboardTiles für Student/Coach/Parent | dev |
| Admin-Diagnostics-UI `/admin/diagnostics` (manuelles Seeding) | dev |
| Brand-System: EdvanceLogo, SVG-Assets (Symbol, Wordmark, AppIcon) | feature/levelup-tuerkis → dev (PR #18) |
| Farbsystem: Level-Up-Türkis (#0E9E96), Streak-Repair-Lila (#8B5CF6), XP-Gold vereinheitlicht | feature/levelup-tuerkis → dev |
| Design-System v1: Badge-Varianten levelup/repair, ToastBanner typ levelup | feature/levelup-tuerkis → dev |

---

## Review-Findings (2026-05-29)

### TypeScript
✅ Exit-Code 0 — keine Fehler.

### Sicherheits-Checks ✅
- Kein direkter `supabase.from()` in Pages oder Komponenten — 100% über `src/lib/supabase/`
- `behavior_snapshots`, `xp_events`, `screening_ratings` append-only — kein Update/Delete im Lib-Layer
- `service_role`-Key nicht im Frontend-Bundle — kein Treffer in `src/`
- `.env` korrekt in `.gitignore`, nicht staged
- `ProtectedRoute` auf allen produktiven Routen (student, coach, admin, parent)
- Kein kind-seitiges Richtig/Falsch-Feedback in Schüler-Views

### Blocker-Status (B1–B5 aus früheren Reviews)

| ID | Beschreibung | Status |
|---|---|---|
| B1 | `EdvanceLogo.tsx` statische Inline-Styles (fontFamily, flexShrink, display, alignItems, letterSpacing) | 🔴 Offen |
| B1+ | `EdvanceLogo.tsx` Z.19–22: `COLORS`-Palette mit 4 Hex-Werten hardcodiert | 🔴 Neu erkannt |
| B2 | `AdminDashboard.tsx` + `CoachDashboard.tsx`: `SHADOW_CARD` als `boxShadow`-Inline-Style | ✅ Behoben |
| B3 | `MCWidget.tsx:37` `'#fff'`, `DiagnosisResult.tsx:634/638/645` `background: 'white'`, `TaskQuestionBlock.tsx:57/119` `color: 'white'` | 🔴 Offen |
| B4 | `DrawCanvas.tsx:14/16` `STROKE_COLOR = '#0F172A'` + `BG_COLOR = '#FFFFFF'` + Inline-Style Z.105 | 🔴 Offen |
| B5 | `MatchingWidget.tsx:14–17` Hex-Palette-Array (#2D6A9F, #16a34a, #d97706, #7c3aed) | 🔴 Offen |

### Neue Blocker (seit 2026-05-28)

| Datei | Zeile | Problem |
|---|---|---|
| `src/components/edvance/index.tsx` | 309–310 | AVATAR_PALETTE: 8 Hex-Codes hardcodiert |
| `src/pages/student/StudentDashboard.tsx` | 305 | `fg: '#9A6B00'` in CLUSTER_TINTS |
| `src/pages/student/TaskWidgetDemo.tsx` | 155 | `color="#7c3aed"` als JSX-Prop |

### Warnungen ⚠️

- 7 Dateien über 400-Zeilen-Limit:

| Datei | Zeilen |
|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 |
| `src/pages/DiagnosisSession.tsx` | 764 |
| `src/components/edvance/index.tsx` | 559 |
| `src/pages/DesignShowcase.tsx` | 478 |
| `src/types/index.ts` | 461 |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 |
| `src/pages/student/StudentDashboard.tsx` | 419 |

- `ThemeContext.tsx` Z.8–11: Hex-Literale in Theme-Definitionen (Grenzfall — klären ob als CSS-Custom-Properties besser)
- `/diagnosis` + `/diagnosis/result` ohne `ProtectedRoute` — fachlich gewollt (Pre-Login-Screening), aber in Code dokumentieren
- `/showcase` + `/demo/*` ohne Auth — vor Produktionseinsatz absichern oder entfernen
- `color-mix(in srgb, ..., white)` in mehreren Dateien bricht im Dark Mode — `transparent` statt `white` verwenden

---

## Design-System-Migration v2 (geplant, noch nicht gestartet)

Entscheidung gefallen am 2026-05-27 (Rasit). Vollständige Spec in
`CLAUDE_CODE_MIGRATION_PROMPT.md` (966 Zeilen, 10 Phasen).

**Ansatz:** Big-Bang-Cutover — v1-Tokens komplett ersetzen, keine Legacy-Aliase.

**Reihenfolge:** Tokens → Komponenten → Schema → Parent → Coach → Schüler → Admin → Demo-Scope abräumen.

**Schema-Track parallel:** Migrationen 032–036 (Zwei-Streak-Modell, Mastery-5-Stufen, Badge-Rarity, Streak-Repair-Token, Aufräumen).

**Auswirkung auf aktuellen Stand:**
- Level-Up-Türkis (#0E9E96) fällt weg → ersetzt durch Navy-BG + Champagner-Krone + Altgold-XP
- Repair-Lila präzisiert auf #7B5EA7
- `streak_days` → zwei unabhängige Streaks (`presence_streak_weeks`, `home_streak_sessions`)
- 4-Stufen-Mastery → 5 Stufen (introduced/developing/progressing/proficient/mastered)
- WCAG-AA-Prüfung Türkis/Repair entfällt — neuer Pass nach Migration

---

## Offene P0-Punkte (vor erstem Schüler-Einsatz)

- 🔴 Diagnostik-Content-Seeding (`tasks.is_diagnostic=true`, min. 15 Aufgaben) → `/screening`-Flow end-to-end nutzbar
- 🔴 Browser-Verifikation `/screening`-Resume nach Tab-Close (Rasit)
- 🔴 Blocker B1/B3/B4/B5 + 3 neue Blocker fixen (Inline-Styles + Hex-Farben)
- 🔴 Design-System-Migration v2 starten (Claude-Code-Session mit `CLAUDE_CODE_MIGRATION_PROMPT.md`)
- 🟡 Lambacher-Bulk-Import (15–25 Aufgaben per Chrome-Plugin)
- 🟡 Home-Quest Flow (Post-Session automatische Quest-Generierung)
- 🟡 `/diagnosis`-Routen in App.tsx dokumentieren (warum kein ProtectedRoute)
- 🟡 `DiagnosisResult.tsx` + `DiagnosisSession.tsx` in Unterkomponenten aufteilen

---

## Architektur-Entscheidungen (Zusammenfassung)

| Entscheidung | Begründung |
|---|---|
| Lib-Layer-Prinzip: alle Supabase-Aufrufe in `src/lib/` | Testbarkeit, keine Vendor-Lock-in in Komponenten |
| RLS-First: jede neue Tabelle sofort mit Policies | Sicherheit by Default, keine vergessenen Tabellen |
| Append-Only: behavior_snapshots, xp_events, screening_ratings | Audit-Trail, keine Datenverluste bei Bugs |
| provisionStudent via Edge Function (service_role) | service_role-Key nie im Frontend-Bundle |
| Big-Bang statt schrittweise Design-System-Migration | Konsistenz wichtiger als kurze Übergangszeit |
| tokens.css als Single Source of Truth | Keine verteilten Hex-Codes — WCAG-Prüfung an einem Ort |
