# Retro 2026-05-27 — Review Gesamtstand

Branch: `claude/sweet-ramanujan-cQrKc` (identisch mit `main`/`dev`).
TypeScript: **✅ Exit-Code 0, 0 Fehler.**

---

## Supabase-Disziplin ✅

Kein direkter `supabase.from(` oder `supabase.auth.`-Aufruf in `src/pages/` oder `src/components/`. Alle Seiten importieren ausschließlich über `src/lib/supabase/`. Kein `createClient`-Aufruf außerhalb von `src/lib/`.

## Append-Only-Sicherheit ✅

`behavior_snapshots`, `xp_events`, `screening_ratings` — kein `.update(` oder `.delete(` in den zugehörigen Lib-Dateien (`behavior.ts`, `progress.ts`, `screeningRatings.ts`). Append-only-Invariante eingehalten.

Sonstige `.update(`-Aufrufe betreffen ausschließlich zulässige Tabellen: `leads`, `sessions`, `parent_reports`, `screening` (Status-Flag), `intake`, `tasks`, `subscriptions`, `tiers`.

## Auth / RLS ✅

- `ProtectedRoute` deckt alle produktiven Routen ab: `/student/*`, `/coach/*`, `/parent/*`, `/admin/*`, `/screening/*`.
- Absichtlich ungeschützt (Coach-Tablet-Ansicht): `/diagnosis`, `/diagnosis/result` — im Code kommentiert.
- Demo-Routen `/showcase`, `/demo/widgets`, `/demo/design` — ebenfalls ohne Auth, vor Production-Launch prüfen.
- `service_role`-Key nicht im Frontend-Bundle.
- `.env` in `.gitignore` eingetragen.

---

## Blocker 🔴

### B1 — Dateigröße kritisch: DiagnosisResult.tsx (946 Zeilen) + DiagnosisSession.tsx (764 Zeilen)

Beide sind weit über dem Hard-Limit von 400 Zeilen. Bestehende P0-Punkte seit mehreren Reviews unverändert — sind stattdessen weiter gewachsen.

- `src/pages/DiagnosisResult.tsx` — **946 Zeilen** (+546 über Limit)
- `src/pages/DiagnosisSession.tsx` — **764 Zeilen** (+364 über Limit)

**Maßnahme:** Aufteilen in Sub-Komponenten-Dateien. Konkrete Kandidaten: `DiagnosisHero`, `DiagnosisResultCard`, `DiagnosisSkillSummary` (Result) sowie `DiagnosisTaskView`, `DiagnosisProgress` (Session).

### B2 — Statische Inline-Styles in EdvanceLogo.tsx

`src/components/brand/EdvanceLogo.tsx` — seit Review 2026-05-25 als Blocker markiert, noch nicht adressiert:

- Z.115: `flexShrink: 0` → `shrink-0`
- Z.137–145: Wordmark-`<span>` mit `fontFamily`, `fontWeight`, `fontSize`, `letterSpacing`, `color`, `lineHeight`, `userSelect` als Inline-Style-Block → Tailwind-Klassen + `font-wordmark`-Token
- Z.154–155: `EdvanceAppIcon` mit `display: 'inline-flex'`, `alignItems: 'center'` → `inline-flex items-center`

### B3 — boxShadow-Anti-Pattern in AdminDashboard.tsx + CoachDashboard.tsx

Explizit verbotenes Muster laut CLAUDE.md §11: "Statische `boxShadow` in Inline-Styles verboten — `shadow-*` Utilities nutzen."

- `src/pages/admin/AdminDashboard.tsx` Z.20, 71, 183 — `SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'` → `shadow-card` / `shadow-elevation-md`
- `src/pages/coach/CoachDashboard.tsx` Z.25–26, 82, 110 — `SHADOW_CARD`/`SHADOW_ACTIVE` als bedingter `boxShadow` → `cn('shadow-card', session.status === 'active' && 'shadow-elevation-md')`

### B4 — Hardcodierte Hex-Farben in Task-Widgets

- `src/components/edvance/DrawCanvas.tsx` Z.14, 16 — `STROKE_COLOR = '#0F172A'`, `BG_COLOR = '#FFFFFF'` (Canvas-API-Ausnahme: technisch begründet, aber dokumentationspflichtig)
- `src/components/edvance/tasks/MCWidget.tsx` Z.37 — `color: active ? '#fff' : 'var(--primary)'` → `'#fff'` ersetzen durch `'var(--text-inverse)'`
- `src/pages/DiagnosisResult.tsx` Z.634, 638, 645 — `style={{ background: 'white' }}` → `className="bg-white"`
- `src/components/edvance/tasks/TaskQuestionBlock.tsx` Z.57, 119 — `color: 'white'` → `var(--text-inverse)`

---

## Warnungen ⚠️

### W1 — Weitere Dateien über 400-Zeilen-Limit

