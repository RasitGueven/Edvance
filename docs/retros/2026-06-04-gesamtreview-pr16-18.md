# Retro 2026-06-04 — Gesamtreview PR #16–18

Erstellt durch Review-Session `claude/sweet-ramanujan-Brchp`.
Abgedeckte Branches: `feature/real-data-program` (PR #16+17), `feature/levelup-tuerkis` (PR #18).

---

## 1. Was gebaut wurde

### PR #16 + #17 — Real-Data-Programm

Vollständige Mock-Entfernung und DB-Anbindung aller produktionsrelevanten Flows.

| Unit | Was passiert ist |
|---|---|
| U4 | Onboarding: Lead → Student via `provisionStudent()` (Edge Function, service-role, atomar) |
| U5c-1 | Screening DB-Persistenz + `/screening`-Route + DB-Resume (`screening.ts`, `DiagnosisContext`) |
| U5c-2 | `localStorage` vollständig aus `DiagnosisContext` entfernt — nur noch `ThemeContext` (gewollt) |
| U7 | CoachDashboard: `MOCK_SESSIONS` raus, echte Sessions via `sessions.ts` |
| U8 | ClusterView: Fortschritt aus `student_task_progress` statt localStorage |
| U9 | StudentDashboard: XP + Streak aus `student_progress` |
| U10 | ParentDashboard: echte Kind-Daten via `parentReports.ts` |
| Admin | `/admin/diagnostics` — Oberfläche zum manuellen Seeden von Diagnose-Tasks |
| Tiles | Schnellzugriff-Kacheln für alle drei Dashboards (Schüler/Coach/Eltern) |

**Schema-Migrationen (011–021):**
- 011: RLS-Fix
- 012–013: `leads`, `intake_sessions`
- 014: `screening_tests`, `screening_ratings`
- 015–017: `tiers`, `subscriptions`, `student_coach`, `coaching_sessions`
- 018–020: `student_task_progress`, `student_progress`, `xp_events`, `parent_reports`
- 021: `app_provision_student` (SECURITY DEFINER RPC)

**Lib-Layer (`src/lib/supabase/`):** 16 Module, alle mit `SupabaseResult<T>` + try/catch.

---

### PR #18 — Brand-System + Level-Up Farbsystem

#### P1 — Tokens (`src/styles/tokens.css`, `globals.css`)

Neue Tokens für emotionale Momente:

| Token | Wert | Verwendung |
|---|---|---|
| `--color-levelup` | `#0E9E96` | UI/Badge — ruhige Türkis-Variante |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | Text-On-Color (WCAG AA) |
| `--gradient-levelup` | `#1FD3C6 → #0B8B85` | Celebration-Gradient |
| `--shadow-glow-levelup` | `0 0 44px rgba(25,201,188,0.36)` | Glow-Effekt auf Navy |
| `--color-moment-repair` | `#8B5CF6` | Streak-Repair „Power-up" Lila |
| `--color-moment-repair-on` | `#FFFFFF` | Text-On für Repair-Lila |
| `--gradient-repair` | `#A78BFA → #7C3AED` | Repair-Gradient |
| `--color-accent-light` | `#FBEAD0` | Badge-BG für Accent/XP |

Legacy-Aliase auf Single Source umgebogen (keine eigenen Hex-Werte mehr):
- `--xp-gold` → `var(--color-accent)`
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

#### P2 — Consumer-Komponenten

- **`EdvanceBadge`**: neue Varianten `levelup` (Türkis) + `repair` (Lila)
- **`ToastBanner`**: neuer Typ `levelup` mit `⬆️`-Icon, Klasse `.toast-levelup`
- **`ScenarioCelebration`**: Level-Badge nutzt `--gradient-levelup` + `--shadow-glow-levelup` auf Navy

#### P3 — Brand-System (`src/components/brand/EdvanceLogo.tsx`)

Neue Datei mit drei React-Komponenten:

| Komponente | Verwendung | Skalierung |
|---|---|---|
| `EdvanceSymbol` | J-Kurve allein (Hairline + Dot + Gold-Pfeil) | `size` Prop (px) |
| `EdvanceLogo` | Symbol + Wordmark nebeneinander | `size` = Schriftgröße, Symbol proportional |
| `EdvanceAppIcon` | Gerundetes Quadrat für App-Icon / Avatar / Badge | `size`, `borderRadius` autoberechnet |

SVG-Pfade als JS-Konstanten in `PATHS`:
- `spine`: Hairline J-Kurve (viewBox 0 0 100 100)
- `arrow`: Pfeilspitze am Endpunkt
- `calligraphic`: Kalligraphisch gefüllt (für App-Icon)

Eingebunden in: `EdvanceNavbar` (ersetzte „E"-Box), `Login.tsx` (ersetzte „E"-Box).

**SVG-Assets in `public/brand/`:**
- `edvance-app-icon.svg`
- `edvance-favicon.svg`
- `edvance-logo-dark.svg`
- `edvance-logo-light.svg`
- `edvance-symbol.svg`

**`index.html`**: Space Grotesk via Google Fonts eingebunden (→ für Produktion lokal migrieren).

#### DesignShowcase

Neue Gruppe „Emotionale Momente" mit allen Moment-Farben (Level-Up, Moment-Levelup, Repair, Boss-Grün, Streak-Rot, Moment-Bühne) + Gamification-Gruppe zeigt vereinheitlichtes Gold.

---

## 2. Befunde aus dem Code-Review

`npx tsc --noEmit` — **Exit Code 0, kein Fehler.** Codebase vollständig typsicher.

### Blocker (vor nächstem Touch beheben)

**B1 — `src/components/brand/EdvanceLogo.tsx:18–23`**: Hardcodierte Hex-Farben im `COLORS`-Objekt
```ts
// JETZT
const COLORS = { midnight: '#334D7A', white: '#F7F7F5', black: '#1A1A18', gold: '#E8A020' }
// SOLL
Default-Props auf var(--color-primary) / var(--color-bg-app) / var(--color-accent) umstellen
```

**B2 — `src/components/brand/EdvanceLogo.tsx`**: Statische Inline-Styles (Z. 115, 137–148, 154–160, 201–212)
`display: 'inline-flex'`, `alignItems: 'center'`, `flexShrink: 0`, `userSelect: 'none'`, `lineHeight: 1` — alles statisch, muss Tailwind-Klassen werden. Dynamische Werte (`size`-abgeleitete `fontSize`, `width`, `height`, `gap`) dürfen Inline bleiben.

**B3 — `src/pages/admin/AdminDashboard.tsx` + `src/pages/coach/CoachDashboard.tsx`**: Rohes shadcn `Card` + Inline-`boxShadow`
Beide Dateien definieren `SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'` und wenden es als `style={{ boxShadow: SHADOW_CARD }}` an. CLAUDE.md: „Nie rohe `div` für Cards — immer `EdvanceCard`" + „Statische `boxShadow` in Inline-Styles verboten."
→ Migration auf `EdvanceCard` mit `shadow-premium-sm`/`shadow-premium-md`; `SHADOW_ACTIVE` (dynamisch nach Session-Status) → `shadow-glow-primary` via Tailwind conditional.

**B4 — `src/pages/admin/AdminDashboard.tsx`**: Kein `LoadingPulse` und kein `EmptyState` vorhanden
Seite lädt Coaches + Tiers asynchron, hat aber weder Lade- noch Leer-Zustand-Behandlung auf Top-Level. CLAUDE.md: `LoadingPulse` und `EmptyState` sind Pflicht.

**B5 — `src/pages/admin/DiagnosticsPage.tsx`**: 427 Zeilen (Limit: 400)
`NewTaskForm` (Z. 40–212) + `TaskRow` (Z. 213–307) in `src/components/edvance/admin/` auslagern.

### ⚠️ Kritischer Konflikt — Token vs. v2-Spec

**PR #18 gemergt am 17.05.2026. Notion v2-Design-System-Entscheidung: 27.05.2026 — danach.**

Die v2-Spec sagt explizit:
> „Türkis als Level-Up-Identität (`#0E9E96` / `#19C9BC`) — **ersatzlos gestrichen**. Level-Up ist Navy-BG + Champagner-Krone + Altgold-XP."

Betroffene Stellen im Code:
- `src/styles/tokens.css:54–56` — `--color-levelup`, `--color-moment-levelup`, `--color-levelup-on`
- `src/styles/globals.css:72,85,165,233–237` — `--gradient-levelup`, `--shadow-glow-levelup`, `.bg-gradient-levelup`, `.toast-levelup`
- `src/components/edvance/index.tsx:96–99` — `EdvanceBadge variant="levelup"` auf Türkis-Token

**Konsequenz**: Alle Türkis-Level-Up-Tokens werden durch `feature/v2-migration` überschrieben. Keine weiteren Consumer bauen bis Migration läuft. Level-Up-Celebration-Screens nicht in Produktion shippen.

### Warnungen

**W1 — `src/pages/admin/DiagnosticsPage.tsx`** (Überschneidung mit B5, separater Aspekt): Bekannter Notion-Backlog-Eintrag.

**W2 — `src/pages/DiagnosisResult.tsx` (946 Z.) + `src/pages/DiagnosisSession.tsx` (764 Z.)**
Pre-existing Tech-Debt, nicht durch PR #16–18 eingeführt. Eigene Refactor-Session nötig.

**W3 — `src/components/edvance/tasks/MatchingWidget.tsx:14–17`**: Hardcodierte Hex-Farben im Farbpaletten-Array
`#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed` — CSS-Variable-Äquivalente vorhanden (`--primary`, `--success`, `--warning`, `--level-purple`). Die `color-mix`-Ausdrücke sollten auf Variablen referenzieren.

**W4 — `src/components/edvance/index.tsx:309–310`**: `AvatarInitials` `AVATAR_PALETTE`
8-Farben-Array für algorithmische Avatar-Zuweisung. Tolerierbar (keine Named-Token-Äquivalente für Hash-indexierte Palette), aber Abweichung von der Regel dokumentiert.

**W5 — `src/pages/student/StudentDashboard.tsx:305`**: `#9A6B00` hardcodiert
`fg: '#9A6B00'` statt `var(--color-accent-on)` oder `var(--color-text-secondary)`.

**W6 — `src/components/edvance/DrawCanvas.tsx:14–16`**: `STROKE_COLOR = '#0F172A'`, `BG_COLOR = '#FFFFFF'`
Canvas-Zeichenprimitive. Bei Compile-Time-Konstanten muss der Wert mit dem Token übereinstimmen (`--color-text-primary`, `--color-bg-surface`). Für dynamische Auflösung: `getComputedStyle`.

**W7 — `src/pages/student/StudentDashboard.tsx`**: Cluster-Loading und Leer-Zustand ohne `LoadingPulse`/`EmptyState`
`<p className="text-sm text-muted">Lade Themen …</p>` statt `<LoadingPulse>` + rohes shadcn `Card` statt `<EmptyState>`.

**W8 — `src/pages/student/StudentDashboard.tsx`**: Touch-Targets unter 44px
- Z. 250–256: „Filter zurücksetzen"-Button — kein `min-h`-Class, ca. 20px gerendert. → `min-h-[44px] px-3` oder `<Button variant="ghost" size="sm">`.
- Z. 232: Suche-Clear-Button nur `p-1` (ca. 24px). → `p-2.5` / `w-11 h-11`.

**W9 — Space Grotesk via Google Fonts** (`index.html:8–12`) — DSGVO + Performance. Vor Launch: WOFF2 nach `public/fonts/`, `@font-face` in `globals.css`, Google-Fonts-Link entfernen.

**W10 — `src/pages/admin/LeadsPage.tsx:219–224`**: Boolean-Toggle via Inline-Style statt Tailwind-Conditional
`borderColor`/`background` auf aktiven/inaktiven Zustand — als Tailwind conditional class lösbar (niedriger Priorität).

### Grün ✓

- `npx tsc --noEmit` — Exit Code 0, keine Fehler
- `.env` in `.gitignore` (Z. 7–8), nicht committet; nur `VITE_SUPABASE_ANON_KEY` im Frontend
- `behavior_snapshots` append-only — nur `.insert()` in `behavior.ts`, kein `UPDATE`/`DELETE`
- Supabase vollständig in `src/lib/` gekapselt — kein direkter Call in Pages/Komponenten
- `EdvanceBadge` `levelup`/`repair`-Varianten nutzen korrekt CSS-Variablen (kein Hex)
- `ToastBanner` `levelup` via CSS-Klasse `.toast-levelup` mit `var(--gradient-levelup)` — korrekt
- RLS auf allen Tabellen (011–021) vorhanden
- Auth-geschützte Routen ausschließlich via `ProtectedRoute`
- `EdvanceNavbar` clean: nur Tailwind + CSS-Variablen, `EdvanceLogo` korrekt eingebunden
- `globals.css` (356 Z.) + `tokens.css` (89 Z.) im Limit; `@theme inline`-Block mappt alle neuen Tokens korrekt
- SVG-Brand-Assets bestätigt in `public/brand/` (5 Dateien)

### Grün ✓

- TypeScript: `npx tsc --noEmit` — kein Fehler (Stand PR #18).
- `behavior_snapshots` append-only eingehalten — nur `INSERT`/`SELECT`, kein `UPDATE`/`DELETE`.
- Supabase vollständig in `src/lib/` gekapselt — keine direkten Calls in Pages oder Komponenten.
- `.env` in `.gitignore`, nicht committet.
- RLS auf allen neuen Tabellen (011–021) vorhanden.
- Auth-geschützte Routen ausschließlich via `ProtectedRoute`.

---

## 3. Moment-Mapping (aktueller Stand `tokens.css`)

| Moment | Token (aktuell) | Farbe | v2-Status |
|---|---|---|---|
| Alltags-XP / Badges | `--color-accent` (`--xp-gold`) | Gold `#E8A020` | ✓ bleibt (`--color-accent-streak`) |
| Level-Up Badge | `--color-levelup` | Türkis `#0E9E96` | ⚠️ v2: Navy+Gold stattdessen |
| Level-Up Bühne | `--color-moment-levelup` | Türkis `#19C9BC` | ⚠️ v2: Navy-BG + Champagner |
| Task-/Boss-Erfolg | `--color-moment-green` | Grün `#1DB954` | ✓ bleibt |
| Streak-Verlust | `--color-moment-red` | Rot `#E03535` | ✓ bleibt (`--color-error-streak`) |
| Streak-Repair | `--color-moment-repair` | Lila `#8B5CF6` | ⚠️ v2: `#7B5EA7` (präzisiert) |

---

## 4. Offene Punkte (priorisiert)

### P0 — Blockiert aktiven Betrieb
1. **Diagnostik-Content seeden** (`tasks.is_diagnostic=true`): Ohne Inhalt zeigt `/screening` EmptyState. `/admin/diagnostics` ist bereit.
2. **Browser-Verifikation durch Rasit**: U4-Conversion-Flow, `/screening` inkl. Resume, alle Dashboards mit Echtdaten.

### P1 — Vor Launch
3. **Design-System v2 Migration** (Big Bang): `CLAUDE_CODE_MIGRATION_PROMPT.md` liegt lokal bei Rasit vor (966 Zeilen, 10 Phasen). Branch: `feature/v2-migration`. Enthält Token-Cutover v1→v2, Komponenten-Update, DB-Migrationen 032–036.
4. **`DiagnosticsPage.tsx` splitten** — beim nächsten Touch (Blocker-Fix).
5. **`EdvanceLogo.tsx`**: Hex-Farben → CSS-Variablen; statische Inline-Styles → Tailwind.
6. **Space Grotesk lokal** — `public/fonts/` (DSGVO + Performance).
7. **WCAG-AA-Audit** Türkis/Repair in `/showcase` — nur in `tokens.css` nachjustieren.

### P2 — Post-MVP
- TaskPlayer Submit-Flow: Widgets rendern, echter Antwort-Submit + XP-Vergabe fehlt noch.
- Mathebuch-Import vollständig befüllen.
- Realtime Cross-Tab-Sync (Schüler-Tablet + Coach).
- Home-Quest-Flow nach Session.
- Dark Mode (Custom Properties bereits vorbereitet).
- Eddy (Lite-KI-Studybuddy).

---

## 5. Nächste Session

1. Diagnostik-Content seeden (→ Rasit führt `/admin/diagnostics` aus).
2. Browser-Verifikation U4 + `/screening` + Dashboards.
3. Design-System v2 Migration starten (`feature/v2-migration`, `CLAUDE_CODE_MIGRATION_PROMPT.md`).
