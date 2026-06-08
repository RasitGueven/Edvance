# Retro 2026-06-08 — Code-Review nach PR #18 (Brand-System + Farbsystem)

**Branch:** `main` (nach Merge PR #18)
**Datum:** 2026-06-08
**Prüfer:** Review-Agent (claude/sweet-ramanujan-jq0nE)

---

## TypeScript-Status

`npx tsc --noEmit` — **0 Fehler.** ✅

---

## Dateigrössen (Limit: 400 Zeilen laut CLAUDE.md §4)

| Datei | Zeilen | Priorität |
|---|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 | 🔴 Kritisch — Split dringend |
| `src/pages/DiagnosisSession.tsx` | 764 | 🔴 Kritisch — Split dringend |
| `src/components/edvance/index.tsx` | 559 | 🟡 Hoch |
| `src/pages/DesignShowcase.tsx` | 478 | 🟡 Mittel |
| `src/types/index.ts` | 461 | 🟡 Mittel |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | 🟡 Mittel |
| `src/pages/student/StudentDashboard.tsx` | 419 | 🟡 Mittel |

---

## Status bekannter offener Punkte (aus Review 07.06.2026)

| Punkt | Status |
|---|---|
| P0: Korrekt-Quote-KPI hinter Coach-Guard | 🔴 NOCH OFFEN |
| P1: AdminDashboard + CoachDashboard boxShadow-Inline-Styles | 🔴 NOCH OFFEN |
| P1: DiagnosisResult.tsx (946 Z.) splitten | 🔴 NOCH OFFEN |
| P1: DiagnosisSession.tsx (764 Z.) splitten | 🔴 NOCH OFFEN |
| P2: LoadingPulse in 3 Schüler-Screens | 🔴 NOCH OFFEN |
| P2: EmptyState in 3 Stellen | ⚠️ TEILWEISE (Admin/Coach ok, StudentDashboard noch offen) |
| P2: Hex-Farben in MatchingWidget/MCWidget | 🔴 NOCH OFFEN |

---

## Neue Befunde

### N1 — Token-Divergenz: `--primary` vs. `--color-primary` (zwei verschiedene Hex-Werte)
**Warnung — architektonisches Risiko**

- `src/styles/globals.css` Z. 12: `--primary: #2D6A9F` (Legacy)
- `src/styles/tokens.css` Z. 5: `--color-primary: #334D7A` (Brand-Navy)

Zwei verschiedene Blautöne. Komponenten die `var(--primary)` nutzen erscheinen heller als Komponenten die `var(--color-primary)` nutzen. **Rasit muss entscheiden:** (A) `--primary` auf `var(--color-primary)` umbiegen oder (B) bewusst als Legacy-Blau beibehalten.

### N2 — `DiagnosisSession.tsx` Z. 33: hardcodierter `boxShadow` als Inline-Style
`boxShadow: '0 3px 0 0 var(--primary-shadow)'` — kein entsprechendes Utility in `globals.css`. → `.shadow-btn-press` als Utility definieren.

### N3 — `EdvanceLogo.tsx`: Inline-Styles für statische Layout-Properties
- Z. 115: `style={{ flexShrink: 0 }}` → `className="shrink-0"` verfügbar
- Wordmark-Span (Z. 137–148) und Container-Div (Z. 154–159): `fontFamily`, `fontWeight`, `fontSize`, `letterSpacing`, `display`, `alignItems` etc. als statische Inline-Styles — sollten als Tailwind-Klassen oder CSS-Klasse `.edvance-logo` ausgelagert werden
- COLORS-Objekt mit Hex-Werten (Z. 18–23) ist für SVG-Attribute technisch tolerierbar, sollte aber kommentiert sein

### N4 — `globals.css` Z. 48: `--streak-orange` nicht auf `tokens.css` umgebogen
`--streak-orange: #EA580C` fehlt in tokens.css, obwohl der PR-Kommentar "Legacy-Aliase umgebogen" behauptet. → `--color-streak-orange: #EA580C` in `tokens.css` aufnehmen, in `globals.css` auf `var(--color-streak-orange)` umbiegen.

### N5 — `/diagnosis/result` ohne Auth-Schutz
`App.tsx` Z. 124–125: Route ohne `ProtectedRoute`. Der Coach-View mit allen KPIs ist ohne Login erreichbar solange DiagnosisContext-State im Tab vorhanden ist.

---

## Brand-Komponenten-Check (neu seit PR #18)

### `src/components/brand/EdvanceLogo.tsx`
- SVG-Pfad-Attribute mit Hex-Defaults: technisch unvermeidbar (SVG kann keine CSS-Variablen in `stroke`/`fill` ohne `currentColor`-Trick), aber undokumentiert
- Statische Inline-Styles für Layout-Properties: CLAUDE.md §11-Verstoss → P2

### `src/styles/tokens.css`
✅ Vollständig, keine Duplikate, gut strukturiert

### `src/styles/globals.css`
- ✅ `@import "./tokens.css"` korrekt an erster Stelle
- ✅ `@theme inline`-Block mappt neue `--color-*`-Tokens korrekt
- ✅ Shadow-Utilities als `@layer utilities` korrekt definiert
- ⚠️ `--streak-orange` nicht umgebogen (N4)
- ⚠️ `--primary` Divergenz (N1)

---

## Gesamtbewertung: 🔴 ROT

**Begründung:** P0-Blocker (Korrekt-Quote für Schüler sichtbar) aus dem Review vom 07.06.2026 ist weiterhin ungefiltert aktiv. Schüler erreichen `/screening/result` (ProtectedRoute mit `allowedRoles={['student', ...]}`) und sehen `correctCount/completedSnaps.length` aus Coach-Ratings — direktes Richtig/Falsch-Feedback. Verstoss gegen CLAUDE.md §6 + Schüler-Screen-Regeln §11. Muss vor dem nächsten Merge auf `main` behoben sein.

---

## Priorisierte offene Punkte

### P0 — Blocker (vor nächstem Main-Merge)
1. **DiagnosisResult.tsx: Korrekt-Quote-KPI hinter Coach-Guard**
   - `src/pages/DiagnosisResult.tsx` Z. 679–686
   - `useAuth()` einsetzen; KpiCard nur wenn `role === 'coach' || role === 'admin'`
   - Alternativ: `/screening/result` `allowedRoles` auf `['coach', 'admin']` einschränken

### P1 — Vor nächstem Feature-Branch
2. **DiagnosisResult.tsx (946 Z.) splitten** → `src/components/edvance/diagnosis/` (KpiStrip, BehaviorProfile, SkillLevelGrid, FocusPlan, SnapshotTimeline)
3. **DiagnosisSession.tsx (764 Z.) splitten** → QuestionCard, TimerBar, CoachRatingPanel extrahieren
4. **AdminDashboard.tsx + CoachDashboard.tsx: boxShadow-Inline-Styles entfernen**
   - `src/pages/admin/AdminDashboard.tsx` Z. 20, 71, 183
   - `src/pages/coach/CoachDashboard.tsx` Z. 25–26, 82, 110
   - `SHADOW_CARD` → `shadow-card`, `<Card>` → `<EdvanceCard>`
5. **Token-Divergenz `--primary` vs. `--color-primary` klären** (Rasit entscheidet)
6. **DiagnosisSession.tsx Z. 33: `.shadow-btn-press` Utility definieren**

### P2 — Nächste Refactor-Session
7. `LoadingPulse` in TaskPlayer, ClusterView, StudentDashboard
8. `EmptyState` in StudentDashboard Z. 287–291
9. `MatchingWidget.tsx` TINTS → CSS-Variablen: `var(--color-primary)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-moment-repair)`
10. `MCWidget.tsx` Z. 37: `'#fff'` → `'var(--text-inverse)'`
11. `StudentDashboard.tsx` Z. 305: `'#9A6B00'` → `'var(--color-accent-on)'`
12. `globals.css` Z. 48: `--streak-orange` auf `tokens.css` umbiegen
13. `EdvanceLogo.tsx`: statische Inline-Styles → Tailwind/CSS-Klassen, COLORS-Konstanten kommentieren
