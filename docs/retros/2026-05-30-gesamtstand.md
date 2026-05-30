# Retro 2026-05-30 — Vollständiger Codebase-Review

**Branch:** `dev` (nach Merge feature/levelup-tuerkis, PR #18)
**Reviewer-Agent:** Schritt 3/4 der Review-Pipeline
**TypeScript-Ergebnis:** `npx tsc --noEmit` — **0 Fehler, 0 Warnungen**

---

## Bestätigt sauber

- TypeScript kompiliert fehlerfrei (Stand 2026-05-30)
- Kein direkter `supabase.` / `from('` Aufruf in Pages oder Komponenten — alle DB-Aufrufe korrekt hinter `src/lib/supabase/` gekapselt
- `AuthContext` delegiert vollständig an `src/lib/supabase/auth` und `src/lib/supabase/profiles`
- Alle auth-pflichtigen Routen in `App.tsx` korrekt mit `<ProtectedRoute allowedRoles={[...]}>` gesichert
- `.env` und `.env.local` sind korrekt in `.gitignore` eingetragen
- Kein `service_role`-Key im Frontend-Code gefunden
- Kein kind-seitiges Richtig/Falsch-Feedback: `StudentView` in `DiagnosisSession.tsx` zeigt nur "Danke! Gleich geht's weiter." während der Coach bewertet; `TaskPlayer.tsx` zeigt kein Antwortergebnis
- `BehaviorSnapshots`: kein `update`- oder `delete`-Aufruf auf dieser Tabelle in `src/lib/`
- `TaskPedagogyAccordion.tsx` (vorheriger Blocker B2/B3): vollständig auf `var(--primary-pale)`, `var(--success-light)`, `var(--warning-light)` umgestellt — kein Hex mehr
- Gamification-Tokens nach Level-Up-Session korrekt als CSS-Variablen in `tokens.css` (Türkis, Repair-Lila, Gold-Vereinheitlichung)
- `DashboardTiles.tsx`: verwendet `EdvanceCard`, saubere CSS-Variable für `ICON_BG`
- `EmptyState` und `LoadingPulse` korrekt eingesetzt in `CoachStep.tsx`, diverse Dashboards
- `CoachDashboard.tsx`, `StudentDashboard.tsx`, `AdminDashboard.tsx` holen Daten korrekt aus `src/lib/`

---

## Blocker

### B-NEU-1: `--primary-dark` CSS-Variable nicht definiert
**Schweregrad: KRITISCH** — Gradient silently fallback (transparent), visuell kaputt auf allen betroffenen Screens.

Die Variable `--primary-dark` wird an 8 Stellen als Gradient-Endpunkt verwendet, ist jedoch in weder `globals.css` noch `tokens.css` deklariert. Browser fallen auf `initial` (transparent) zurück.

Betroffene Stellen:
- `/home/user/Edvance/src/components/edvance/onboarding/StepIndicator.tsx:5`
- `/home/user/Edvance/src/components/edvance/onboarding/CoachStep.tsx:7`
- `/home/user/Edvance/src/pages/DiagnosisSession.tsx:32` und `:64`
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:626`, `:846`, `:870`, `:891`

Behebung: In `globals.css` unter `/* Semantic */` einfügen:
```css
--primary-dark: #1a4a73;
```
(identisch mit `--primary-shadow`, das bereits vorhanden ist — ggf. Alias prüfen).

---

### B1: `EdvanceLogo.tsx` — COLORS-Palette + statische Inline-Styles (OFFEN)
**Datei:** `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx`

- Zeilen 18–23: `COLORS`-Palette mit 4 Hex-Codes (`#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020`) als interne Konstanten — alle sind in `tokens.css`/`globals.css` verfügbar (`--color-primary`, `--color-bg-surface`, `--color-text-primary`, `--color-accent`)
- Zeile 115: `style={{ flexShrink: 0 }}` — Tailwind `shrink-0` verfügbar
- Zeilen 137–148: Wordmark-`<span>` mit `fontFamily`, `fontWeight`, `fontSize`, `letterSpacing`, `color`, `lineHeight`, `userSelect` als Inline-Style — partiell dynamisch (fontSize), aber `fontFamily` und `letterSpacing` sind statisch
- Zeilen 154–159: Wrapper-`<div>` mit `display: 'inline-flex'`, `alignItems: 'center'`, `gap` (dynamisch), `flexDirection` (dynamisch) — `display`, `alignItems` sind statische Werte

Hinweis: `gap` und `fontSize` sind korrekt dynamisch (aus `size`-Prop berechnet), daher keine echte Tailwind-Alternative. Die statischen Teile (`fontFamily`, `letterSpacing`, `display`, `alignItems`, `shrink`) sollten in eine CSS-Klasse oder Tailwind-Klassen ausgelagert werden.

---

### B3: Hardcodiertes `'white'` und `'#fff'` in Inline-Styles (OFFEN, erweitert)

Folgende Stellen verwenden literales `'white'` statt `var(--surface)` oder `var(--background)`:

- `/home/user/Edvance/src/components/edvance/tasks/MCWidget.tsx:37` — `color: active ? '#fff' : 'var(--primary)'`
- `/home/user/Edvance/src/components/edvance/tasks/TaskQuestionBlock.tsx:57` — `color: 'white'`
- `/home/user/Edvance/src/components/edvance/tasks/TaskQuestionBlock.tsx:119` — `color: 'white'`
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:634` — `style={{ background: 'white' }}` (dekorativer Kreis)
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:638` — `style={{ background: 'white' }}` (dekorativer Kreis)
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:645` — `style={{ background: 'white', borderBottom: '...' }}`
- `/home/user/Edvance/src/pages/DiagnosisResult.tsx:661` — `color-mix(in srgb, var(--success) 30%, white)`

Ersatz: `var(--surface)` für Hintergründe, `var(--text-inverse)` für weiße Schrift auf farbigem Grund.

---

### B4: `DrawCanvas.tsx` — STROKE_COLOR + BG_COLOR hardcodiert (OFFEN)
**Datei:** `/home/user/Edvance/src/components/edvance/DrawCanvas.tsx`

- Zeile 14: `const STROKE_COLOR = '#0F172A'`
- Zeile 16: `const BG_COLOR = '#FFFFFF'`
- Zeile 105: `style={{ background: BG_COLOR }}`

`STROKE_COLOR` entspricht ungefähr `--text-primary` (`#1A1A18`). `BG_COLOR` sollte `var(--surface)` werden. Canvas-Context (`ctx.strokeStyle`, `ctx.fillStyle`) kann keine CSS-Variablen direkt lesen — hier wäre `getComputedStyle(document.documentElement).getPropertyValue('--surface')` nötig, oder die Inline-Style-Zuweisung bleibt als akzeptierte Ausnahme (dynamischer computed value). Die Konstanten außerhalb des Canvas-Kontexts (`style={{ background: BG_COLOR }}`) müssen jedoch auf `var(--surface)` umgestellt werden.

---

### B5: `MatchingWidget.tsx` — TINTS-Palette mit Hex-Codes (OFFEN)
**Datei:** `/home/user/Edvance/src/components/edvance/tasks/MatchingWidget.tsx`

Zeilen 13–17:
```ts
const TINTS = [
  { line: '#2D6A9F', fill: 'color-mix(in srgb, #2D6A9F 10%, white)' },
  { line: '#16a34a', fill: 'color-mix(in srgb, #16a34a 10%, white)' },
  { line: '#d97706', fill: 'color-mix(in srgb, #d97706 10%, white)' },
  { line: '#7c3aed', fill: 'color-mix(in srgb, #7c3aed 10%, white)' },
]
```

Ersatz: `var(--primary)`, `var(--success)`, `var(--warning)`, `var(--level-purple)`. Das `color-mix()`-Pattern ist zulässig (dynamischer Wert), aber der Hex-String muss durch die CSS-Variable ersetzt werden. Außerdem `white` → `transparent` oder `var(--surface)`.

---

### B-NEU-2: `edvance/index.tsx` — AVATAR_PALETTE mit 8 Hex-Codes (OFFEN)
**Datei:** `/home/user/Edvance/src/components/edvance/index.tsx:309–311`

```ts
const AVATAR_PALETTE = [
  '#2D6A9F', '#0F6E56', '#D97706', '#7C3AED',
  '#EA580C', '#0E7490', '#BE185D', '#065F46',
]
```

Diese Codes werden für `AvatarInitials` verwendet (Hash → Farbe). Da es sich um eine semantische Farbpalette handelt (kein Theme-Switching nötig), wäre eine CSS-Custom-Property-Lösung der sauberste Weg. Mindeststufe: in `tokens.css` als named avatar-colors ablegen.

---

### B-NEU-3: `StudentDashboard.tsx:305` — Hardcodiertes `#9A6B00`
**Datei:** `/home/user/Edvance/src/pages/student/StudentDashboard.tsx:305`

```ts
{ bg: 'color-mix(in srgb, var(--xp-gold) 14%, white)', fg: '#9A6B00' },
```

`#9A6B00` ist ein Gold-On-Color. Ersatz: `var(--color-accent-on)` (`#4A2E00` aus `tokens.css`) oder ein neues `--xp-gold-on`-Token. Außerdem `white` → `transparent`.

---

### B-NEU-4: `TaskWidgetDemo.tsx:155` — Hardcodiertes `color="#7c3aed"`
**Datei:** `/home/user/Edvance/src/pages/student/TaskWidgetDemo.tsx:155`

```tsx
color="#7c3aed"
```

Prop an `Section`-Komponente. Ersatz: `color="var(--level-purple)"`.

---

### B-NEU-5: Statische `boxShadow`-Inline-Styles in Pages (OFFEN)
**Datei:** `/home/user/Edvance/src/pages/admin/AdminDashboard.tsx:20`
```ts
const SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'
```
→ Zeilen 71, 183: `style={{ boxShadow: SHADOW_CARD }}`

**Datei:** `/home/user/Edvance/src/pages/coach/CoachDashboard.tsx:25–26`
```ts
const SHADOW_CARD = '0 1px 6px 0 rgba(0,0,0,0.07)'
const SHADOW_ACTIVE = '0 2px 12px 0 rgba(15,110,86,0.10)'
```
→ Zeilen 82, 110: `style={{ boxShadow: ... }}`

Ersatz: `className="shadow-card"` (bereits als Utility-Klasse in `globals.css` definiert). `SHADOW_ACTIVE` könnte `shadow-premium-sm` oder ein neues `--shadow-active` Token werden.

**Datei:** `/home/user/Edvance/src/components/edvance/onboarding/CoachStep.tsx:35`
```ts
boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none',
```
Hier ist der Wert dynamisch (bedingt), daher tolerierbar — aber `ring-2 ring-[var(--primary)]` wäre die Tailwind-Alternative.

---

### B-NEU-6: `ThemePanel.tsx` — Inline-Gradient aus Hex-Werten (OFFEN)
**Datei:** `/home/user/Edvance/src/components/edvance/ThemePanel.tsx:48`

```ts
style={{ background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.primary} 50%, ${colors.dark} 100%)` }}
```

`colors` kommt aus `THEME_PREVIEW` in `ThemeContext.tsx`, das ebenfalls 12 Hex-Codes enthält (Zeilen 8–11). Da `THEME_PREVIEW` rein für die visuelle Vorschau im Dev-Panel gedacht ist und der Panel nur bei `VITE_DEV_THEME_PANEL=true` rendert, ist dies als Dev-Hilfswerkzeug akzeptierbar — sollte aber kommentiert werden.

---

## Warnungen

### W1: Dateien über 400 Zeilen (Refactor empfohlen)

| Datei | Zeilen | Empfehlung |
|---|---|---|
| `/home/user/Edvance/src/pages/DiagnosisResult.tsx` | 946 | Aufteilen in `DiagnosisHeroSection`, `DiagnosisSkillLevels`, `DiagnosisTaskList`, `DiagnosisLearningPlan` |
| `/home/user/Edvance/src/pages/DiagnosisSession.tsx` | 764 | `StudentView` und `CoachView` in separate Dateien auslagern |
| `/home/user/Edvance/src/components/edvance/index.tsx` | 559 | Barrel trennen: separate Dateien für `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials`, `LoadingPulse`, `ToastBanner` |
| `/home/user/Edvance/src/pages/DesignShowcase.tsx` | 478 | Nur als Dev-Seite relevant — tolerierbar |
| `/home/user/Edvance/src/types/index.ts` | 461 | Type-Datei, kein Runtime-Code — tolerierbar |
| `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` | 427 | Grenzwertig — beobachten |
| `/home/user/Edvance/src/pages/student/StudentDashboard.tsx` | 419 | Grenzwertig — `ClusterGrid` und `StreakBanner` könnten ausgelagert werden |

### W2: `color-mix(…, white)` in Inline-Styles
Mehrere Stellen verwenden `color-mix(in srgb, var(--foo) X%, white)`. Das ist technisch zulässig für dynamische Werte, sollte aber `transparent` statt `white` verwenden, damit Dark-Mode-Kompatibilität erhalten bleibt.

Betroffene Dateien:
- `src/components/edvance/index.tsx:272` — `color-mix(in srgb, ${color} 14%, white)`
- `src/pages/DiagnosisResult.tsx:846` — `color-mix(in srgb, var(--primary) 8%, white)`
- `src/pages/DiagnosisResult.tsx:661` — `color-mix(in srgb, var(--success) 30%, white)`
- `src/pages/student/StudentDashboard.tsx:305` — `color-mix(in srgb, var(--xp-gold) 14%, white)`
- `src/components/edvance/tasks/MatchingWidget.tsx:14–17` — alle vier `color-mix`-Einträge

### W3: `streak-orange` in `globals.css` als Hex-Wert
`globals.css:48`: `--streak-orange: #EA580C;` — einzige verbleibende Farbe in `globals.css` mit direktem Hex-Wert statt Verweis auf `tokens.css`. Sollte in `tokens.css` aufgenommen werden.

