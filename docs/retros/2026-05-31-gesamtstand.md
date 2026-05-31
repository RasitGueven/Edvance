# Retro 2026-05-31 — Gesamtstand Review

Branch: `claude/sweet-ramanujan-Ff7F7` (auf `dev`-Basis)

## TypeScript

Exit-Code: **0** — sauber.

`npx tsc --noEmit` läuft ohne Ausgabe durch. Kein einziger Typfehler.

Hinweis: `npm run lint` (= `tsc -b --noEmit`) schlägt im Sandbox-Environment mit 2440 Fehlern fehl, weil `node_modules` dort nicht existiert. Das ist ein Sandbox-Artefakt, kein Projektproblem. Der direkte `npx tsc --noEmit` gegen die lokale Build-Konfiguration ist sauber.

---

## Bestätigt sauber

- Kein direktes `supabase.from(` oder `supabase.` in `src/pages/` oder `src/components/` — alle DB-Calls korrekt in `src/lib/` gekapselt.
- Append-only-Tabellen sauber: Kein `update`/`delete` auf `behavior_snapshots`, `xp_events` oder `screening_ratings` in `src/lib/`.
- `service_role`-Key nicht im Frontend vorhanden.
- `.env` und `.env.local` korrekt in `.gitignore` (Zeile 7–8). Kein `.env`-File ist per `git ls-files` getrackt (nur `.env.example`).
- `ProtectedRoute` konsequent für alle auth-pflichtigen Routen in `App.tsx` verwendet.
- Kein Korrekt/Falsch-Feedback in Schüler-Views gefunden.
- EmptyState und LoadingPulse werden in allen Kern-Pages korrekt verwendet (TiersPage, CoachDashboard, ParentDashboard, LeadsPage, DiagnosticsPage, IntakePage, LambacherPreview).
- Keine rohen `<table>`-Elemente in Pages.
- Keine `supabase.`-Calls in Komponenten oder Pages.
- Neues Brand-System (EdvanceLogo, EdvanceSymbol, EdvanceAppIcon) korrekt als eigene Komponente in `src/components/brand/` isoliert.
- Level-Up-Token (`--color-levelup`, `--color-moment-levelup`, `--gradient-levelup`, `--shadow-glow-levelup`) korrekt in `src/styles/tokens.css` definiert.
- Legacy-Gamification-Tokens (`--xp-gold`, `--xp-gold-light`, `--level-purple`) auf Single Source in `tokens.css` umgebogen.

---

## Blocker-Status B1–B-NEU-5

### B1: EdvanceLogo.tsx — statische Inline-Styles
**Status: OFFEN**

`src/components/brand/EdvanceLogo.tsx` Zeilen 115, 137–148, 154–160, 201–211 enthalten statische Inline-Styles für `flexShrink`, `fontFamily`, `fontWeight`, `fontSize`, `letterSpacing`, `lineHeight`, `userSelect`, `display`, `alignItems`, `gap`, `flexDirection`, `width`, `height`, `borderRadius`, `background`, `justifyContent`.

Einige davon (z.B. `gap` als berechneter Wert aus `size`) sind dynamisch und technisch gerechtfertigt. Die Font-bezogenen Styles auf dem Wordmark-`<span>` (Zeile 137–148) sind jedoch statisch und müssten als CSS-Klasse oder über `@font-face`-Utility abgebildet werden. Das Bauteil ist neu im letzten Commit entstanden — teilweise akzeptierbar wegen SVG-Integration, aber die statischen Font-Styles sind ein Verstoß.

### B3: MCWidget.tsx '#fff' — OFFEN
**Status: OFFEN**

`src/components/edvance/tasks/MCWidget.tsx` Zeile 37: `color: active ? '#fff' : 'var(--primary)'`

Hardcodierte Hex-Farbe `#fff` — muss `'var(--text-inverse)'` werden.

### B3: DiagnosisResult.tsx 'white' — OFFEN (neue Form)
**Status: OFFEN**

`src/pages/DiagnosisResult.tsx` Zeilen 634, 638, 645, 661, 846: Literal `'white'` als Inline-Style-Wert (background und color-mix-Parameter). `'white'` ist eine hardcodierte Farbe — muss `'var(--surface)'` oder `'var(--background)'` werden.

### B3: TaskQuestionBlock.tsx 'white' — OFFEN
**Status: OFFEN**

`src/components/edvance/tasks/TaskQuestionBlock.tsx` Zeilen 57, 119: `color: 'white'` als Inline-Style. Muss `'var(--text-inverse)'` werden.

### B4: DrawCanvas.tsx STROKE_COLOR/BG_COLOR — OFFEN
**Status: OFFEN**

