# Retro 2026-06-10 — Gesamtreview (Stand nach PR #17 + #18)

Session: `claude/sweet-ramanujan-d90d2n`
Review-Agenten: Hub (Sonnet 4.6) + Spoke (Reviewer)

## TypeScript

`npx tsc --noEmit` — **0 Fehler.** ✅

## Überblick: Was bisher gebaut wurde

### PR #17 — Real-Data-Program (Merge 16.05.2026)

Vollständige Ablösung aller Mock-Daten durch echte Supabase-DB-Calls.

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
- `supabase/functions/provision_student/index.ts` (125 Z.) – Edge Function

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
- `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon` – 5 Größen-Presets, a11y-konform
- 5 SVG-Assets unter `public/brand/` (logo-light, logo-dark, symbol, app-icon, favicon)
- Space Grotesk via Google Fonts in `index.html`
- Navbar + Login auf neue Logo-Komponente umgestellt

**Farbsystem** (`tokens.css` +16 Z., `globals.css` +23 Z.)
- Level-Up-Türkis-Tokens: `--color-levelup #0E9E96`, `--color-moment-levelup #19C9BC`
- Streak-Repair-Lila (`--color-moment-repair`), `--color-accent-light`
- `EdvanceBadge`-Varianten `levelup` + `repair`; `ToastBanner`-Typ `levelup`
- Legacy-Aliase aufgelöst: `--xp-gold → var(--color-accent)`, `--level-purple → var(--color-moment-repair)`

## Was gut gemacht wurde

- **Lib-Abstraktion exemplarisch:** Alle 18 Supabase-Lib-Dateien folgen identischem Muster (typisierter Input/Output, `try/catch` mit deutschen Fehlermeldungen, `SupabaseResult<T>`). Keine Supabase-Calls außerhalb von `src/lib/`.
- **Mock-Data vollständig entfernt:** Null `MOCK_`-Importe in Produktions-Pages; `diagnosisMockData.ts` gelöscht.
- **`DiagnosisContext` sauber:** `mode: 'local' | 'db'` mit `hydrate()`-Einstiegspunkt. `snapshotIds`-Array für Task-Index→Snapshot-ID ist minimal und korrekt.
- **BehaviorSnapshots append-only:** `behavior.ts` enthält ausschließlich `.insert()`. Kein Update, kein Delete.
- **RLS auf allen neuen Tabellen:** Jede Migration 012–021 hat `enable row level security` + mindestens eine Policy. `⚠️ Auth/RLS-AENDERUNG`-Kommentar korrekt gesetzt.
- **`provision_student` Edge Function:** Vierstufiges Atomicity-Pattern (Auth-User → Parent-Invite → DB-RPC → Rollback) korrekt. Service-Role-Key serverside, nicht im Frontend.
- **`EdvanceLogo` Accessibility:** `aria-label`/`role="img"` am Wrapper, `aria-hidden="true"` auf dekorativen SVGs.
- **Token-Aliase aufgelöst:** `--xp-gold`, `--xp-gold-light`, `--level-purple` binden jetzt auf Single-Source-Tokens.

## Befunde

### 🔴 B1 — Token-Divergenz Türkis vs. Design-System v2

`tokens.css` Z. 54–85 enthält `--color-levelup: #0E9E96`, `--color-moment-levelup: #19C9BC`, `--gradient-levelup`, `--shadow-glow-levelup`. Design-System v2 (aktualisiert 27.05.2026) hat Türkis als Level-Up-Identität **ersatzlos gestrichen** — Level-Up ist jetzt Navy-BG + Champagner-Krone + Altgold-XP. Kein PR-Fehler (v2-Spec nach Merge publiziert), aber vor Produktion auflösen.

**Fix:** `feature/levelup-v2` via `CLAUDE_CODE_MIGRATION_PROMPT.md`.

### 🔴 B2 — Hardcodierte COLORS in `EdvanceLogo.tsx`

`EdvanceLogo.tsx` Z. 18–23: `const COLORS = { midnight: '#334D7A', gold: '#D4A843', white: '#FFFFFF', ... }` als SVG-Attribute. Kontext: SVG `fill`/`stroke`-Attribute können keine CSS-Variablen direkt referenzieren. Kurzfristig: Kommentar mit Token-Mapping (`midnight = --color-primary`, `gold = --color-accent`). Langfristig: `currentColor` + CSS-Wrapper mit `v2-Migration`.