### W4: `DiagnosisResult.tsx` — übermäßige Inline-Style-Dichte
35 `style={{`-Vorkommen in einer einzelnen Datei. Viele davon nutzen CSS-Variablen korrekt (gut), aber die schiere Anzahl macht die Datei schwer wartbar. Mit der empfohlenen Komponentenaufteilung (W1) würde sich dies entschärfen.

### W5: `DiagnosisSession.tsx:33` — statisches `boxShadow` in Inline-Style
```ts
boxShadow: '0 3px 0 0 var(--primary-shadow)',
```
CSS-Variable korrekt, aber statischer `boxShadow` sollte via Tailwind-Utility oder CSS-Custom-Property abgebildet werden.

---

## Status bekannter Blocker (letzter Review 2026-05-29)

| ID | Beschreibung | Status |
|---|---|---|
| B1 | `EdvanceLogo.tsx` COLORS-Palette + statische Inline-Styles | OFFEN — unverändert |
| B2 | `TaskPedagogyAccordion.tsx` Hex-Farben | BEHOBEN — vollständig auf CSS-Variablen umgestellt |
| B3 | `MCWidget.tsx:37` `#fff`, `DiagnosisResult.tsx` `background:'white'`, `TaskQuestionBlock.tsx` `color:'white'` | OFFEN — alle Fundstellen bestätigt, nicht behoben |
| B4 | `DrawCanvas.tsx:14/16` STROKE_COLOR + BG_COLOR | OFFEN — unverändert |
| B5 | `MatchingWidget.tsx:14–17` Hex-Palette | OFFEN — unverändert |
| Neu | `edvance/index.tsx` AVATAR_PALETTE 8 Hex-Codes | OFFEN — weiterhin vorhanden (index.tsx:309–311) |
| Neu | `StudentDashboard.tsx:305` `fg:'#9A6B00'` | OFFEN — weiterhin vorhanden |
| Neu | `TaskWidgetDemo.tsx:155` `color="#7c3aed"` | OFFEN — weiterhin vorhanden |

Neue Blocker in diesem Review: B-NEU-1 (`--primary-dark` undefined), B-NEU-5 (statische boxShadow), B-NEU-6 (ThemePanel — tolerierbar als Dev-Tool).

---

## Offene P0-Punkte (vor erstem Schüler-Einsatz)

1. **`--primary-dark` definieren** (B-NEU-1) — visuell kaputt auf Diagnose-Screens und Onboarding-Steps; 1-Zeilen-Fix in `globals.css`
2. **Hardcodierte Hex-Farben beseitigen** (B3, B4, B5, B-NEU-2, B-NEU-3, B-NEU-4) — Design-Systembruch, kritisch für Theme-Switching
3. **`DiagnosisResult.tsx` aufteilen** (W1) — 946 Zeilen, Wartbarkeit kritisch für laufende Diagnose-Entwicklung
4. **`boxShadow`-Inline-Styles ersetzen** (B-NEU-5) — Tailwind-Utilities vorhanden, kein Aufwand
5. **`color-mix(…, white)` auf `transparent` umstellen** (W2) — Vorbereitung für zukünftigen Dark Mode