| Datei | Zeilen | Überschreitung |
|---|---|---|
| `src/components/edvance/index.tsx` | 559 | +159 |
| `src/pages/DesignShowcase.tsx` | 478 | +78 |
| `src/types/index.ts` | 461 | +61 |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | +27 (seit mehreren Reviews unverändert) |
| `src/pages/student/StudentDashboard.tsx` | 419 | +19 |

Empfehlung für `edvance/index.tsx`: `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials` sind eigenständig extrahierbar.

### W2 — Semantische Farb-Paletten als Hex außerhalb von tokens.css

- `src/components/edvance/index.tsx` Z.309–310 — `AVATAR_PALETTE` (8 Hex-Werte)
- `src/components/edvance/tasks/MatchingWidget.tsx` Z.14–17 — `TINTS` (4 Hex-Werte)
- `src/context/ThemeContext.tsx` Z.8–11 — Palette-Hex für Laufzeit-Theme
- `src/pages/student/StudentDashboard.tsx` Z.305 — `#9A6B00` in `CLUSTER_TINTS`
- `src/pages/student/TaskWidgetDemo.tsx` Z.155 — `color="#7c3aed"` als JSX-Prop

Alle diese Werte sollten in `src/styles/tokens.css` als CSS-Variablen definiert und nur dort referenziert werden.

### W3 — EdvanceLogo.tsx SVG-COLORS-Konstante

Z.19–22: `#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020` als Konstanten für SVG-Path-Attribute. SVG-Attribute akzeptieren keine CSS-Variablen direkt — technische Ausnahme begründet, aber die Werte sollten aus `tokens.css`-Exporten (JavaScript-seitig) bezogen werden, nicht als eigenständige Konstanten.

### W4 — color-mix(in srgb, ..., white)-Muster

`index.tsx:272`, `DiagnosisResult.tsx:661, 645` — `white` als hardcodierter Token in `color-mix()`-Funktionen. Im Dark-Mode wäre `var(--color-surface)` oder `var(--background)` korrekt.

### W5 — Demo-/Showcase-Routen ohne Auth

`/showcase`, `/demo/widgets`, `/demo/design` sind vor Production-Launch entweder hinter `ProtectedRoute` zu stellen oder vollständig zu entfernen.

---

## Offene P0-Punkte aus früheren Reviews (Status-Update)

| Punkt | Seit | Status |
|---|---|---|
| `DiagnosticsPage.tsx` 427 Zeilen | 2026-05-18 | **OFFEN — unveränderter Stand** |
| `EdvanceLogo.tsx` Inline-Styles | 2026-05-20 | **OFFEN — unveränderter Stand** |
| `edvance/index.tsx` 559 Zeilen | 2026-05-19 | **OFFEN — unveränderter Stand** |
| `DiagnosisSession.tsx` Dateigröße | 2026-05-19 | **OFFEN — auf 764 Zeilen gewachsen** |
| `DiagnosisResult.tsx` Dateigröße | 2026-05-19 | **OFFEN — auf 946 Zeilen gewachsen** |
| `AdminDashboard.tsx` boxShadow-Inline | 2026-05-19 | **OFFEN** |
| `CoachDashboard.tsx` boxShadow-Inline | 2026-05-19 | **OFFEN** |
| Diagnostik-Content-Seeding (`is_diagnostic=true`) | 2026-05-17 | **OFFEN — P0 vor erstem Schüler-Einsatz** |
| Browser-Verifikation U4 + Screening-DB-Resume | 2026-05-22 | **OFFEN** |

---

## Empfohlene Prioritäten

### P0 — vor erstem Schüler-Einsatz
1. 🔴 Diagnostik-Content-Seeding (`tasks.is_diagnostic=true`) → `/screening`-Flow end-to-end nutzbar
2. 🔴 Browser-Verifikation U4 (`provisionStudent()`) + `/screening`-DB-Resume durch Rasit

### P1 — vor nächstem Feature-Start
3. 🔴 `DiagnosisResult.tsx` + `DiagnosisSession.tsx` auf Sub-Komponenten aufteilen (Blocker B1)
4. 🔴 `EdvanceLogo.tsx` Inline-Styles → Tailwind (Blocker B2, seit 2 Reviews offen)
5. 🔴 `AdminDashboard.tsx` + `CoachDashboard.tsx` `boxShadow` → `shadow-*` Utilities (Blocker B3)

### P2 — zeitnah
6. 🟡 `MCWidget.tsx`, `TaskQuestionBlock.tsx`, `DiagnosisResult.tsx` Hex/`white`-Strings → CSS-Variablen (Blocker B4)
7. 🟡 `edvance/index.tsx` aufteilen (Warnung W1)
8. 🟡 `AVATAR_PALETTE` + `MatchingWidget TINTS` → `tokens.css`-Variablen (Warnung W2)
9. 🟡 Lambacher-Bulk-Import via Chrome-Plugin (15–25 Aufgaben)
10. 🟡 WCAG-AA-Prüfung Türkis/Repair unter `/showcase` + `/demo/design`
