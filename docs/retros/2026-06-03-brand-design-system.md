# Retro 2026-06-03 — Brand-System + Real-Data-Programm (PR #16–#18)

Branch-Verlauf: `feature/real-data-program` → `dev` (PR #16 + #17) → `feature/levelup-tuerkis` → `dev` (PR #18).

---

## Block 1: Real-Data-Programm (PRs #16 + #17)

Commits: `2eb01b7` bis `0c30186` (innerhalb `feature/real-data-program`, gemergt via PR #16).

### U4 — Onboarding: Lead → Student via provisionStudent

**Datei:** `src/lib/supabase/provision.ts`

`provisionStudent()` ruft die Supabase Edge Function `provision_student` auf (service-role,
atomar). Input-Typ `ProvisionInput` deckt alle Felder ab die der Onboarding-Wizard sammelt.
`LeadsPage.tsx` und `AdminDashboard.tsx` nutzen diese Funktion — kein direkter Supabase-Call
aus den Pages heraus.

### U5c-1 — Screening DB-Persistenz + `/screening`-Route + DB-Resume

**Dateien:** `src/lib/supabase/screening.ts`, `src/context/DiagnosisContext.tsx`, `src/pages/DiagnosisSession.tsx`

`screening.ts` enthält fünf Funktionen:
- `createScreeningTest` — startet Lauf, partial-unique-Index auf `(student_id, subject, status='in_progress')` verhindert doppelte aktive Läufe DB-seitig.
- `getActiveScreeningTest` / `getScreeningTestById` — Resume-Basis.
- `completeScreeningTest` / `abortScreeningTest` — Zustandsübergänge.
- `getScreeningSnapshots` — liest `behavior_snapshots` nach `screening_test_id` sortiert nach `submitted_at` (für Resume).

`DiagnosisContext` unterscheidet jetzt `mode: 'local' | 'db'`. DB-Modus wird via `startScreening()` aktiviert; `screeningTestId` und `snapshotIds[]` (Map Index → `behavior_snapshots.id`) werden im State mitgeführt.

### U5c-2 — localStorage komplett aus DiagnosisContext

**Datei:** `src/context/DiagnosisContext.tsx`

DiagnosisContext ist vollständig in-memory (React useState). Kein `localStorage.getItem/setItem`
mehr. Der produktive Pfad ist `/screening` + DB-Resume. Der lokale `/diagnosis`-Pfad (Coach-Demo)
bleibt als In-Memory-Modus erhalten.

Einzige verbleibende `localStorage`-Nutzung in `src/`: ThemeContext (gewollt).

### U7 — CoachDashboard: echte Sessions

**Datei:** `src/pages/coach/CoachDashboard.tsx`

`MOCK_SESSIONS` entfernt. Daten kommen aus `src/lib/supabase/sessions.ts` via `getSessionsByCoach()`.

### U8 — ClusterView: Fortschritt aus DB

ClusterView-Fortschritt kommt aus `student_progress`-Tabelle statt localStorage.

### U9 — StudentDashboard: XP/Streak aus student_progress

**Datei:** `src/pages/student/StudentDashboard.tsx`

XP und Streak werden aus `student_progress` geladen. Schnellzugriff-Tiles eingebunden.

### U10 — ParentDashboard: echte Kind-Daten

**Datei:** `src/pages/parent/ParentDashboard.tsx`

Stub-Daten entfernt. Echte Kind-Daten über `src/lib/supabase/parentReports.ts`.

### Admin: /admin/diagnostics — manuelles Seeding

**Datei:** `src/pages/admin/DiagnosticsPage.tsx` (427 Zeilen — siehe Blocker unten)

Zwei Sub-Komponenten: `NewTaskForm` (neue Diagnose-Aufgabe anlegen) und `TaskRow` (bestehende
Aufgabe auf `is_diagnostic=true` setzen + Metadaten justieren). Nutzt korrekt `EdvanceCard`,
`EdvanceBadge`, `EmptyState`, `LoadingPulse`. Alle Supabase-Calls über `src/lib/supabase/tasks.ts`.

### Lib: updateTaskDiagnostic + createDiagnosticTask

**Datei:** `src/lib/supabase/tasks.ts`

Zwei neue Funktionen für das Admin-Seeding. Alle Calls haben `try/catch` mit aussagekräftigen
Fehlermeldungen. Rückgabe als `SupabaseResult<T>`.

### DashboardTiles — Schnellzugriff-Komponente

**Datei:** `src/components/edvance/DashboardTiles.tsx`

Generische `DashboardTile`-Komponente, konfigurierbar per `DashboardTile[]`-Prop. Unterstützt
React-Router `<Link>` und same-page `<a href>` (Anker-Modus). Touch-Target-Mindestgröße
`min-h-[44px]` erfüllt. Nutzt `EdvanceCard` intern.

---

## Block 2: Brand-System + Level-Up Farbsystem-Feinschliff (PR #18)

Commits: `9051995`, `3cf2c29`, `bb7af96`, `4c921ec`, `401ad6c`.

### P1 — Farbtokens (tokens.css + globals.css)

**Dateien:** `src/styles/tokens.css`, `src/styles/globals.css`

Neue Tokens in `tokens.css`:
- Level-Up-Türkis: `--color-levelup #0E9E96`, `--color-moment-levelup #19C9BC`, `--color-levelup-on #04302D`
- Gradient + Glow: `--gradient-levelup`, `--shadow-glow-levelup`
- Streak-Repair (Lila): `--color-moment-repair #8B5CF6`, `--color-moment-repair-on #FFFFFF`, `--gradient-repair`
- XP-Badge-BG: `--color-accent-light #FBEAD0`

In `globals.css` Legacy-Aliase auf Single Source umgebogen:
- `--xp-gold` → `var(--color-accent)`
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

`@theme inline`-Mapping und CSS-Utilities `.bg-gradient-levelup`, `.bg-gradient-repair`,
`.shadow-glow-levelup` hinzugefügt.

### P2 — Consumer

- `EdvanceBadge`: Varianten `levelup` (Türkis) + `repair` (Lila).
- `ToastBanner`: Typ `levelup` mit `.toast-levelup` Türkis-Gradient.
- `ScenarioCelebration`: Level-Badge → `--gradient-levelup` + `--shadow-glow-levelup` auf Navy.
- `XPBar`: nutzt automatisch vereinheitlichtes Gold durch P1.

### P3 — Showcase + Doku

`DesignShowcase` (`/showcase`): neue Gruppe „Emotionale Momente" mit allen Moment-Tokens.
Die vorherige Retro (`2026-05-17-farbsystem-feinschliff.md`) beschreibt das vollständige
Moment-Mapping (Alltags-XP / Level-Up / Boss / Streak / Repair).

### Brand-Logo: EdvanceLogo-Komponente

**Datei:** `src/components/brand/EdvanceLogo.tsx`

Drei Exports:
- `EdvanceSymbol` — J-Kurve allein (Hairline + Dot + Gold-Pfeil), für Favicon/Icons.
- `EdvanceLogo` — Symbol + Wordmark nebeneinander, `symbolRight`-Option.
- `EdvanceAppIcon` — gerundetes Quadrat für App-Icon/Avatar, filled-Modus für Siegel.

SVG-Paths als Konstanten in `PATHS` object, Farben in `COLORS` als komponentenlokale Konstanten.
Größen werden als Props übergeben, Symbol-Größe und Gap sind von `size` abgeleitet
(proportionale Skalierung).

### Wordmark in Navbar

**Datei:** `src/components/edvance/EdvanceNavbar.tsx`

`<EdvanceLogo size={20}>` ersetzt den bisherigen App-Icon + Bold-Text. Space Grotesk wird via
Google Fonts in `index.html` geladen. Subtitle (`{subtitle}`-Prop) bleibt als `text-xs
text-[var(--text-muted)]` unter dem Logo.

---

## Technische Highlights

- **append-only korrekt eingehalten**: `behavior_snapshots` hat ausschließlich `INSERT` und `SELECT`
  in `screening.ts`. Kein `update` oder `delete` auf dieser Tabelle in der gesamten Codebase.
- **Supabase-Kapselung vollständig**: Keine `supabase.` oder `from('`-Aufrufe in Pages oder
  Komponenten. Alle DB-Calls ausschließlich in `src/lib/supabase/`.
- **TypeScript**: `npx tsc --noEmit` — kein Output, kein Fehler.
- **.env**: steht in `.gitignore` (`.env` und `.env.local`), nicht gestaged.

---

## Befunde und Regelverstöße

### Blocker

**DiagnosticsPage.tsx: 427 Zeilen — Dateilimit überschritten**
`/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` hat 427 Zeilen (Limit: 400).
`NewTaskForm` und `TaskRow` sind bereits als lokale Komponenten ausgelagert — beide könnten
in eigene Dateien unter `src/components/edvance/admin/` extrahiert werden.
Empfehlung: beim nächsten Touch dieser Datei splitten.

**EdvanceLogo.tsx: Inline-Styles mit statischen Werten**
`/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` nutzt `style={{}}` für statische
Layout-Werte (`display: 'inline-flex'`, `alignItems: 'center'`, `flexShrink: 0`, `userSelect: 'none'`).
Diese verstoßen gegen die Inline-Style-Regel (CLAUDE.md §4 und §11). Da die Logo-Größe per Prop
dynamisch bestimmt wird (`fontSize: size`, `gap: Math.round(size * 0.55)`), sind die dynamisch
skalierten Werte tolerierbar. Die statischen Layout-Eigenschaften sollten auf Tailwind-Klassen
umgestellt werden.
Konkret Zeilen 115, 137–148, 154–162, 201–211.

**EdvanceLogo.tsx: Hardcodierte Hex-Farben außerhalb von CSS-Dateien**
`/home/user/Edvance/src/components/brand/EdvanceLogo.tsx:18–23` definiert `COLORS` mit
`'#334D7A'`, `'#F7F7F5'`, `'#1A1A18'`, `'#E8A020'`. Damit werden CSS-Variablen aus
`tokens.css` / `globals.css` umgangen. Änderungen am Farbsystem würden die Logo-Komponente
nicht erreichen. Empfehlung: Props auf `string` belassen, Default-Werte auf
`'var(--color-primary)'` und `'var(--color-accent)'` umstellen. Für den SVG-Context:
CSS-Variablen als `currentColor` + `fill`/`stroke`-Inheritance oder `getComputedStyle`-Lookup.

### Warnungen

**DashboardTiles.tsx: Inline-Style mit dynamischer CSS-Funktion**
`/home/user/Edvance/src/components/edvance/DashboardTiles.tsx:21` — `style={{ background: ICON_BG }}`
mit `ICON_BG = 'color-mix(in srgb, var(--primary) 12%, transparent)'`. `color-mix` lässt
sich nicht als Tailwind-Utility ausdrücken, daher ist ein Inline-Style hier akzeptabel
(dynamisch berechneter Wert). Die Konstante ist ausgelagert — kein Hex-Wert. Kein Blocker,
aber ein Kommentar zur Ausnahme wäre dokumentationspflege-konform.

**DiagnosisResult.tsx: Umfangreich Inline-Styles**
`/home/user/Edvance/src/pages/DiagnosisResult.tsx` (946 Zeilen, weit über Limit) nutzt
viele `style={{}}` mit dynamisch berechneten Farben aus einer internen Farb-Map.
Diese Datei war nicht Teil dieses PRs — bleibt als bekannter Tech-Debt bestehen.

**Größte Dateien insgesamt (nicht durch diese PRs eingeführt, aber zu beachten):**
- `DiagnosisResult.tsx`: 946 Zeilen
- `DiagnosisSession.tsx`: 764 Zeilen
- `DesignShowcase.tsx`: 478 Zeilen

---

## Entscheidungen

**Warum SVG-Pfade als JS-Konstanten statt externe SVG-Dateien?**
Die Logo-Größe wird als Prop übergeben und der `gap`-Abstand proportional berechnet. Ein
`<img src="logo.svg">` oder `<use href="...">` würde diese Kontrolle nicht bieten. Die
Komponente ist das single source of truth für alle Logo-Varianten.

**Warum Space Grotesk via Google Fonts statt lokalem Font?**
Schnellster Weg für den Design-Handoff-Commit. Für Produktion sollte der Font lokal in
`public/fonts/` liegen (Performance, Datenschutz).

**Warum DiagnosisContext in-memory statt DB-first?**
Der lokale `/diagnosis`-Pfad (Coach-Demo ohne echten Schüler) bleibt als `mode: 'local'`
erhalten. DB-first (`mode: 'db'`) ist der produktive `/screening`-Pfad. Die Dual-Mode-
Architektur ist nötig, weil Coaches auch ohne angemeldeten Schüler üben können.

**Warum provisionStudent als Edge Function statt direktem DB-Insert?**
Die Provisionierung ist atomar (User in auth.users anlegen + Profil + Zuweisung). Das erfordert
service-role-Rechte, die nicht in den Frontend-Key passen. Edge Function hält den service-role
Key serverseitig.

---

## Offene Punkte / Next Steps

1. **Diagnostik-Content seeden** (`is_diagnostic=true`) — blockiert `/screening`-Flow komplett.
   `/admin/diagnostics` ist dafür gebaut, kann aber auch per Script `mark:diagnostic` befüllt
   werden.
2. **Browser-Verifikation durch Rasit**: U4-Conversion-Flow (Lead → Student), `/screening`
   inkl. Resume, alle drei Dashboards mit Echtdaten.
3. **DiagnosticsPage.tsx splitten** auf < 400 Zeilen (beim nächsten Touch).
4. **EdvanceLogo.tsx**: hardcodierte Hex-Farben auf CSS-Variablen umstellen; statische
   Inline-Styles auf Tailwind-Klassen.
5. **Space Grotesk**: von Google Fonts auf lokalen Font-Load migrieren (public/fonts/).
6. **Türkis/Repair WCAG-AA finalisieren**: visuell in `/showcase` + `/demo/design` prüfen;
   Nachjustierung nur in `tokens.css`.
7. **Mathebuch-Import** (Lambacher Schweizer 8. Klasse NRW) — nächster großer Schritt.
8. **Home-Quest Flow** — ausstehend.

---

## Status-Update ROADMAP

- Fertig: Brand-System (Logo, Wordmark, Favicon), Level-Up-Farbsystem (P1–P3)
- Fertig: Real-Data-Programm vollständig (U4, U5c, U7–U10)
- In Arbeit: Diagnostik-Content-Seeding (`is_diagnostic=true`)
- Nächste Schritte: Browser-Verifikation durch Rasit, dann Mathebuch-Import