### 🔴 B3 — `var(--card)` nicht in `:root` definiert

Betroffene Dateien: `IntakePage.tsx`, `LeadsPage.tsx`, `DiagnosticsPage.tsx`, `TiersPage.tsx`, `TierStep.tsx`, `SubjectsStep.tsx`, `CoachStep.tsx`, `SummaryStep.tsx`. Alle nutzen `var(--card)` als Raw-CSS-Variable — diese existiert nicht in `:root`. Fällt lautlos auf `transparent` zurück → Hintergrund dieser Formulare ist zur Laufzeit unsichtbar.

**Fix (sofort):** Alle `var(--card)` → `var(--color-bg-surface)` in Inline-Styles, oder `bg-card` als Tailwind-Utility-Klasse.

### 🔴 P0 — Korrekt-Quote ohne Coach-Guard

`DiagnosisResult.tsx` Z. 681: `<KpiCard label="Korrekt-Quote" .../>` ohne Rollen-Check. Schüler sehen eigene Coach-Ratings. Verstößt gegen CLAUDE.md §6.

**Fix (sofort, ~5 Z.):** `const { role } = useAuth();` + `{role === 'coach' && <KpiCard label="Korrekt-Quote" ... />}`.

### 🔴 P0b — Hardcodierter Coaches-Name in `DiagnosisResult.tsx`

Z. 655: `Coach: Frau Demir` als Literal. Sobald mehr als ein Coach im System ist, wird jedes Ergebnis mit dem falschen Namen angezeigt. Funktionaler Bug.

**Fix:** Coach-Name aus `screening_tests`-Join-Record.

### 🟡 W1 — Inline `boxShadow` in `ScenarioCelebration.tsx`

Z. 42: `style={{ boxShadow: 'var(--shadow-glow-levelup)' }}` → Utility `.shadow-glow-levelup` existiert bereits.

### 🟡 W2 — `SHADOW_CARD` Inline-Style in CoachDashboard + AdminDashboard

Beide Pages definieren `SHADOW_CARD = '0 4px 24px 0 rgba(...)'` und setzen es als `style={{ boxShadow: SHADOW_CARD }}` auf shadcn `<Card>`. Fix: Migration zu `<EdvanceCard>` (trägt `shadow-card` automatisch).

### 🟡 W3 — `MCWidget.tsx` Z. 37: Hardcodiertes `'#fff'`

`color: active ? '#fff' : 'var(--primary)'` — verbotene Literalfarbe. Fix: `'var(--primary-foreground)'`.

### 🟡 W4 — `MatchingWidget.tsx` Z. 15: `#16a34a` ohne Token-Mapping

Im `TINTS`-Array für SVG-Connector-Farben. `#2D6A9F = --color-primary`, `#d97706 = --color-warning`, `#7c3aed ≈ --color-moment-repair`. `#16a34a` (Grün) hat keinen Token. Nächster passender Token: `--color-success #2A8A4A`. Align oder neuen Token anlegen.

### 🟡 W5 — `StudentDashboard.tsx` Z. 305: `#9A6B00` hardcodiert

`CLUSTER_TINTS`-Array. Fix: `var(--color-accent-on)` (`#4A2E00` aus tokens).

### 🟡 W6 — `DiagnosisResult.tsx` Z. 634, 638, 645: `'white'` Literal

Dekorative Overlay-Kreise. Fix: `var(--surface)` oder `var(--background)`.

### 🟡 W7 — Touch-Target unterschritten in `LeadsPage.tsx`

Z. 214–229: Subject-Toggle-Buttons mit `py-2 text-sm` → ca. 30px Höhe (Limit: 44px). Fix: `min-h-[44px]` ergänzen.

### 🟡 W8 — `index.tsx` über Dateilimit

`src/components/edvance/index.tsx` bei 559 Zeilen (Limit: 400). `EdvanceBadge`, `ToastBanner`, `LoadingPulse`, `AvatarInitials` in eigene Dateien.

### ⚠️ R1 — Edge Function CORS Wildcard (Rasit-Entscheidung)

