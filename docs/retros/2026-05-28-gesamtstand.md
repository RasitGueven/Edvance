# Retro 2026-05-28 — Gesamtstand & Review

Branch: `claude/sweet-ramanujan-aFjM6` / Stand: main (Merge #18 — Brand-System + Level-Up Farbsystem-Feinschliff)

## Zusammenfassung

Review des gesamten Codbases nach dem Farbsystem-Feinschliff-Milestone (PR #18).
Der Lib-Layer ist diszipliniert — kein direkter Supabase-Zugriff in Komponenten oder Pages.
BehaviorSnapshots bleiben append-only. ProtectedRoute wird konsequent eingesetzt.
Die Haupt-Blocker sind identisch mit dem letzten Review vom 2026-05-27 und wurden
seit dem Merge nicht behoben: Inline-Styles, hardcodierte Farben,
`SHADOW_CARD`-Inline-`boxShadow`, und Dateigrößen-Überschreitungen.

---

## TypeScript-Check

`npx tsc --noEmit` → **kein Output, Exit 0** — kein TypeScript-Fehler im gesamten Projekt.

---

## Bestätigt sauber

- Lib-Layer-Disziplin: kein `supabase.` und kein `.from('` direkt in Pages oder Components — alle DB-Aufrufe ausschließlich in `src/lib/supabase/`.
- BehaviorSnapshots: `src/lib/supabase/behavior.ts` enthält ausschließlich `insert` — kein `update`, kein `delete`. Append-only-Regel eingehalten.
- ProtectedRoute: alle App-Routen sind mit `<ProtectedRoute allowedRoles={[...]}>` geschützt. Kein manueller Rollen-Check in Pages.
- `.env` steht korrekt in `.gitignore` (`.env` und `.env.local`). Keine gestagten Env-Dateien.
- `service_role`-Key: kein Vorkommen in `src/` — nur anon-Key im Frontend.
- Kind-seitiges Feedback: kein `isCorrect`, kein `correctAnswer`, keine Richtig/Falsch-Indikatoren in `src/pages/student/`.
- Touch-Targets: Task-Widgets (MCWidget, MatchingWidget) verwenden `min-h-[52px]` bzw. `min-h-[44px]`. DashboardTiles ebenfalls `min-h-[44px]`.
- EmptyState-Komponente: wird an 21 Stellen in Pages eingesetzt — kein leerer Zustand ohne Komponente gefunden.
- `npm run lint` (`tsc -b --noEmit`) sauber.
- Keine Testdateien vorhanden → kein fehlgeschlagener Test.

---

## Blocker

### B1 — `EdvanceLogo.tsx`: Inline-Styles für statische Werte (seit 2026-05-20 offen)
Datei: `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx`

- Z.115: `style={{ flexShrink: 0 }}` auf SVG-Element — statischer Wert, Tailwind `shrink-0` verfügbar.
- Z.137–145: Wordmark-`<span>` mit vollständigem Stil-Objekt: `fontFamily`, `fontWeight`, `fontSize`, `letterSpacing`, `color`, `lineHeight`, `userSelect` — alle statisch und via Tailwind oder CSS-Variable lösbar.
- Z.154–159: Wrapper-`<div>` mit `display`, `alignItems`, `gap`, `flexDirection`, `...style` — partiell dynamisch (`gap`, `flexDirection`), aber `display`/`alignItems` sind statisch.
- Z.201–208: `AvatarIcon`-Wrapper mit `width`, `height`, `borderRadius`, `background`, `display`, `alignItems`, `justifyContent`, `flexShrink` — Mix aus dynamischen und statischen Werten; statische Teile müssen als Tailwind-Klassen raus.

Regel: „Keine Inline-Styles außer für wirklich dynamische Werte (z.B. berechnete Prozentzahlen)."
Der `fontFamily`-Wert `'Space Grotesk', sans-serif` ist statisch — gehört in eine CSS-Klasse oder Tailwind-`font-`-Utility.

### B2 — `AdminDashboard.tsx` + `CoachDashboard.tsx`: `SHADOW_CARD` als `boxShadow`-Inline-Style

Datei: `/home/user/Edvance/src/pages/admin/AdminDashboard.tsx`
- Z.20: `const SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'`
- Z.71, Z.183: `<Card style={{ boxShadow: SHADOW_CARD }}>` — statischer Shadow als Inline-Style.
- Z.73: `style={{ background: SUCCESS_ICON_BG }}` mit `color-mix()`-Wert — sollte als CSS-Variable oder Tailwind-Utility definiert sein.

Datei: `/home/user/Edvance/src/pages/coach/CoachDashboard.tsx`
- Z.25: `const SHADOW_CARD = '0 1px 6px 0 rgba(0,0,0,0.07)'`
- Z.26: `const SHADOW_ACTIVE = '0 2px 12px 0 rgba(15,110,86,0.10)'`
- Z.82, Z.110: `style={{ boxShadow: SHADOW_CARD }}` und `style={{ boxShadow: ... SHADOW_ACTIVE }}`.
- Z.86: `style={{ backgroundColor: iconBackground }}` — `iconBackground` ist ein dynamischer Prop, aber der Wert kommt aus hardcodierten Konstanten (`ICON_BG_PRIMARY`, etc.).

Regel aus CLAUDE.md: „Statische `boxShadow` in Inline-Styles — die `shadow-*` Utilities nutzen." Die Shadow-Werte gehören als Token in `src/styles/tokens.css` und als `shadow-elevation-*`-Utility gemappt.

### B3 — Hardcodierte Literal-Farben in Komponenten

**`MCWidget.tsx` Z.37:**
```
color: active ? '#fff' : 'var(--primary)',
```
`'#fff'` ist ein Literal — muss `'var(--color-white)'` oder `'white'`→`'var(--background)'` sein (je nach semantischer Intention).

**`DiagnosisResult.tsx` Z.634, Z.638, Z.645:**
```
style={{ background: 'white' }}
style={{ background: 'white', borderBottom: '4px solid color-mix(in srgb, white 80%, black)' }}
```
Literal `'white'` — muss `var(--background)` oder `var(--card)` sein. Zusätzlich: `color-mix(in srgb, white 80%, black)` bricht im Dark Mode.

**`DiagnosisResult.tsx` Z.661:**
```
style={{ background: 'color-mix(in srgb, var(--success) 30%, white)', color: 'var(--success-dark)' }}
```
`white` im `color-mix()` → Dark-Mode-Problem.

**`DiagnosisResult.tsx` Z.846:**
```
background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, white) 0%, color-mix(in srgb, var(--primary-dark) 4%, white) 100%)'
```
`white` im Gradient → Dark-Mode-Problem.

**`TaskQuestionBlock.tsx` Z.57, Z.119:**
```
style={{ backgroundColor: m.accent, color: 'white' }}
style={{ backgroundColor: tint.accent, color: 'white' }}
```
`'white'` muss `'var(--color-white)'` oder sinnvoller `'var(--text-on-primary)'` sein.

### B4 — `DrawCanvas.tsx`: Hardcodierte Hex-Farben für Canvas-Kontext

Datei: `/home/user/Edvance/src/components/edvance/DrawCanvas.tsx`
- Z.14: `const STROKE_COLOR = '#0F172A'`
- Z.16: `const BG_COLOR = '#FFFFFF'`
- Z.40, Z.42, Z.89, Z.105: Verwendung als `ctx.strokeStyle`, `ctx.fillStyle`, `style={{ background: BG_COLOR }}`.

`BG_COLOR = '#FFFFFF'` ist ein Hardcode. Canvas-2D-Context kann keine CSS-Variablen direkt lesen, aber der DOM-Wrapper-`style` bei Z.105 sollte `var(--background)` nutzen. Für den Canvas-Context selbst muss `getComputedStyle` genutzt werden, um den tatsächlichen Wert zur Laufzeit zu lesen.

### B5 — `MatchingWidget.tsx`: Semantisches Farbpaletten-Array mit Hex-Codes

Datei: `/home/user/Edvance/src/components/edvance/tasks/MatchingWidget.tsx`
- Z.14–17: Vier Paarungsfarben als Hex-Literale (`#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed`) plus `color-mix(in srgb, #2D6A9F 10%, white)` etc.

Diese Palette ist nicht in `tokens.css` definiert. Sie sollte als `--color-match-1` bis `--color-match-4` in den Design-Tokens stehen.

---

## Warnungen

### W1 — Dateigröße-Überschreitungen (kritischste zuerst — siehe eigener Abschnitt)

### W2 — `edvance/index.tsx` Z.309–310: Hex-Farbpalette im Component-File
```
'#2D6A9F', '#0F6E56', '#D97706', '#7C3AED', '#EA580C', '#0E7490', '#BE185D', '#065F46'
```
8 Hex-Codes als hardcodiertes Array im Component-File. Gehören in `tokens.css` oder `mockData.ts`.

### W3 — `edvance/index.tsx` Z.272: `color-mix()` mit `white`
```
style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
```
Bricht im Dark Mode. Ersatz: `color-mix(in srgb, ${color} 14%, transparent)` oder CSS-Variable.

### W4 — `StudentDashboard.tsx` Z.305: Gemischte CSS-Variablen und Hex-Literal
```
{ bg: 'color-mix(in srgb, var(--xp-gold) 14%, white)', fg: '#9A6B00' }
```
`#9A6B00` ist ein Hex-Literal — sollte `var(--color-accent-dark)` oder ähnlich sein. `white` im `color-mix()` → Dark-Mode-Problem.

### W5 — `ThemeContext.tsx` Z.8–11: Hex-Farben für Theme-Palette
```
edvance: { primary: '#2D6A9F', light: '#98C0D8', dark: '#1B2A3E' }
```
Die ThemeContext-Werte sind Hex-Literale. Da ThemeContext laut CLAUDE.md „nie ohne Freigabe ändern" gilt, ist dies ein Eskalationspunkt für Rasit — aber die Farben sollten mittelfristig auf CSS-Variablen-Referenzen umgestellt werden.

### W6 — `/showcase` und `/demo/*` ohne Auth-Schutz
Routen:
- `/showcase` → `<DesignShowcase />`
- `/demo/widgets` → `<TaskWidgetDemo />`
- `/demo/design` → `<DesignDemo />`

Alle drei sind in `App.tsx` ohne `<ProtectedRoute>` registriert (Z.118–120). Vor Produktionsstart müssen diese entweder entfernt oder auf `allowedRoles={['admin']}` eingeschränkt werden.

### W7 — `LambacherPreview.tsx` Z.52: `color-mix()` mit `white`
```
backgroundColor: `color-mix(in srgb, ${color} 14%, white)`
```
Gleiche Dark-Mode-Problematik wie W3.

### W8 — `DiagnosisSession.tsx`: Viele Inline-Styles mit dynamischen Werten
Die Datei nutzt Inline-Styles an Z.31, 62, 101, 125, 198, 286, 421, 463, 478 für dynamische Farbwerte und `color-mix()`-Berechnungen. Während dynamische Werte per se erlaubt sind, sollten `color-mix(in srgb, ${color} 25%, transparent)` etc. als CSS-Utility-Klassen oder über CSS Custom Properties auf einem Parent-Element gelöst werden, sobald die Datei refaktoriert wird.

### W9 — Nahezu an der 400-Zeilen-Grenze
- `/home/user/Edvance/src/lib/diagnostic/generator.ts` — 395 Zeilen (5 Zeilen unter Limit)
- `/home/user/Edvance/src/pages/admin/LeadsPage.tsx` — 382 Zeilen

---

## Dateigröße-Überschreitungen

| Datei | Zeilen | Überschreitung | Priorität |
|---|---|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 | +546 | Kritisch — sofort aufteilen |
| `src/pages/DiagnosisSession.tsx` | 764 | +364 | Kritisch — sofort aufteilen |
| `src/components/edvance/index.tsx` | 559 | +159 | Hoch — Barrel zerlegen |
| `src/pages/DesignShowcase.tsx` | 478 | +78 | Mittel — pre-Produktion |
| `src/types/index.ts` | 461 | +61 | Mittel — in Sub-Module aufteilen |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | +27 | Niedrig |
| `src/pages/student/StudentDashboard.tsx` | 419 | +19 | Niedrig |

**Empfohlene Aufteilungen:**

`DiagnosisResult.tsx` (946 Zeilen): Aufteilen in mindestens 3 Dateien:
- `DiagnosisResultSummary.tsx` — Ergebniszusammenfassung / Score-Anzeige
- `DiagnosisResultClusters.tsx` — Cluster-Analyse-Sektion
- `DiagnosisResultActions.tsx` — CTA-Sektion / Weiterleitung

`DiagnosisSession.tsx` (764 Zeilen): Aufteilen in:
- `DiagnosisSessionProgress.tsx` — Fortschritts-Header
- `DiagnosisSessionQuestion.tsx` — Frage-Rendering

`edvance/index.tsx` (559 Zeilen): Barrel bleibt, aber `StatCard`, `EmptyState`, `LoadingPulse` etc. in eigene Dateien auslagern und re-exportieren.

---

## P0-Punkte (vor erstem Schüler-Einsatz)

### P0-A — Diagnostik-Content-Seeding: `tasks.is_diagnostic = true`
Der `/screening`-Flow (`DiagnosisSession screening`) lädt Aufgaben mit `is_diagnostic = true` aus der DB. Laut letztem Review-Stand (2026-05-27) wurden diese noch nicht in Supabase geseedet. Ohne geseedete diagnostische Aufgaben startet der `/screening`-Flow leer.
**Aktion:** Rasit muss `scripts/mark-diagnostic.ts` oder den `/admin/diagnostics`-UI-Flow ausführen, um mindestens 15–25 Aufgaben als diagnostisch zu markieren.

### P0-B — Browser-Verifikation U4 + `/screening`-DB-Resume
Der DB-Resume-Mechanismus (Fortsetzen einer unterbrochenen Diagnostik) in `src/lib/supabase/screening.ts` wurde noch nicht end-to-end im Browser verifiziert.
**Aktion:** Rasit führt manuellen Browser-Test durch: Session starten → Tab schließen → neu öffnen → Resume prüfen.

### P0-C — Lambacher-Bulk-Import (15–25 Aufgaben)
`scripts/import/lambacher.ts` ist vorhanden, aber der Import wurde laut letztem Stand noch nicht ausgeführt.
**Aktion:** Import ausführen und in `/admin/diagnostics` verifizieren.

### P0-D — WCAG-AA-Prüfung Türkis / Repair
Nach dem Level-Up-Türkis-Milestone (`--color-levelup #0E9E96`) und Repair (`--color-moment-repair #8B5CF6`) wurde kein Kontrast-Check dokumentiert.
**Aktion:** Kontrastverhältnis `--color-levelup-on` (#04302D) auf `--color-levelup`-Hintergrund in Browser-DevTools oder axe prüfen. Ziel: WCAG AA (4.5:1 für Text).

---

## Nächste Schritte (priorisiert)

1. **[B3 + B2, Rasit, sofort]** `DiagnosisResult.tsx` Z.634/638/645/661/846: `'white'`-Literale durch `var(--background)` oder `var(--card)` ersetzen. `SHADOW_CARD` in AdminDashboard und CoachDashboard durch `shadow-card`-Utility ersetzen.

2. **[B1, Rasit, sofort]** `EdvanceLogo.tsx`: Statische Inline-Style-Werte (fontFamily, fontWeight, fontSize, letterSpacing, flexShrink) in Tailwind-Klassen überführen. Dynamische Werte (gap, flexDirection, color, size) dürfen als Inline-Style bleiben.

3. **[B3, Rasit, sofort]** `MCWidget.tsx` Z.37: `'#fff'` → `'var(--color-on-primary)'` oder `'var(--background)'`. `TaskQuestionBlock.tsx` Z.57/119: `color: 'white'` → `color: 'var(--color-on-primary)'`.

4. **[B4, Rasit, bald]** `DrawCanvas.tsx`: `BG_COLOR` und `STROKE_COLOR` aus Computed Style via `getComputedStyle(canvas).getPropertyValue('--background')` etc. lesen statt Hardcode. DOM-Wrapper `style={{ background: BG_COLOR }}` → `className="bg-[var(--card)]"`.

5. **[B5 + W2, Rasit, bald]** `MatchingWidget.tsx` und `edvance/index.tsx`: Hex-Farbpaletten in `tokens.css` als `--color-match-1..4` definieren und per CSS-Variable referenzieren.

6. **[W6, Rasit, vor Produktion]** `/showcase` und `/demo/*`-Routen mit `<ProtectedRoute allowedRoles={['admin']}>` absichern oder aus dem Build entfernen.

7. **[P0-A, Rasit, sofort]** Diagnostik-Aufgaben seeden (mindestens 15 Aufgaben mit `is_diagnostic = true`) damit `/screening`-Flow funktioniert.

8. **[P0-B, Rasit, sofort]** Browser-Test: `/screening`-Resume nach Tab-Close.

9. **[P0-C, Rasit, diese Woche]** Lambacher-Bulk-Import (`npm run import:lambacher`) ausführen.

10. **[Dateigröße, nächste Session]** `DiagnosisResult.tsx` und `DiagnosisSession.tsx` aufteilen (je mindestens 2–3 Teilkomponenten). Erst nach P0-Items.
