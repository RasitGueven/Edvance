# Retro 2026-06-10 — Gesamtreview (Stand nach PR #17 + #18)

Session: `claude/sweet-ramanujan-d90d2n`

## TypeScript

`npx tsc --noEmit` — **0 Fehler.** ✅

## Überblick: Was bisher gebaut wurde

### PR #17 — Real-Data-Program (Merge 16.05.2026)

Vollständige Ablösung aller Mock-Daten durch echte Supabase-DB-Calls:

**Neue Supabase-Lib-Dateien (`src/lib/supabase/`)**
- `sessions.ts` – Coaching-Sessions lesen/schreiben
- `progress.ts` – Schüler-Fortschritt (XP, Streak, Level)
- `parentReports.ts` – Eltern-Berichte aus DB
- `studentCoach.ts` – Coach↔Schüler-Zuweisung
- `screening.ts` + `screeningRatings.ts` – Diagnose-Screening komplett
- `storage.ts` – Task-Asset-Upload via Supabase Storage
- `subscriptions.ts` + `tiers.ts` – Abo-Verwaltung
- `tasks.ts` – Aufgaben aus DB lesen/filtern
- `leads.ts` + `intake.ts` – Lead-Erfassung + Intake-Sessions
- `taskProgress.ts` – Aufgaben-Fortschritt pro Schüler
- `provision.ts` – Schüler-Provisionierung (wraps Edge Function)

**Neue Migrations (008–021)** + vollständiges `schema.sql` (554 Z.)

**Neue Seiten**
- `src/pages/admin/DiagnosticsPage.tsx` (427 Z.) – manuelles Seeden
- `src/pages/admin/LeadsPage.tsx` (382 Z.) – Lead-Verwaltung
- `src/pages/admin/TiersPage.tsx` (210 Z.) – Tier-Verwaltung
- `src/pages/coach/IntakePage.tsx` (324 Z.) – Intake-Flow
- Supabase Edge Function: `provision_student` (125 Z.)

**Neue Task-Komponenten** (`src/components/edvance/tasks/`)
- `MCWidget`, `MatchingWidget`, `StepsWidget` – Aufgaben-Typen
- `TaskAnswerArea`, `TaskAssetEditor`, `TaskFilterBar`
- `TaskMetaRow`, `TaskPedagogyAccordion`, `TaskPreviewCard`, `TaskQuestionBlock`

**Dashboard-Anbindung**
- `CoachDashboard` – echte Sessions aus DB
- `StudentDashboard` – XP/Streak aus `student_progress`
- `ParentDashboard` – echte Kind-Daten
- `ClusterView` – Fortschritt aus DB statt localStorage
- `DiagnosisContext` – localStorage komplett entfernt, DB-Persistenz + Resume

### PR #18 — Brand-System + Farbsystem-Feinschliff (Merge 17.05.2026)

**Logo-System** (`src/components/brand/EdvanceLogo.tsx`, 249 Z.)
- `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon` – 5 Größen-Presets
- 5 SVG-Assets unter `public/brand/` (logo-light, logo-dark, symbol, app-icon, favicon)
- Space Grotesk via Google Fonts in `index.html`
- Navbar + Login auf neue Logo-Komponente umgestellt

**Farbsystem** (`tokens.css` +16 Z., `globals.css` +23 Z.)
- Level-Up-Türkis-Tokens: `--color-levelup #0E9E96`, `--color-moment-levelup #19C9BC`
- Streak-Repair-Lila (`--color-moment-repair`), `--color-accent-light`
- `EdvanceBadge`-Varianten `levelup` + `repair`
- `ToastBanner`-Typ `levelup`

## Befunde (aktueller Stand 10.06.2026)

### 🔴 B1 — Token-Divergenz Türkis vs. Design-System v2 (BLOCKER)

`tokens.css` Z. 54–85 enthält:
- `--color-levelup: #0E9E96` (Türkis)
- `--color-moment-levelup: #19C9BC`
- `--gradient-levelup`
- `--shadow-glow-levelup: rgba(25,201,188,...)`

Die Notion-Design-System-Seite (aktualisiert 27.05.2026) hat **Türkis als Level-Up-Identität ersatzlos gestrichen** — Level-Up ist jetzt `Navy-BG + Champagner-Krone (#E8D5A3) + Altgold-XP (#D4A843)`.

