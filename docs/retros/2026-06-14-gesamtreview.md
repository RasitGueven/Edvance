# Retro 2026-06-14 — Gesamtreview Codebase-Stand

Branch: `main` (nach Merge PR #16 + #17 + #18)
Letzter Commit: `9b4388f` — Merge pull request #18: Brand-System + Level-Up Farbsystem-Feinschliff
Review-Agent: claude-sonnet-4-6

---

## Überblick: Was gebaut wurde

### Milestone A — Real-Data-Programm (PR #16, merged via #17)

**Datenbank-Migrationen (011–021):**
- RLS-Fixes, `leads`, `intake_sessions`, `screening_tests`, `tiers`, `student_coach`, `sessions`, Gamification-Tabellen, `parent_reports`, Provision-RPC

**Supabase Lib-Layer (`src/lib/supabase/`, 19 Dateien):**
- `auth.ts`, `behavior.ts`, `client.ts`, `intake.ts`, `leads.ts`, `parentReports.ts`, `profiles.ts`, `progress.ts`, `provision.ts`, `screening.ts`, `screeningRatings.ts`, `sessions.ts`, `storage.ts`, `studentCoach.ts`, `students.ts`, `subscriptions.ts`, `taskProgress.ts`, `tasks.ts`, `tiers.ts`

**Edge Function:** `supabase/functions/provision_student`

**Neue Pages:**
- `/admin/leads` — Lead-Verwaltung mit Konvertierungsflow
- `/admin/tiers` — Tier-Verwaltung
- `/admin/diagnostics` — Manuelles Task-Seeding
- `/coach/intake` — Erstgespräch-Flow

**Echtdaten-Anbindung:**
- Coach-Dashboard: echte Sessions aus DB
- Student-Dashboard: XP/Streak aus `student_progress`
- ClusterView: Fortschritt aus DB (localStorage entfernt)
- Parent-Dashboard: echte Kind-Daten
- Screening-Engine: DB-Persistenz, localStorage komplett entfernt
- DiagnosisContext: localStorage-freie Implementierung

### Milestone B — Brand-System + Farbsystem (PR #18)

**Neue Komponenten:**
- `src/components/brand/EdvanceLogo.tsx`: `EdvanceSymbol`, `EdvanceLogo`, `EdvanceAppIcon`
- `src/components/edvance/DashboardTiles.tsx`: Schnellzugriff-Kacheln
- `public/brand/` SVG-Assets (5 Dateien)

**Token-Erweiterungen (`src/styles/tokens.css`):**
- Level-Up Türkis: `--color-levelup`, `--color-moment-levelup`, `--gradient-levelup`, `--shadow-glow-levelup`
- Streak-Repair Lila: `--color-moment-repair`, `--gradient-repair`
- Gold vereinheitlicht: `--color-accent` als Single Source
- Legacy-Aliase: `--xp-gold`, `--level-purple` auf Single Source umgebogen

**DesignShowcase:** Erweitert um Emotionale Momente, Level-Up-Tab, Gamification-Gruppe

---

## TypeScript-Check

Kommando: `npx tsc -p tsconfig.app.json --noEmit`

**Gesamtfehler: 2.277** (via `tsc -b --noEmit` sogar 2.440 wegen `scripts/` und `vite.config.ts`)

**Diagnose:** Die grosse Fehlermasse (>2.100) besteht aus zwei harmlosen, environment-bedingten Fehlerklassen die Vite zur Build-Zeit korrekt auflöst:
- `TS7026` — JSX element implicitly has type 'any' (fehlendes globales `JSX.IntrinsicElements` ohne `@types/react` im TS-Projekt-Root-Scope)
- `TS2307` — Cannot find module 'react' / 'react-router-dom' (Bundler-Resolution, nicht TS-native)
- `TS2503` / `TS2875` — Folge-Fehler der beiden obigen
- `TS7006` / `TS7031` — implicit any für Event-Handler-Parameter (betrifft shadcn/ui-Wrapper und Onboarding)
- `TS2882` — CSS side-effect imports (`katex.min.css`, `globals.css`)

**Echte strukturelle Fehler: 25** (via Filterung auf TS2322/TS7053 ohne die obigen Klassen)

### Strukturelle Fehler nach Datei

| Datei | Fehlertyp | Beschreibung |
|---|---|---|
| `src/components/edvance/ThemePanel.tsx:19` | TS2322 | `ThemeSwatchProps` passt nicht zu `{ key, value, active, onClick }` — `key` ist kein Prop, sondern React-intern |
| `src/components/edvance/tasks/TaskQuestionBlock.tsx:163` | TS2322 | `{ key, letter, index, content }` — `key` darf nicht in Prop-Typen auftauchen |
| `src/components/ui/card.tsx:38` | TS7053 | String-Indexierung in `Record<CardVariant, string>` ohne Typ-Guard |
| `src/lib/render/MathContent.tsx:12` | TS2882 | Side-effect import von `katex/dist/katex.min.css` ohne Typ-Deklaration |
| `src/pages/DesignShowcase.tsx:160,242,273,279` | TS2322 (4x) | `key`-Prop in `EdvanceCardProps` / `MasteryBarProps` — React-key ist kein normales Prop |
| `src/pages/DiagnosisResult.tsx:420,767,790,805` | TS2322 (4x) | `key`-Prop in internen Komponenten-Interfaces |
| `src/pages/admin/DiagnosticsPage.tsx:417` | TS2322 | `key`-Prop in Task-Komponenten-Interface |
| `src/pages/admin/LambacherPreview.tsx:195` | TS2322 | `key`-Prop + `onTaskUpdated` Return-Typ-Mismatch (`any` vs `void`) |
| `src/pages/admin/LeadsPage.tsx:336,341,342` | TS2322, TS7053 (3x) | `key` in `EdvanceCardProps`; Indexierung mit `any` in `Record<LeadStatus>` |
| `src/pages/admin/TiersPage.tsx:177` | TS2322 | `key` in `EdvanceCardProps` |
| `src/pages/coach/CoachDashboard.tsx:302` | TS2322 | `onAttendance` Callback-Signatur: `Promise<void>` vs `void` (async-Leak) |
| `src/pages/coach/IntakePage.tsx:212` | TS2322 | `key` in `EdvanceCardProps` |
| `src/pages/demo/DesignDemo.tsx:107` | TS7053 | String-Indexierung in `Record<TabId>` |
| `src/pages/demo/ScenarioCoach.tsx:52` | TS2322 | `accent`-Wert passt nicht zu `EdvanceCardProps` (erlaubte Werte enger als übergeben) |
| `src/pages/demo/ScenarioSessionEnd.tsx:75` | TS2322 | `variant`-Prop in Badge passt nicht zu `Props` |
| `src/pages/student/TaskPlayer.tsx:177` | TS7053 | Indexierung mit `any` in `Record<ContentType>` |

**Muster:** Das häufigste echte Problem ist das Übergeben von `key` als regulären Prop in Komponenten-Interfaces. `key` ist ein React-reservierter Prop und soll nicht in Prop-Type-Interfaces definiert sein — der Fehler tritt auf weil JSX-Elemente in `.map()` ein `key`-Attribut bekommen das TS als Prop interpretiert wenn der Typ nicht korrekt `Omit<..., 'key'>` oder ohne `key` definiert ist.

---

## CLAUDE.md Regelverifikation

| # | Regel | Status | Befunde |
|---|---|---|---|
| 1 | Kein direkter Supabase-Aufruf in Pages/Komponenten | OK | Alle DB-Calls laufen über `src/lib/supabase/`. Kein einziger direkter `supabase.from()` in Pages oder Components gefunden. |
| 2 | BehaviorSnapshots append-only | OK | `behavior.ts` und `screeningRatings.ts` nur `.insert()`. `screening.ts` macht `.update()` ausschliesslich auf `screening_tests`-Tabelle (Status-Transition), nicht auf `behavior_snapshots`. |
| 3 | Kind-seitiges Richtig/Falsch-Feedback verboten | OK | `TaskPlayer.tsx`, `MCWidget.tsx`, `MatchingWidget.tsx` — kein visueller Richtig/Falsch-Indikator. `MCWidget` zeigt nur Selektion (blau), kein Ergebnis-Feedback. |
| 4 | EmptyState + LoadingPulse in neuen Pages | TEILWEISE | Admin/Coach/Parent-Pages nutzen beide korrekt. `StudentDashboard.tsx`, `TaskPlayer.tsx`, `ClusterView.tsx` nutzen stattdessen einfache `<p>Lade…</p>`-Tags und rohe `<Card>` statt `EmptyState`/`LoadingPulse`. |
| 5 | `.env` in `.gitignore` | OK | `.env` und `.env.local` sind in `.gitignore` eingetragen. Kein `.env` gestaged. |
| 6 | Auth/RLS-Änderungen nur in `src/lib/` | OK | `AuthContext.tsx` und `ProtectedRoute.tsx` unverändert. Alle Auth-Calls in `src/lib/supabase/auth.ts`. |
| 7 | Dateigrösse max. 400 Zeilen | VERLETZT | Mehrere Dateien überschreiten das Limit (siehe Blocker B1–B4). |
| 8 | Keine hardcodierten Farben | VERLETZT | Hex-Werte in mehreren Dateien ausserhalb von `src/index.css` (W2–W4). |
| 9 | Keine statischen Inline-Styles | VERLETZT | `boxShadow`-Inline-Styles in Admin/Coach-Dashboards, `fontFamily` in `EdvanceLogo.tsx` (W1, W4). |

---

## Befundliste

| Prio | ID | Befund | Datei | Status |
|---|---|---|---|---|
| BLOCKER | B1 | 946 Zeilen (Limit: 400) | `src/pages/DiagnosisResult.tsx` | Offen |
| BLOCKER | B2 | 764 Zeilen (Limit: 400) | `src/pages/DiagnosisSession.tsx` | Offen |
| BLOCKER | B3 | 559 Zeilen (Limit: 400) | `src/components/edvance/index.tsx` | Offen |
| BLOCKER | B4 | 461 Zeilen — `types/index.ts` (Limit: 400) | `src/types/index.ts` | Offen |
| BLOCKER | B5 | 427 Zeilen (Limit: 400) | `src/pages/admin/DiagnosticsPage.tsx` | Offen |
| BLOCKER | B6 | 419 Zeilen (Limit: 400) | `src/pages/student/StudentDashboard.tsx` | Offen |
| BLOCKER | B7 | TS2322 async-Leak: `onAttendance` gibt `Promise<void>` zurück, Prop-Typ erwartet `void` | `src/pages/coach/CoachDashboard.tsx:302` | Offen |
| BLOCKER | B8 | `key` als regulärer Prop in Komponenten-Interfaces (25 TS2322-Fehler in 14 Dateien) | Mehrere | Offen |
| WARNUNG | W1 | `fontFamily: "'Space Grotesk', sans-serif"` als Inline-Style (statischer Wert, sollte CSS-Variable/Klasse sein) | `src/components/brand/EdvanceLogo.tsx:138` | Offen |
| WARNUNG | W2 | Hardcodierte COLORS-Konstante: `midnight: '#334D7A'`, `white: '#F7F7F5'`, `black: '#1A1A18'`, `gold: '#E8A020'` — sollten CSS-Variablen referenzieren | `src/components/brand/EdvanceLogo.tsx:18-23` | Offen |
| WARNUNG | W3 | Hardcodierte Hex-Farben in Matching-Paletten: `#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed` | `src/components/edvance/tasks/MatchingWidget.tsx:14-17` | Offen |
| WARNUNG | W4 | `boxShadow` als Inline-Style-Konstante statt `shadow-*`-Utility | `src/pages/admin/AdminDashboard.tsx:20`, `src/pages/coach/CoachDashboard.tsx:25-26` | Offen |
| WARNUNG | W5 | Subject-Toggle-Buttons mit `py-2 text-sm` (~36px Höhe) — unter 44px Minimum | `src/pages/admin/LeadsPage.tsx:218` | Offen |
| WARNUNG | W6 | `console.error` im BehaviorSnapshot-Persist-Pfad — kein Reporting, kein UX-Fallback | `src/pages/student/TaskPlayer.tsx:138` | Offen |
| WARNUNG | W7 | `LoadingPulse`/`EmptyState` nicht genutzt — stattdessen `<p>Lade …</p>` und rohe `<Card>` | `src/pages/student/TaskPlayer.tsx:147-173`, `src/pages/student/ClusterView.tsx:77-105`, `src/pages/student/StudentDashboard.tsx:284-291` | Offen |
| WARNUNG | W8 | Hardcodierter Hex `#9A6B00` in `CLUSTER_TINTS` statt CSS-Variable | `src/pages/student/StudentDashboard.tsx:305` | Offen |
| WARNUNG | W9 | `STROKE_COLOR = '#0F172A'` und `BG_COLOR = '#FFFFFF'` als Konstanten | `src/components/edvance/DrawCanvas.tsx:14,16` | Offen |
| WARNUNG | W10 | Hardcodierte `color="#7c3aed"` als JSX-Prop | `src/pages/student/TaskWidgetDemo.tsx:155` | Offen |
| INFO | I1 | `MCWidget.tsx:37`: `color: active ? '#fff' : 'var(--primary)'` — `#fff` als statischer Wert in Inline-Style | `src/components/edvance/tasks/MCWidget.tsx:37` | Offen |
| INFO | I2 | `ThemeContext.tsx` enthält hardcodierte Hex-Farben für Theme-Palette — ist aber ein Konfigurationskontext, kein Consumer | `src/context/ThemeContext.tsx:8-11` | Akzeptiert (Kontext) |
| INFO | I3 | 8 Farb-Strings in `src/components/edvance/index.tsx:309-310` als Array-Konstante für Cluster-Tints | `src/components/edvance/index.tsx:309-310` | Zu prüfen |
| INFO | I4 | Keine Test-Dateien vorhanden — `src/lib/diagnostic/generator.ts` (395 Zeilen) und `src/lib/supabase/tasks.ts` (342 Zeilen) haben keinen Test-Skeleton | — | Fehlend |

---

## Neue Erkenntnisse

1. **`tsc -b --noEmit` vs. `tsc -p tsconfig.app.json --noEmit`:** Das `package.json`-`lint`-Skript (`tsc -b --noEmit`) schlägt mit 2.440 Fehlern fehl, weil es auch `scripts/seed-taxonomy.ts` und `vite.config.ts` einschliesst, die `@types/node` benötigen (nicht installiert). Diese Fehler sind unabhängig von der App-Qualität. Der apprelevante Check (`tsconfig.app.json`) ergibt 2.277 Fehler, davon ~2.252 environment-bedingt und **25 strukturell**.

2. **`key`-Prop-Anti-Pattern ist flächendeckend:** In mindestens 14 Dateien werden `key`-Props an Komponenten übergeben und deren Prop-Interfaces definieren `key` nicht als Typ. TypeScript meldet TS2322 weil React `key` intern behandelt und es nicht durch den Prop-Typ des Konsumenten laufen darf. Fix: `key` aus Prop-Interface-Typen entfernen und sicherstellen dass Interfaces `Omit<React.HTMLAttributes<...>, 'key'>` nicht nutzen oder `key` aus Interfaces weglassen.

3. **`CoachDashboard.tsx:302` async-Leak ist ein echter Bug:** Die `onAttendance`-Prop ist als `(studentId: string, a: AttendanceStatus) => void` typisiert, aber die tatsächliche Implementierung ist `async` und gibt `Promise<void>` zurück. Das führt dazu, dass Fehler in der async Funktion ungehandelt bleiben (unhandled promise rejection). Fix: Prop-Typ auf `(studentId: string, a: AttendanceStatus) => Promise<void>` ändern oder Fehlerbehandlung in den Aufrufer ziehen.

4. **`DiagnosisResult.tsx` und `DiagnosisSession.tsx` liegen im Page-Root** (`src/pages/`), nicht unter `src/pages/student/` oder `src/pages/coach/`. Mit 946 und 764 Zeilen sind diese die grössten Einzeldateien und gehören dringend refaktoriert.

5. **Screening-Updates sind regelkonform:** `screening.ts` macht `.update()` auf `screening_tests` (Status-Transition: `pending` → `completed`/`aborted`), nicht auf `behavior_snapshots`. Die append-only-Regel für `behavior_snapshots` ist korrekt eingehalten.

6. **`EdvanceLogo.tsx` hat legitime Inline-Styles für dynamische Werte** (Grösse, Gap, flexDirection werden per Prop berechnet), aber `fontFamily` und die COLORS-Konstante sind statisch und verstossen gegen die Regel.

---

## Gesamtbewertung

**ROT** — Deployment-Blocker vorhanden.

**Begründung:**
- `npm run lint` schlägt mit Fehlern fehl (auch environment-bedingte verhindern grünen CI-Status)
- 25 strukturelle TypeScript-Fehler, darunter ein echter async-Fehler in `CoachDashboard.tsx`
- 6 Dateien überschreiten das 400-Zeilen-Limit
- Mehrere CLAUDE.md-Regelverstösse offen (Inline-Styles, Hex-Farben, fehlende `LoadingPulse`/`EmptyState` in Student-Pages)

**Positives:**
- Kein direkter Supabase-Zugriff in Pages/Komponenten — Architektur korrekt
- `behavior_snapshots` konsequent append-only
- Kein kind-seitiges Richtig/Falsch-Feedback
- `.env` korrekt in `.gitignore`
- Auth/ProtectedRoute-Architektur sauber

---

## Empfohlene nächste Schritte (priorisiert)

### Sofort (Blocker)

1. **B8 — `key`-Prop aus allen Komponenten-Interfaces entfernen** (14 Dateien, Pattern-Fix): In `EdvanceCardProps` und anderen Interfaces `key` löschen. TS2322-Fehler in 14 Dateien verschwinden damit automatisch. Ca. 10–15 LOC Änderung.

2. **B7 — `CoachDashboard.tsx:302` async-Leak fixen**: Prop-Typ `onAttendance` auf `Promise<void>` ändern, oder die async-Funktion wrappen. 1–2 LOC.

3. **`npm run lint`-Skript reparieren**: `scripts/seed-taxonomy.ts` braucht `@types/node` (`npm i -D @types/node`) oder eigene tsconfig. `vite.config.ts` ebenfalls. Alternativ: `tsc -p tsconfig.app.json --noEmit` als lint-Skript setzen.

### Kurzfristig (Warnungen)

4. **W4 — `boxShadow` Inline-Styles** in `AdminDashboard.tsx` und `CoachDashboard.tsx` durch `shadow-card` / `shadow-elevation-md` Tailwind-Utilities ersetzen.

5. **W7 — `LoadingPulse`/`EmptyState` in Student-Pages** (`StudentDashboard`, `TaskPlayer`, `ClusterView`): `<p>Lade…</p>` durch `<LoadingPulse />` und rohe `<Card>` durch `<EmptyState />` ersetzen.

6. **W5 — Touch-Target in `LeadsPage.tsx:218`**: `py-2` auf `py-3` oder `min-h-[44px]` ändern.

7. **W3 — Hex-Farben in `MatchingWidget.tsx:14-17`**: Matching-Palette auf CSS-Variablen umstellen (neue Tokens `--color-match-1` bis `--color-match-4` in `tokens.css`).

### Mittelfristig (Dateigrössen)

8. **B1 — `DiagnosisResult.tsx` (946 Zeilen) aufteilen**: Komponenten `DiagnosisItemCard`, `ClusterSummary`, `TaskRunSummary` extrahieren.

9. **B2 — `DiagnosisSession.tsx` (764 Zeilen) aufteilen**: `SessionHeader`, `QuestionNavigator`, `AnswerArea` in eigene Dateien.

10. **B3 — `src/components/edvance/index.tsx` (559 Zeilen) aufteilen**: `StatCard`, `MasteryBar`, `XPBar` in eigene Dateien unter `src/components/edvance/`; `index.tsx` bleibt als Re-Export-Barrel.

11. **W2 — `EdvanceLogo.tsx` COLORS-Konstante**: Auf CSS-Variablen (`var(--color-primary)`, `var(--color-accent)`, etc.) umstellen.

### Tests

12. **Keine Tests vorhanden** — mindestens für `src/lib/diagnostic/generator.ts` und `src/lib/supabase/tasks.ts` (beide >300 Zeilen) Test-Skelette erstellen.

---

## Systemstand

| Bereich | Status |
|---|---|
| Supabase Schema (Migrations 001–021) | Bereit, muss im Supabase-Projekt ausgeführt sein |
| Edge Function `provision_student` | Bereit, muss deployed sein |
| Admin-Pages (`/admin/leads`, `/admin/tiers`, `/admin/diagnostics`) | Implementiert, funktionsfähig |
| Coach-Pages (`/coach/dashboard`, `/coach/intake`) | Implementiert, funktionsfähig |
| Student-Pages (`/student/dashboard`, `/student/cluster/:id`, `/student/task/:id`) | Implementiert, funktionsfähig |
| Parent-Page (`/parent/dashboard`) | Implementiert, funktionsfähig |
| Screening-Flow (`/screening`) | Implementiert, DB-persistent |
| Diagnosis-Flow (`/diagnosis`, `/diagnosis/session`, `/diagnosis/result`) | Implementiert, Mock-frei |
| Brand-System (`EdvanceLogo`, Tokens, DashboardTiles) | Fertig, in `main` gemergt |
| Gamification-Daten (XP, Streak, Level) | Schema bereit; Daten-Seeding für Dev-Umgebung noch ausstehend |
| Lambacher-Import (`/admin/lambacher`) | Implementiert; reales PDF-Parsing nicht getestet |
| DesignShowcase (`/showcase`) | Aktuell, alle neuen Tokens dokumentiert |
