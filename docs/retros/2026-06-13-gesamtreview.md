# Retro 2026-06-13 — Gesamtreview nach PR #16 + #17 + #18

Branch: `claude/sweet-ramanujan-eeibjv` (Review-Session, keine Code-Änderungen).

## Kontext

Scheduled Review-Session: Alle Änderungen der beiden zuletzt abgeschlossenen Milestones
wurden durch einen Review-Agent analysiert und in dieser Datei sowie in der Notion-Projektseite
dokumentiert.

---

## TypeScript-Status

`npx tsc --noEmit` — **0 Fehler.** ✅

---

## Milestone 1 — Real-Data-Program (PR #16/#17, Merge 16.05.2026)

### Was gebaut wurde

- **Schema-Migrationen 011–021**: RLS-Fix, leads, intake_sessions, screening_tests/ratings,
  tiers/subscriptions, student_coach, sessions, gamification, parent_reports, provision-RPC
- **Supabase-Lib-Layer** (`src/lib/supabase/`): 16 neue Dateien — behavior, intake, leads,
  parentReports, profiles, progress, provision, screening, screeningRatings, sessions,
  studentCoach, students, subscriptions, taskProgress, tasks, tiers
- **Edge Function** `supabase/functions/provision_student/index.ts` (125 Zeilen)
- **DiagnosisContext** komplett auf DB umgestellt, localStorage entfernt
- **Dashboards** CoachDashboard, StudentDashboard, ParentDashboard, ClusterView auf Echtdaten
- **Admin-Pages**: `/admin/leads`, `/admin/tiers`, `/admin/diagnostics`
- **Coach-Pages**: `/coach/intake`
- **DiagnosisSession + DiagnosisResult**: echte Persistenz via `persistBehaviorSnapshot`
- **DashboardTiles**: neue Schnellzugriff-Kachel-Komponente
- **mockData.ts + diagnosisMockData.ts**: gelöscht
- **types/index.ts**: erheblich erweitert (304 → 461 Zeilen)

### Kerndateien

| Datei | Zeilen | Status |
|---|---|---|
| `src/pages/DiagnosisSession.tsx` | 764 | BLOCKER: Dateilimit |
| `src/types/index.ts` | 461 | BLOCKER: Dateilimit |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | BLOCKER: Dateilimit |
| `src/pages/admin/LeadsPage.tsx` | 382 | Warnung: nahe Limit |
| `src/pages/coach/IntakePage.tsx` | 324 | OK |
| `src/pages/coach/CoachDashboard.tsx` | 312 | OK |
| `src/pages/admin/TiersPage.tsx` | 210 | OK |

---

## Milestone 2 — Brand-System + Farbsystem (PR #18, Merge 17.05.2026)

### Was gebaut wurde

- **`public/brand/`**: SVG-Assets (app-icon, favicon, logo-dark, logo-light, symbol)
- **`src/components/brand/EdvanceLogo.tsx`** (249 Zeilen): EdvanceSymbol, EdvanceWordmark,
  EdvanceAppIcon
- **EdvanceNavbar.tsx**: Logo via EdvanceLogo-Komponente ersetzt
- **Login.tsx**: EdvanceAppIcon size=64
- **`src/styles/tokens.css` + `globals.css`**: Level-Up-Türkis (`--color-levelup`),
  Streak-Repair-Lila, Gold-Vereinheitlichung
- **EdvanceBadge**: Varianten `levelup` + `repair`
- **ToastBanner**: Typ `levelup`
- **ScenarioCelebration**: Level-Badge auf `--gradient-levelup`
- **DesignShowcase**: neue Gruppe „Emotionale Momente"

---

## Regelverifikation (CLAUDE.md)

| Regel | Status |
|---|---|
| Kein direkter Supabase-Aufruf in Pages/Komponenten | ✅ PASS |
| BehaviorSnapshots append-only (nur `.insert()`) | ✅ PASS |
| Kind-seitiges Feedback (kein Richtig/Falsch für Schüler) | ✅ PASS |
| EmptyState + LoadingPulse in allen neuen Pages | ✅ PASS |
| .env in .gitignore | ✅ PASS |
| Auth/RLS-Änderungen nur in `src/lib/` | ✅ PASS |

---

## Befunde

### BLOCKER (3) — Dateilimit-Verletzungen (CLAUDE.md §4: max. 400 Zeilen)

**B1 — `src/pages/DiagnosisSession.tsx` — 764 Zeilen**
Enthält Rendering-Logik, Screening-State-Maschine, Timer-Logik und DB-Persistenz.
Empfohlene Aufteilung:
- `src/pages/diagnosis/ScreeningSession.tsx` — Screen-Rendering
- `src/lib/screening/sessionState.ts` — State-Logik
- `src/hooks/useSessionTimer.ts` — Timer-Hook