`src/components/edvance/DrawCanvas.tsx` Zeilen 14, 16: `STROKE_COLOR = '#0F172A'` und `BG_COLOR = '#FFFFFF'`. Beide hardcodiert. Müssen auf CSS-Variablen umgebogen werden (`var(--text-primary)` bzw. `var(--surface)`).

### B5: MatchingWidget.tsx Hex-Palette — OFFEN
**Status: OFFEN**

`src/components/edvance/tasks/MatchingWidget.tsx` Zeilen 14–17: `TINTS`-Array mit 4 Hex-Farben (`#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed`) plus `white` als color-mix-Parameter. Keine der vier Farben ist durch eine CSS-Variable ersetzt. Müssen auf Token-Variablen abgebildet werden (z.B. `var(--primary)`, `var(--success)`, `var(--warning)`, `var(--color-moment-repair)`).

### B-NEU-1: `--primary-dark` CSS-Variable nicht definiert — OFFEN
**Status: OFFEN — kritischer als bisher bekannt**

`--primary-dark` ist weder in `src/styles/globals.css` noch in `src/styles/tokens.css` definiert. Der einzige ähnliche Token heißt `--primary-shadow` (`#1a4a73`). Die Variable wird an 8 Stellen verwendet:

- `src/components/edvance/onboarding/StepIndicator.tsx:5` — ACTIVE_BG-Gradient
- `src/components/edvance/onboarding/CoachStep.tsx:7` — AVATAR_GRADIENT
- `src/pages/DiagnosisSession.tsx:32, 64` — Gradient-Hintergründe
- `src/pages/DiagnosisResult.tsx:626, 846, 870, 891` — Gradient-Hintergründe

Alle Gradienten fallen still zurück auf transparent (CSS-Verhalten bei undefined Variable). Das ist ein visueller Bug, der auf allen Diagnose-Screens und Onboarding-Schritten sichtbar ist. **P0 vor Schüler-Einsatz.**

Korrekturoption: `--primary-dark: var(--primary-shadow)` in `globals.css` ergänzen oder alle Verwendungen auf `--primary-shadow` umschreiben.

### B-NEU-2: edvance/index.tsx AVATAR_PALETTE 8 Hex — OFFEN
**Status: OFFEN**

`src/components/edvance/index.tsx` Zeilen 309–310: `AVATAR_PALETTE` mit 8 hardcodierten Hex-Farben (`#2D6A9F`, `#0F6E56`, `#D97706`, `#7C3AED`, `#EA580C`, `#0E7490`, `#BE185D`, `#065F46`). Diese werden via `nameToColor()` als `backgroundColor` in `AvatarInitials` gesetzt (Zeile 343, `style={{ backgroundColor: bg }}`).

Da der Wert dynamisch berechnet wird (Hash aus Name), ist das `style={{}}`-Attribut technisch unvermeidlich. Der eigentliche Verstoß liegt in den hardcodierten Hex-Werten selbst — diese sollten auf CSS-Variablen zeigen, damit Theme-Wechsel greifen. Kurzfristig vertretbar wenn das ThemeContext-Feature noch nicht vollständig ausgebaut ist.

### B-NEU-3: StudentDashboard.tsx fg '#9A6B00' — OFFEN
**Status: OFFEN**

`src/pages/student/StudentDashboard.tsx` Zeile 305: `fg: '#9A6B00'` in der `QUICK_TILES`-Konstante. Muss `'var(--color-accent-on)'` werden (Token existiert: `--color-accent-on: #4A2E00`). Hinweis: der aktuell hardcodierte Wert `#9A6B00` ist nicht derselbe Wert wie `--color-accent-on` (`#4A2E00`), daher erst prüfen ob `--color-accent-on` die korrekte Wahl ist oder ob ein neuer Token `--xp-gold-on` ergänzt werden sollte.

### B-NEU-4: TaskWidgetDemo.tsx color="#7c3aed" — OFFEN
**Status: OFFEN**

`src/pages/student/TaskWidgetDemo.tsx` Zeile 155: `color="#7c3aed"` als JSX-Prop. Diese Demo-Page ist nicht produktionsseitig (kein ProtectedRoute für bestimmte Rollen), aber das Muster sollte trotzdem auf `color="var(--color-moment-repair)"` umgestellt werden.

### B-NEU-5: AdminDashboard.tsx + CoachDashboard.tsx boxShadow-Konstanten — OFFEN
**Status: OFFEN**

- `src/pages/admin/AdminDashboard.tsx` Zeile 20: `SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'` → wird als `style={{ boxShadow: SHADOW_CARD }}` verwendet (Zeilen 71, 183)
- `src/pages/coach/CoachDashboard.tsx` Zeilen 25–26: `SHADOW_CARD = '0 1px 6px 0 rgba(0,0,0,0.07)'` und `SHADOW_ACTIVE = '0 2px 12px 0 rgba(15,110,86,0.10)'` → verwendet (Zeilen 82, 110)

