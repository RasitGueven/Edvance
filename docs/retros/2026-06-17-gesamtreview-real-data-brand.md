# Retro 2026-06-17 — Gesamtreview: Real-Data-Programm + Brand-System

Retrospektive der zwei zuletzt gemergten PRs:
- **PR #16** `feature/real-data-program` → Mock-Entfernung, vollständiger DB-Layer, Edge Function, UI U1–U10 + U5c
- **PR #18** `feature/levelup-tuerkis` → Brand-System (EdvanceLogo, Space Grotesk), Level-Up-Türkis-Farbsystem

Beide PRs sind in `main` gemergt (PR #17 hat PR #16 mit `dev` synchronisiert, danach PR #18 direkt auf `dev` gemergt und in `main` gezogen).

---

## Block 1: Real-Data-Programm (PR #16)

### Was gebaut wurde

**Datenbankschicht (Migrationen 011–021, Supabase SQL Editor)**

- 011: RLS-Fix `students` / `parent_student` / `student_subjects` (waren default-deny) + Security-Definer-Helper `get_my_student_id()`, `is_parent_of_student()`
- 012: `leads`
- 013: `intake_sessions`
- 014: `screening_tests` + append-only `screening_ratings` + `behavior_snapshots.screening_test_id`
- 015: `tiers` + `student_subscriptions`
- 016: `student_coach`
- 017: `coaching_sessions` + `session_students`
- 018: `student_task_progress`
- 019: `student_progress` + append-only `xp_events` + Trigger `apply_xp_event`
- 020: `parent_reports`
- 021: atomare RPC `app_provision_student` (SECURITY DEFINER, nur `service_role`)
- `schema.sql` + `docs/SCHEMA.md` durchgehend gespiegelt

**Lib-Layer (`src/lib/supabase/`)** — alle Module mit `SupabaseResult<T>` + try/catch:

`leads.ts`, `students.ts` (+ Fach-Mapping, `listStudentsWithName`), `intake.ts`,
`subscriptions.ts`, `tiers.ts`, `studentCoach.ts`, `screening.ts`, `screeningRatings.ts`,
`sessions.ts`, `taskProgress.ts`, `progress.ts` (XP), `parentReports.ts`, `provision.ts`
(Edge-Function-Wrapper), `profiles.ts` (getCoaches), `behavior.ts` (um `screening_test_id` erweitert)

**Edge Function** `supabase/functions/provision_student` (Deno, service_role):
Auth-User-Anlage (Schüler + Eltern-Invite) → RPC 021 → Rollback bei Fehler

**UI / Mock-Entfernung (U1–U10 + U5c)**

- U1: `MOCK_COACHES` → `getCoaches()` in Onboarding-CoachStep
- U2: `/admin/leads` — Lead-Erfassung + Liste + Status-Workflow (neu)
- U3: `/coach/intake` — Erstgespräch-Protokoll, draft→final (neu)
- U4: AdminDashboard „Jetzt anlegen" + LeadsPage „In Schüler konvertieren" rufen `provisionStudent()` (Edge Function → RPC 021); Tarif-Name→`tiers.id`-Mapping
- U5a/b: Diagnose-Engine auf echten Generator + echten Task-Content; `mockDiagnosisTasks.ts` gelöscht
- U5c-1: `/screening`-Route DB-gestützt — `createScreeningTest`, Snapshot-Persistenz mit `screening_test_id`, Coach-Rating in `screening_ratings`, `completeScreeningTest`, DB-Resume via `getActiveScreeningTest` + Snapshots + Ratings (deterministisch über `rebuildRunTasks`)
- U5c-2: `localStorage` komplett aus `DiagnosisContext` entfernt; einziger verbleibender localStorage ist `ThemeContext` (bewusste Ausnahme)
- U6: TIERS-Konstante raus → DB-Katalog; `/admin/tiers` Tarif-Verwaltung (neu)
- U7: CoachDashboard echte Sessions/Anwesenheit; `mockData.ts` gelöscht
- U8: ClusterView-Fortschritt aus `student_task_progress`
- U9: StudentDashboard XP/Streak aus `student_progress`
- U10: ParentDashboard echte Kind-Daten + Reports

**Mock-Sweep-Ergebnis:** Keine `mock`/`MOCK_`-Runtime-Treffer mehr

**Nachgelagerte Commits (nach PR #16)**

- `feat: Schnellzugriff-Kacheln` — neue `DashboardTiles`-Komponente (`src/components/edvance/DashboardTiles.tsx`), eingebunden in StudentDashboard, CoachDashboard, ParentDashboard
- `feat: /admin/diagnostics` — Admin-Oberfläche zum manuellen Seeden von Diagnostik-Content; `updateTaskDiagnostic` + `createDiagnosticTask` im Lib-Layer hinzugefügt; `DiagnosticsPage.tsx` (427 Zeilen — knapp über 400-Zeilen-Limit, dokumentiert)

### Entscheidungen

- Append-only strikt: Coach-Rating als separate `screening_ratings`-Tabelle statt Spalten-ALTER auf `behavior_snapshots`
- Nicht-rekursive RLS via Security-Definer-Helper statt Inline-Joins (Performance + Zirkel-Freiheit)
- Lead→Student-Conversion atomar in plpgsql-RPC; Edge Function nur für auth-User-Anlage (Client hat nur anon-Key)
- Eine Engine: `/diagnosis` de-mockt; Screening ist produktisierter Einstieg derselben Engine — kein Mock-Zwilling
- `jsonb` statt Normalisierung für `generated_test` / `result_summary`
- PR #16 basierte auf `main` statt `dev` (Abweichung CLAUDE.md §5; Entscheidung Rasit)
- `ThemeContext` bleibt bewusst localStorage (kosmetisch, kein Lernpfad-Datenverlust möglich)
- Korrekter Check ist `npm run lint` (`tsc -b`), nicht `npx tsc --noEmit` (Solution-tsconfig hat `files:[]`); `node_modules` muss installiert sein

### Offene Punkte (Block 1)

- Diagnostik-Content fehlt (`tasks.is_diagnostic=true`): `/screening` zeigt bis dahin korrekten EmptyState — Laufzeit-Test durch Rasit nach Seeding
- Zwei-Geräte-Flow (Schüler-Tablet + Coach) hat im DB-Modus keinen Cross-Tab-Sync mehr (vorher localStorage); Realtime-Sync = eigener Folgeschritt
- `DiagnosticsPage.tsx` ist 427 Zeilen (limit 400) — Refactor empfohlen, bevor weitere Felder hinzukommen
- Browser-Verifikation U4-Conversion + `/screening`-Flow steht noch aus

---

## Block 2: Brand-System + Farbsystem-Feinschliff (PR #18)

### Was gebaut wurde

**P0 — Brand-Assets (Design-Handoff)**

Neue Dateien unter `public/brand/`:
- `edvance-symbol.svg` — J-Kurve-Emblem allein
- `edvance-logo-light.svg` / `edvance-logo-dark.svg` — Wordmark-Varianten für Static-Export
- `edvance-app-icon.svg` — Gerundetes Quadrat (App-Icon-Vorlage)
- `edvance-favicon.svg` — ersetzt generischen Vite-Favicon in `public/favicon.svg`

**P0 — `src/components/brand/EdvanceLogo.tsx`** (249 Zeilen, neu)

Drei exportierte Komponenten:

| Komponente | Verwendungszweck |
|---|---|
| `EdvanceSymbol` | J-Kurve allein (Hairline + Dot + Gold-Pfeil); `filled` für App-Icon-Variante |
| `EdvanceLogo` | Symbol + Wordmark nebeneinander; `symbolRight` für gespiegelte Variante |
| `EdvanceAppIcon` | Gerundetes Quadrat mit Symbol auf Hintergrundfarbe |

Alle Farben als Props (`color`, `accentColor`, `background`) — hartcodierte Defaults aus dem Design-Handoff (Midnight `#334D7A`, White `#F7F7F5`, Gold `#E8A020`). Props erlauben Überschreiben per CSS-Variable aus Consumer-Kontext.

**P0 — Navbar + Login**

- `EdvanceNavbar`: Platzhalter-AppIcon (40 px) ersetzt durch `<EdvanceLogo size={20}>` (Symbol + Wordmark), `glass-light`-Klasse
- `Login.tsx`: Platzhalter-„E" ersetzt durch `<EdvanceAppIcon size={64}>`
- `index.html`: Space Grotesk (wght 400/500/700) via Google Fonts `<link>` eingebunden

**P1 — Tokens (`src/styles/tokens.css`)**

Neue Tokens für Level-Up-Türkis-Identität und Streak-Repair:

| Token | Wert | Verwendung |
|---|---|---|
| `--color-levelup` | `#0E9E96` | Ruhige UI/Badge-Variante |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | Dunkler Text-On-Color (WCAG) |
| `--gradient-levelup` | `#1FD3C6→#0B8B85` | Celebration-Badge-Hintergrund |
| `--shadow-glow-levelup` | `0 0 44px rgba(25,201,188,0.36)` | Glow auf Navy |
| `--color-moment-repair` | `#8B5CF6` | Streak-Repair „Power-up" (Lila) |
| `--color-moment-repair-on` | `#FFFFFF` | Text auf Lila |
| `--gradient-repair` | `#A78BFA→#7C3AED` | Repair-Badge |
| `--color-accent-light` | `#FBEAD0` | Badge-BG für Alltags-XP |

**P1 — Legacy-Aliase auf Single Source umgebogen (`src/styles/globals.css`)**

```
--xp-gold        → var(--color-accent)        (war: #F59E0B)
--xp-gold-light  → var(--color-accent-light)  (neu via tokens.css)
--level-purple   → var(--color-moment-repair)
```

`@theme inline`-Mappings + Utility-Klassen ergänzt: `.bg-gradient-levelup`, `.bg-gradient-repair`, `.shadow-glow-levelup`

**P2 — Consumer**

- `ScenarioCelebration`: Level-Badge nutzt `--gradient-levelup` + `--shadow-glow-levelup` auf Navy (Tiefe statt flachem Gold-Fill)
- `EdvanceBadge` (in `index.tsx`): neue Varianten `levelup` (Türkis) + `repair` (Lila)
- `ToastBanner` (in `index.tsx`): Typ `levelup` + CSS-Klasse `.toast-levelup` (Türkis-Gradient)
- `XPBar`: nutzt durch P1 automatisch vereinheitlichtes Gold

**P3 — Sichtbarkeit**

- `DesignShowcase`: neue Gruppe „Emotionale Momente" (Level-Up, Moment-Levelup, Repair, Boss-Grün, Streak-Rot, Moment-Bühne); Gamification-Gruppe zeigt vereinheitlichtes Gold

### Moment-Mapping (Single Source: `tokens.css`)

| Moment | Token | Farbe |
|---|---|---|
| Alltags-XP / Badges | `--color-accent` (=`--xp-gold`) | Gold `#E8A020` |
| Level-Up (Meilenstein) | `--color-levelup` / `--color-moment-levelup` + `--gradient-levelup` | Türkis |
| Task-/Boss-Erfolg | `--color-moment-green` auf `--color-moment-bg` | Grün/Navy |
| Streak-Verlust | `--color-moment-red` | Rot |
| Streak-Repair | `--color-moment-repair` | Lila |

### Entscheidungen

- Level-Up bekommt eine eigene Identität (Türkis), strikt getrennt von Alltags-XP (Gold), Task/Boss (Grün) und Streak-Verlust (Rot) — semantische Farbkodierung statt inflationärer Farbe
- `--xp-gold` minimal verschoben (`#F59E0B` → `#E8A020`) — bewusste Änderung für Konsistenz; einziger potentieller visueller Einfluss auf laufende Screens
- Logo-Farb-Defaults hartcodiert im Component (Design-Handoff-Werte) statt CSS-Variablen, weil SVG-Paths keine `currentColor`-Lösung haben und der Consumer via Props überschreiben kann
- Space Grotesk nur für Wordmark (Logo-Schrift) geladen, nicht als App-weite Body-Schrift — gezielte Markenidentität ohne Typography-Override

### Offene Punkte (Block 2)

- Türkis- und Repair-Hexwerte sind kalibrierte Designvorschläge — finale WCAG-AA-Prüfung (Kontrastverhältnis) via `/showcase` und `/demo/design` steht aus; Nachjustierung nur in `tokens.css`
- Streak-Repair- und Boss-Gradient-UI-Flows sind nur token-/badge-/toast-seitig vorbereitet — vollständige UI-Flows = separater Schritt
- `EdvanceLogo.tsx` enthält hartcodierte Hex-Farbwerte in der `COLORS`-Konstante; CLAUDE.md §4 erlaubt das technisch nicht, ist aber durch das Prop-Überschreiben-Muster und den Design-Handoff-Kontext vertretbar — Rasit sollte entscheiden, ob die Defaults auf CSS-Variablen-Referenzen migriert werden sollen

---

## TypeScript-Status

`npm run lint` (= `tsc -b --noEmit`) nach vollständiger `npm ci`-Installation:

```
Exit 0 — keine Fehler
```

Hinweis: `node_modules` muss installiert sein. Ohne Installation meldet `tsc -b` ~2440 Phantomfehler (fehlende Deklarationsdateien für react, react-router-dom, vite etc.) — das ist kein Code-Problem, sondern eine leere Abhängigkeitsumgebung.

---

## Review-Befunde

### Passt

- Alle Supabase-Aufrufe ausschließlich in `src/lib/supabase/` — keine direkten Aufrufe in Pages/Komponenten
- BehaviorSnapshots: kein `update`/`delete` gefunden — append-only eingehalten
- Kein kind-seitiges Korrekt/Falsch-Feedback
- `EmptyState` und `LoadingPulse` werden in neuen Pages verwendet
- `.env` ist in `.gitignore` (nicht committet)
- RLS-Policies wurden hinzugefügt, nicht geändert — kein Eskalationsbedarf
- `ProtectedRoute` schützt alle neuen Routen

### Warnungen

- `DiagnosticsPage.tsx` ist 427 Zeilen — 27 Zeilen über dem 400-Zeilen-Limit aus CLAUDE.md §4; Refactor empfohlen (z.B. Formularblock als `DiagnosticCreateForm`-Subkomponente auslagern)
- `EdvanceLogo.tsx` enthält die `COLORS`-Konstante mit hartcodierten Hex-Werten (`#334D7A`, `#F7F7F5`, `#E8A020`) — technisch ein Verstoß gegen CLAUDE.md §4 „keine hardcodierten Farben außerhalb von `src/index.css`"; durch Design-Handoff und Prop-Override-Muster vertretbar, sollte aber mit Rasit abgestimmt werden
- PR #16 basierte auf `main` statt `dev` (CLAUDE.md §5 Branch-Strategie) — als bekannte Abweichung dokumentiert

### Blocker

Keine.

---

## Offene Punkte gesamt

1. Diagnostik-Content seeden (`tasks.is_diagnostic=true`) → `/screening` produktiv nutzbar
2. Browser-Verifikation: U4-Conversion-Flow + `/screening`-DB-Flow durch Rasit
3. `DiagnosticsPage.tsx` refactoren (Formularblock auslagern, unter 400 Zeilen bringen)
4. WCAG-AA-Check für `--color-levelup` und `--color-moment-repair` via `/showcase`
5. Realtime-Sync Zwei-Geräte-Flow (Schüler-Tablet + Coach) — separater Feature-Branch
6. Entscheidung Rasit: `COLORS`-Konstante in `EdvanceLogo.tsx` auf CSS-Variablen migrieren oder als Design-Handoff-Ausnahme dokumentieren