`supabase/functions/provision_student/index.ts` Z. 16: `'Access-Control-Allow-Origin': '*'`. Privilegierte Operation (erstellt Auth-User). Vor Produktion: Origin auf Edvance-Domain beschränken.

### ⚠️ R2 — `/showcase` und `/demo/*` ungeschützt

Kein `ProtectedRoute`. Exponiert vollständige Komponenten-Bibliothek + P3-Swatches. Vor Go-Live: `allowedRoles={['admin']}` oder aus Production-Build entfernen.

## Vollständige Befundliste (priorisiert)

| Prio | ID | Punkt | Datei | Status |
|---|---|---|---|---|
| 🔴 | P0 | Korrekt-Quote ohne Coach-Guard | `DiagnosisResult.tsx` Z. 681 | OFFEN |
| 🔴 | P0b | Hardcodierter Coach-Name | `DiagnosisResult.tsx` Z. 655 | OFFEN |
| 🔴 | B1 | Token-Divergenz Türkis vs. v2-Spec | `tokens.css` Z. 54–85 | OFFEN |
| 🔴 | B2 | Hardcodierte COLORS in EdvanceLogo | `EdvanceLogo.tsx` Z. 18–23 | OFFEN |
| 🔴 | B3 | `var(--card)` nicht in `:root` | 8 Dateien | OFFEN |
| 🟡 | W1 | Inline `boxShadow` ScenarioCelebration | Z. 42 | OFFEN |
| 🟡 | W2 | `SHADOW_CARD` Inline-Style | CoachDashboard, AdminDashboard | OFFEN |
| 🟡 | W3 | `'#fff'` in MCWidget | Z. 37 | OFFEN |
| 🟡 | W4 | `#16a34a` ohne Token (MatchingWidget) | Z. 15 | OFFEN |
| 🟡 | W5 | `#9A6B00` in StudentDashboard | Z. 305 | OFFEN |
| 🟡 | W6 | `'white'` in DiagnosisResult | Z. 634, 638, 645 | OFFEN |
| 🟡 | W7 | Touch-Target < 44px (LeadsPage Buttons) | Z. 214–229 | OFFEN |
| 🟡 | W8 | `index.tsx` 559 Z. (Limit: 400) | `edvance/index.tsx` | OFFEN |
| 🟡 | P1 | `DiagnosisResult.tsx` splitten (946 Z.) | — | OFFEN |
| 🟡 | P1 | `DiagnosisSession.tsx` splitten (764 Z.) | — | OFFEN |
| 🟡 | P1 | `--primary` vs. `--color-primary` Divergenz | `globals.css` | OFFEN |
| ⚠️ | R1 | Edge Function CORS Wildcard | `provision_student/index.ts` Z. 16 | Rasit entscheidet |
| ⚠️ | R2 | `/showcase` + `/demo/*` ungeschützt | `App.tsx` | Vor Go-Live |
| 🟡 | N4 | `--streak-orange` nicht auf `tokens.css` | `globals.css` Z. 48 | OFFEN |

## Gesamtbewertung: 🔴 ROT

5 Blocker aktiv (P0, P0b, B1, B2, B3). Kein Main-Merge bis P0 + B3 behoben.

## Nächste Schritte (empfohlene Reihenfolge)

1. **B3-Fix** (sofort, 8 Dateien, ~15 Min.): `var(--card)` → `var(--color-bg-surface)` — silent render-bug
2. **P0-Fix** (sofort, ~5 Z.): role-Guard in `DiagnosisResult.tsx` Z. 681
3. **P0b-Fix** (sofort, ~5 Z.): Coach-Name aus DB-Join in `DiagnosisResult.tsx` Z. 655
4. **W3-Fix** (1 Z.): `'#fff'` → `'var(--primary-foreground)'` in `MCWidget.tsx`
5. **W7-Fix** (1 Z.): `min-h-[44px]` in `LeadsPage.tsx` Subject-Buttons
6. **v2-Migration** (`CLAUDE_CODE_MIGRATION_PROMPT.md`): löst B1, B2, W1–W6 + Token-Divergenzen
7. **Splitting-Session**: DiagnosisResult + DiagnosisSession + index.tsx