Statische `boxShadow` in Inline-Styles sind laut CLAUDE.md §11 verboten. Muss auf `shadow-premium-md`, `shadow-premium-sm` oder einen neuen benannten Shadow-Token aus `tokens.css` umgestellt werden.

---

## Neue Findings

### N1: Undefinierte CSS-Variablen `--card`, `--muted`, `--success-dark`

Neben `--primary-dark` (B-NEU-1) gibt es weitere undefinierte Variablen:

**`--card`** (nicht definiert, sollte `--surface` sein) — verwendet an 11 Stellen:
- `src/pages/coach/IntakePage.tsx:22, 191, 252, 283`
- `src/pages/admin/LeadsPage.tsx:143, 164, 185, 223`
- `src/pages/admin/TiersPage.tsx:143`
- `src/pages/admin/DiagnosticsPage.tsx:31, 189, 198`
- `src/components/edvance/onboarding/SubjectsStep.tsx:35`
- `src/components/edvance/onboarding/TierStep.tsx:42`
- `src/components/edvance/onboarding/CoachStep.tsx:34`
- `src/components/edvance/onboarding/SummaryStep.tsx:36`

**`--muted`** (nicht definiert, sollte `--border` oder `--text-muted` sein je nach Kontext) — verwendet an 3 Stellen:
- `src/components/edvance/onboarding/SummaryStep.tsx:6` (in color-mix als Hintergrund)
- `src/components/edvance/onboarding/StepIndicator.tsx:16, 32` (als Textfarbe)

**`--success-dark`** (nicht definiert) — verwendet an 4 Stellen:
- `src/pages/DiagnosisSession.tsx:235`
- `src/pages/DiagnosisResult.tsx:239, 313, 661`

Alle drei sind **P0**: CSS-Variables mit undefined-Wert fallen auf `initial` zurück (Browser ignoriert die Deklaration stille). Das führt zu unsichtbaren oder falsch gefärbten Elementen in Diagnose-Flows und Onboarding.

Korrekturoption für alle drei: In `globals.css` als Aliases hinzufügen:
```css
--card: var(--surface);
--muted: var(--border);
--success-dark: color-mix(in srgb, var(--success) 70%, black);
```

### N2: ThemePanel.tsx — Inline-Style mit dynamischen Hex-Werten

`src/components/edvance/ThemePanel.tsx` Zeile 48: `style={{ background: \`linear-gradient(..., ${colors.light} 0%, ${colors.primary} 50%, ${colors.dark} 100%)\` }}` — die Farb-Strings stammen aus `THEME_PREVIEW` in `ThemeContext.tsx`, das seinerseits Hex-Codes (`#2D6A9F` etc.) enthält. Technisch ein dynamischer Wert (ThemeContext-abhängig), daher `style={{}}` vertretbar. Der eigentliche Verstoß liegt in `ThemeContext.tsx` Zeilen 8–11 mit hardcodierten Hex-Farben für `THEME_PREVIEW`. Da diese Preview-Farben aus gestalterischen Gründen fix sein müssen (sie sind die Vorschau, nicht der aktive Token), ist das tolerierbar als Ausnahme — sollte aber dokumentiert sein.

### N3: Dateigrößen über 400 Zeilen

Sieben Dateien überschreiten das 400-Zeilen-Limit:

| Datei | Zeilen |
|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 |
| `src/pages/DiagnosisSession.tsx` | 764 |
| `src/components/edvance/index.tsx` | 559 |
| `src/pages/DesignShowcase.tsx` | 478 |
| `src/types/index.ts` | 461 |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 |
| `src/pages/student/StudentDashboard.tsx` | 419 |

`DiagnosisResult.tsx` (946 Zeilen) und `DiagnosisSession.tsx` (764 Zeilen) sind besonders kritisch. Refactoring-Empfehlung: je eine eigene `components/diagnosis/`-Datei für Chart-Abschnitt, Skill-Cluster-Karte und Header-Block.

`src/components/edvance/index.tsx` (559 Zeilen) enthält alle Edvance-Primitives in einer Datei — Aufteilen nach Typ (Badge, Card, Charts, Gamification, Navigation) empfohlen.

### N4: DiagnosisResult.tsx — Inline-Styles mit 'white' und color-mix

Neue Kategorie die über bekannte Blocker hinausgeht:

- Zeile 661: `color: 'var(--success-dark)'` — undefinierte Variable (siehe N1)
- Zeile 846: `color-mix(in srgb, var(--primary-dark) 4%, white)` — `--primary-dark` undefiniert (B-NEU-1) und `white` als Keyword

---

## Warnungen

