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

### Blocker (vor nächstem Touch beheben)

1. **`src/components/edvance/admin/DiagnosticsPage.tsx`**: 427 Zeilen (Limit: 400)
   → `NewTaskForm` + `TaskRow` in `src/components/edvance/admin/` auslagern.

2. **`src/components/brand/EdvanceLogo.tsx:18–23`**: Hardcodierte Hex-Farben im `COLORS`-Objekt
   ```ts
   // JETZT
   const COLORS = { midnight: '#334D7A', white: '#F7F7F5', ... }
   // SOLL
   Default-Werte auf var(--color-primary) / var(--color-accent) umstellen
   ```

3. **`src/components/brand/EdvanceLogo.tsx`**: Statische Inline-Styles (Zeilen ~115, 137–148, 154–162, 201–211)
   → `display: 'inline-flex'`, `flexShrink: 0` etc. auf Tailwind-Klassen umstellen.

### ⚠️ Kritischer Konflikt — Token vs. v2-Spec

**PR #18 wurde am 17.05.2026 gemergt. Die Notion v2-Design-System-Entscheidung fiel am 27.05.2026 — danach.**

Die v2-Spec sagt explizit:
> „Türkis als Level-Up-Identität (`#0E9E96` / `#19C9BC`) — **ersatzlos gestrichen**. Level-Up ist Navy-BG + Champagner-Krone + Altgold-XP."

Die aktuellen Tokens in `src/styles/tokens.css` widersprechen dem:
```css
--color-levelup:        #0E9E96;   /* ← durch v2-Spec gestrichen */
--color-moment-levelup: #19C9BC;   /* ← durch v2-Spec gestrichen */
--gradient-levelup:     linear-gradient(135deg, #1FD3C6 0%, #0B8B85 100%); /* ← weg */
--shadow-glow-levelup:  ...;       /* ← weg */
```

**Konsequenz**: Diese Tokens werden durch die Design-System v2 Migration (Branch `feature/v2-migration`) überschrieben. Keine weiteren Consumer daran bauen bis Migration läuft.

### Warnungen

- **Space Grotesk** via Google Fonts (`index.html`) — Performance + Datenschutz (DSGVO). Vor Launch: `public/fonts/` lokal hosten.
- **`src/pages/DiagnosisResult.tsx`**: 946 Zeilen, viele Inline-Styles. Bekannter Tech-Debt — nicht durch diese PRs eingeführt, eigener Cleanup-Ticket nötig.
- **`DashboardTiles.tsx:21`**: `style={{ background: 'color-mix(...)' }}` — tolerierbar, kein Tailwind-Äquivalent.

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