Der Code-Stand ist kein Merge-Fehler (v2-Spec wurde nach PR #18 publiziert), muss aber vor produktivem Einsatz aufgelöst werden.

**Fix:** Feature-Branch `feature/levelup-v2` – implementiert `CLAUDE_CODE_MIGRATION_PROMPT.md` (liegt lokal vor, 10 Phasen).

### 🔴 B2 — Hardcodierte Hex-Strings in `EdvanceLogo.tsx` (BLOCKER)

`src/components/brand/EdvanceLogo.tsx` Z. 18–23:
```ts
const COLORS = {
  midnight: '#334D7A',
  gold: '#D4A843',
  white: '#FFFFFF',
  ...
}
```
Diese werden als SVG-`fill`/`color`-Attribute eingesetzt (Z. 40–41, 98–99, 187–189). Verstößt gegen CLAUDE.md §4 + §11.

**Fix:** SVGs auf `currentColor` umstellen, Wrapper-Element erhält `style={{ color: 'var(--color-primary)' }}`.

### 🔴 P0 — Korrekt-Quote ohne Coach-Guard (BLOCKER vor Main-Merge)

`src/pages/DiagnosisResult.tsx` Z. 681:
```tsx
<KpiCard label="Korrekt-Quote" value={`${correctCount}/${completedSnaps.length}`} ... />
```
Kein `role === 'coach'`-Check. Schüler sehen eigene Coach-Ratings (richtig/falsch aus `coach_rating`). Verstößt gegen CLAUDE.md §6 (Kind-seitig: niemals visuelles Richtig/Falsch-Feedback).

**Fix:** `const { role } = useAuth();` + `{role === 'coach' && <KpiCard label="Korrekt-Quote" ... />}`.

### 🟡 W1 — Inline `boxShadow` in `ScenarioCelebration.tsx`

Z. 42: `style={{ boxShadow: 'var(--shadow-glow-levelup)' }}`
Utility-Klasse `.shadow-glow-levelup` existiert bereits in `globals.css`.

**Fix:** `className="shadow-glow-levelup"` statt Inline-Style.

### 🟡 W2 — `index.tsx` über Dateilimit

`src/components/edvance/index.tsx` bei **559 Zeilen** (Limit: 400). `EdvanceBadge`, `ToastBanner`, `LoadingPulse` sollten in eigene Dateien ausgelagert werden.

## Offene Punkte (priorisiert, alle aus Vorreviews übernommen)

| Prio | Punkt | Datei | Status |
|---|---|---|---|
| P0 | Korrekt-Quote hinter Coach-Guard | `DiagnosisResult.tsx` Z. 681 | 🔴 OFFEN |
| B1 | Token-Divergenz Türkis vs. v2-Spec | `tokens.css` Z. 54–85 | 🔴 OFFEN |
| B2 | Hardcodierte COLORS in EdvanceLogo | `EdvanceLogo.tsx` Z. 18–23 | 🔴 OFFEN |
| P1 | `DiagnosisResult.tsx` splitten (946 Z.) | `src/pages/DiagnosisResult.tsx` | 🔴 OFFEN |
| P1 | `DiagnosisSession.tsx` splitten (764 Z.) | `src/pages/DiagnosisSession.tsx` | 🔴 OFFEN |
| P1 | AdminDashboard + CoachDashboard `boxShadow` Inline-Styles | jeweilige Pages | 🔴 OFFEN |
| P1 | Token-Divergenz `--primary` vs. `--color-primary` | `globals.css` + `tokens.css` | 🔴 OFFEN |
| W1 | Inline `boxShadow` ScenarioCelebration | `ScenarioCelebration.tsx` Z. 42 | 🟡 OFFEN |
| W2 | `index.tsx` über 400-Z.-Limit | `src/components/edvance/index.tsx` | 🟡 OFFEN |
| P2 | `LoadingPulse` in Schüler-Screens fehlt | TaskPlayer, ClusterView, StudentDashboard | 🟡 OFFEN |
| P2 | `EmptyState` in StudentDashboard fehlt | `StudentDashboard.tsx` | 🟡 OFFEN |
| P2 | Hex-Farben in MatchingWidget / MCWidget | `src/components/edvance/tasks/` | 🟡 OFFEN |
| N4 | `--streak-orange` nicht auf `tokens.css` | `globals.css` Z. 48 | 🟡 OFFEN |

## Gesamtbewertung: 🔴 ROT

3 Blocker offen (B1, B2, P0). Kein Main-Merge bis P0 behoben.

## Nächste Schritte

1. **P0-Fix** (klein, sofort): `useAuth()` + role-Guard in `DiagnosisResult.tsx` Z. 681
2. **B2-Fix** (klein, sofort oder mit v2-Migration): `EdvanceLogo.tsx` COLORS → CSS-Variablen
3. **W1-Fix** (1 Zeile): `ScenarioCelebration.tsx` Inline-Style → Utility-Klasse
4. **v2-Migration starten**: `CLAUDE_CODE_MIGRATION_PROMPT.md` ausführen (löst B1 + alle Token-Divergenzen automatisch)
5. **Splitting-Session**: DiagnosisResult + DiagnosisSession + index.tsx aufteilen