- `src/components/edvance/tasks/TaskPedagogyAccordion.tsx` Zeilen 35, 39–40, 46–48: Inline-Styles mit CSS-Variablen (`a.bg`, `a.text`) — diese sind dynamisch kalkuliert aus dem `ACCENT_STYLES`-Record, der ausschließlich CSS-Variablen enthält. Technisch vertretbar, aber Tailwind-Arbitrary-Value-Syntax wäre bevorzugt.

- `src/components/edvance/tasks/MCWidget.tsx` Zeile 28: Tailwind-Klasse mit inline `color-mix(in_srgb,var(--primary)_8%,white)` — das `white`-Keyword in der Tailwind-Utility ist ein Grenzfall (kein Inline-Style, aber hardcodiertes Farbwort). Akzeptabel vorerst.

- `src/pages/Login.tsx` Zeilen 49, 54: `style={{ background: 'var(--color-moment-gold)' }}` und `style={{ background: 'var(--color-primary-light)' }}` — CSS-Variablen, kein Verstoß, aber Tailwind-Klassen `bg-[var(--color-moment-gold)]` wären vorzuziehen.

- `src/pages/DiagnosisSession.tsx` enthält zahlreiche Inline-Styles (>15 Fundstellen) mit CSS-Variablen als Werten für `border`-Eigenschaften. Da `border` kein direktes Tailwind-Äquivalent mit CSS-Variablen hat, ist das akzeptabel — aber bei Refactoring prüfen.

- `src/context/ThemeContext.tsx` Zeilen 8–11: Hardcodierte Hex-Farben in `THEME_PREVIEW` — als Design-Preview-Konstante tolerierbar, aber kein Token-Backing vorhanden. Wird durch ThemePanel sichtbar. Dokumentierter Ausnahmefall.

- `src/pages/admin/AdminDashboard.tsx` Zeile 21: `SUCCESS_ICON_BG = 'color-mix(in srgb, var(--success) 15%, transparent)'` — kein Hex, aber als Inline-Style verwendet. Könnte `bg-[color-mix(...)]` Tailwind-Utility werden.

- Onboarding-Komponenten (`StepIndicator`, `SubjectsStep`, `TierStep`, `CoachStep`) nutzen multiple Inline-Styles mit CSS-Variablen. Viele davon sind dynamische Berechnungen (selected state etc.) — technisch vertretbar, aber systematisch prüfen.

---

## Offene P0-Punkte (vor erstem Schüler-Einsatz)

Priorisiert nach Risiko für sichtbare Bugs:

### P0.1 — `--primary-dark` definieren (B-NEU-1)
Betrifft Diagnose-Session-Header, Diagnose-Ergebnis-Page (4 Stellen), Onboarding-StepIndicator, Onboarding-CoachStep. Alle Gradienten sehen ohne diesen Token falsch aus.

**Fix**: In `src/styles/globals.css` nach `--primary-shadow: #1a4a73`:
```css
--primary-dark: var(--primary-shadow);
```

### P0.2 — `--card`, `--muted`, `--success-dark` definieren (N1)
Betrifft Onboarding-Flow (4 Komponenten), Admin-Forms (IntakePage, LeadsPage, TiersPage, DiagnosticsPage), Diagnose-Ergebnis-Farblogik. Formularfelder ohne `--card` haben keinen korrekten Hintergrund.

**Fix**: In `src/styles/globals.css` ergänzen:
```css
--card: var(--surface);
--muted: var(--border);
--success-dark: color-mix(in srgb, var(--success) 70%, black);
```

### P0.3 — MCWidget.tsx `#fff` ersetzen (B3)
Aktiv-Zustand des Multiple-Choice-Buttons zeigt hardcodierte Farbe.

### P0.4 — DrawCanvas.tsx Hex-Farben ersetzen (B4)
Zeichenbereich mit hardcodierten Farben — visuelle Inkonsistenz bei Theme-Wechsel.

### P0.5 — DiagnosisResult.tsx `'white'`-Literale (B3 erweitert)
3 Zeilen mit `background: 'white'` — zeigen kein Theme-Respekt.

### Nachrangig (P1, kein Schüler-Impact sofort)

- B5: MatchingWidget.tsx TINTS-Palette (4 Hex) ersetzen
- B-NEU-2: AvatarInitials AVATAR_PALETTE (8 Hex) auf CSS-Variablen
- B-NEU-3: StudentDashboard fg `#9A6B00` auf Token
- B-NEU-4: TaskWidgetDemo `color="#7c3aed"` auf Token
- B-NEU-5: AdminDashboard + CoachDashboard `boxShadow`-Konstanten auf Shadow-Utilities
- B1: EdvanceLogo statische Font-Styles (tolerierbarer Sonderfall für SVG-Wordmark, aber bereinigen)
- N3: Dateigrößen > 400 Zeilen (DiagnosisResult, DiagnosisSession, edvance/index)