**B2 — `src/types/index.ts` — 461 Zeilen**
Typen von 11+ DB-Domänen in einer Datei. Aufteilung nach Domäne:
`src/types/leads.ts`, `src/types/sessions.ts`, `src/types/tiers.ts`, etc.

**B3 — `src/pages/admin/DiagnosticsPage.tsx` — 427 Zeilen**
Aufgaben-Seeding-Formular, Task-Liste und Diagnose-Content-Manager in einer Datei.
Aufteilung: `src/components/admin/DiagnosticTaskForm.tsx`

### Warnungen (6)

**W1 — Inline-Style `EdvanceLogo.tsx` (Z. 115, 137–147, 154–159, 201)**
`fontFamily: "'Space Grotesk', sans-serif"` als statischer Inline-Style.
Fix: `font-space-grotesk` Tailwind-Klasse oder CSS-Variable.
Dynamische Werte (`width: size`, `height: size`) sind legitim und ausgenommen.

**W2 — Hardcodierte COLORS in `EdvanceLogo.tsx` (Z. 19–22)**
`const COLORS = { midnight: '#334D7A', ... }` als SVG-Attribute.
Fix: `var(--color-primary)`, `var(--color-bg-app)`, `var(--color-accent)` etc.

**W3 — Hardcodierte Hex-Farben in `MatchingWidget.tsx` (Z. 14–17)**
Vier Verbindungsfarben als Hex-Literals. Pre-existing Tech Debt (nicht Teil der Milestones).

**W4 — `boxShadow` als Inline-Style in AdminDashboard (Z. 71, 183) + CoachDashboard (Z. 82, 110)**
Konstante `SHADOW_CARD` via `style={{ boxShadow: SHADOW_CARD }}`.
Fix: `shadow-card` Utility-Klasse.

**W5 — Inline-Style in `LeadsPage.tsx` (Z. 219)**
Subject-Filter-Buttons mit dynamisch berechnetem Border/Background via CSS-Variablen.
Grenzwertig — `color-mix()` auf `var(--primary)` ist korrekt, aber Tailwind-Variante
(`data-[active=true]:border-primary`) wäre bevorzugt.

**W6 — `console.error` in `TaskPlayer.tsx` (Z. 138)**
Bleibt im Produktionscode. Mittelfristig in zentrales Error-Reporting überführen.

---

## Offene Punkte / Tech Debt

1. **[KRITISCH] Diagnostik-Content fehlt**: `is_diagnostic=true`-Aufgaben noch nicht in DB
   geseeded — `/screening`-Flow ist live aber leer
2. **[KRITISCH] Browser-Verifikation ausstehend**: U4 (Onboarding-Conversion) + `/screening`
   noch nicht durch Rasit verifiziert
3. **[DESIGN] Token-Divergenz Türkis vs. v2-Spec**: `tokens.css` enthält noch
   `--color-levelup: #0E9E96` (Türkis) — Design-System v2 hat Türkis ersatzlos gestrichen.
   Auflösung via `feature/levelup-v2` + `CLAUDE_CODE_MIGRATION_PROMPT.md`
4. **[SICHERHEIT] Edge Function CORS**: `provision_student/index.ts` Z. 16:
   `'Access-Control-Allow-Origin': '*'` — vor Produktion auf Edvance-Domain beschränken
5. **[SICHERHEIT] `/showcase` + `/demo/*` ungeschützt**: Vor Go-Live: `ProtectedRoute`
   mit `allowedRoles={['admin']}` oder aus Build entfernen
6. **[FEATURE] Mathebuch-Import**: Lambacher Schweizer 8. Klasse NRW noch ausstehend

---

## Empfohlene nächste Schritte (Priorität)

| Prio | Aufgabe |
|---|---|
| P0 | Diagnostik-Content seeden (`is_diagnostic=true`) |
| P0 | Browser-Verifikation U4-Conversion + `/screening`-Flow |
| P1 | `DiagnosisSession.tsx` aufteilen (764 → 3 Dateien) |
| P1 | `types/index.ts` aufteilen (461 → Domänen-Dateien) |
| P1 | `DiagnosticsPage.tsx` aufteilen (427 → Form auslagern) |
| P2 | `boxShadow` Inline-Styles → `shadow-card` Utilities |
| P2 | `EdvanceLogo.tsx`: COLORS-Objekt → CSS-Variablen + fontFamily → Tailwind |
| P3 | Home-Quest Flow (nächstes Feature gem. ROADMAP.md) |
| P3 | Design-System v2 Migration starten (`feature/levelup-v2`) |
