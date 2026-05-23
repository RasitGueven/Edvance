# Review 2026-05-23 — Gesamtdokumentation Branch claude/sweet-ramanujan-UIuce

## Zusammenfassung

| Metrik | Wert |
|---|---|
| Commits vs. main | 57 (inkl. 2 Merge-Commits von PRs #16, #18) |
| Dateien geändert | 104 |
| Zeilen hinzugefügt | +9.337 |
| Zeilen entfernt | −871 |
| Zeitraum | 2026-05-14 bis 2026-05-17 |
| TypeScript-Exit-Code | 0 (sauber) |

Zwei Haupt-Feature-Branches wurden in diesen Branch gemergt:
- `feature/real-data-program` → PR #16 → PR #17 (dev-Sync) → in diesen Branch
- `feature/levelup-tuerkis` (Farbsystem) → PR #18 → in diesen Branch

Davor liegen auf dem Branch weitere Feature-Arbeiten (Design-System, Task-Widgets, Asset-Generator), die direkt committet wurden.

---

## TypeScript-Status

Befehl: `npm run lint` (= `tsc -b --noEmit`)

```
> edvance@0.0.0 lint
> tsc -b --noEmit
```

Exit-Code: **0** — keine TypeScript-Fehler.

---

## Milestones & Was gebaut wurde

### M0 — Task-Preview-Redesign (frühe Commits)

Neue Admin-Bausteine für die Aufgaben-Vorschau:

- `TaskMetaRow` — zeigt Fach, Klasse, Schwierigkeitsgrad und Cognitive-Type als Inline-Reihe
- `TaskPedagogyAccordion` — aufklappbare Pädagogik-Details (Ziel, Vorwissen, Differenzierung)
- `TaskPreviewCard` — kombiniert MetaRow + PedagogyAccordion + Question
- `TaskQuestionBlock` — CognitiveHero-Banner + SubtaskCard-Aufteilung + InputCue-Chip
- `TaskFilterBar` — Suche + Cognitive-Filter + Difficulty-Slider für Admin-Aufgabenliste
- `TaskAssetEditor` — Upload-Pipeline für Aufgaben-Bilder (Storage + RLS)
- `LambacherPreview` auf neue Task-Komponenten umgestellt

### M0b — Asset-Generator

- `scripts/generate-assets.ts` — CLI-Skript zur Anthropic-API-gestützten Asset-Generierung (368 Zeilen)
- `scripts/canva-prompts/lambacher-8-nrw.md` — Canva Magic-Media-Prompts für Lambacher 8 NRW

### M1 — Design-System Foundation + Task-Widgets (feature/design-system-premium)

- `src/styles/tokens.css` (neu, 89 Zeilen) — Single Source of Truth für alle Design-Tokens: Farben, Spacing, Radii, Shadows, Typografie
- `src/styles/globals.css` erweitert auf 356 Zeilen — `@theme inline`-Mapping für Tailwind v4, Tailwind-Utilities, CSS-Animationen
- shadcn/ui-Komponenten (`badge.tsx`, `button.tsx`, `card.tsx`) auf CSS-Variablen umgebogen
- `src/components/edvance/index.tsx` — neue Komponenten: `EdvanceBadge` (Varianten muted/success/warning/destructive/xp/levelup/repair), `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials`, `ProgressStep`, `EmptyState`, `LoadingPulse`, `ToastBanner`
- Task-Widget-Komponenten (`MCWidget`, `MatchingWidget`, `StepsWidget`, `TaskAnswerArea`) — interaktive Antwort-Widgets für Student-View
- `/demo/widgets` und `/showcase` für visuelle Verifikation
- `/demo/design` — 5 Live-Szenarien: Student, Coach, Session-End, Celebration, UIKit

### M2 — Real-Data-Programm (feature/real-data-program)

Vollständige Mock-Entfernung und Anbindung an echte Supabase-Daten.

**Migrationen 010–021** (Details: siehe Abschnitt Datenbankschema).

**Lib-Layer** — 14 neue Dateien in `src/lib/supabase/` (Details: siehe Lib-Layer-Übersicht).

**UI-User-Stories:**
- U1: `MOCK_COACHES` → `getCoaches()`
- U2: `/admin/leads` — Lead-Erfassung + Listenansicht + Status-Workflow + Lead-zu-Schüler-Konvertierung
- U3: `/coach/intake` — Erstgespräch-Protokoll-Formular (draft → final), mit Screening-Auflistung
- U4: AdminDashboard + LeadsPage rufen `provisionStudent()` auf (Edge Function → RPC)
- U5a/b: Diagnose-Engine auf echten `buildRunTasks()`-Generator, `mockDiagnosisTasks.ts` gelöscht
- U5c: `/screening`-Route mit DB-Persistenz, Resume, `localStorage` komplett aus `DiagnosisContext` entfernt
- U6: `TIERS`-Konstante raus → `/admin/tiers` mit DB-Katalog
- U7: `CoachDashboard` — echte Sessions/Anwesenheit, `mockData.ts` gelöscht
- U8: `ClusterView` — Fortschritt aus `student_task_progress`
- U9: `StudentDashboard` — XP/Streak aus `student_progress`
- U10: `ParentDashboard` — echte Kind-Daten + Reports

**Edge Function** `supabase/functions/provision_student` (Deno, service-role): Auth-User-Anlage (Schüler + Eltern-Invite) → RPC `app_provision_student` → Cleanup bei Fehler.

**Zusatz:** `/admin/diagnostics` (427 Zeilen) — manuelle Task-Seeding-Oberfläche für Diagnostik-Content.

**Schnellzugriff-Kacheln** (`DashboardTiles`) für Schüler-, Coach- und Eltern-Dashboard.

### M3 — Brand-System + Farbsystem-Feinschliff (feature/levelup-tuerkis)

- `src/components/brand/EdvanceLogo.tsx` (249 Zeilen) — SVG-Wordmark + Symbol (Design-Handoff), in `EdvanceNavbar` eingebunden
- `public/brand/` — SVG-Assets: app-icon, favicon, logo-dark, logo-light, symbol
- `tokens.css` P1: Level-Up-Türkis-Tokens (`--color-levelup #0E9E96`, `--color-moment-levelup #19C9BC`, `--color-levelup-on`, `--gradient-levelup`, `--shadow-glow-levelup`), Streak-Repair (`--color-moment-repair #8B5CF6`), Accent-Light (`--color-accent-light #FBEAD0`), Legacy-Aliase auf Single Source umgebogen
- `EdvanceBadge`: Varianten `levelup` (Türkis) + `repair` (Lila)
- `ToastBanner`: Typ `levelup` mit `.toast-levelup`-Türkis-Gradient
- `ScenarioCelebration`: Level-Badge mit `--gradient-levelup` + `--shadow-glow-levelup`
- `DesignShowcase`: Gruppe „Emotionale Momente" ergänzt

---

## Datenbankschema-Änderungen

| Migration | Inhalt | RLS |
|---|---|---|
| 010 | RLS-Policies für `task-assets` Storage-Bucket (admin insert/update/delete) | Bucket-Ebene |
| 011 | RLS-Fix `students` / `parent_student` / `student_subjects`; Security-Definer-Helper `get_my_student_id()`, `is_parent_of_student()` | Ja |
| 012 | Tabelle `leads` (Name, Kontakt, Fächer, Status, Klasse, Schulform) | Ja (coach+admin) |
| 013 | Tabelle `intake_sessions` (Erstgespräch-Protokoll, draft/final) | Ja (coach+admin+parent read) |
| 014 | Tabelle `screening_tests` + `screening_ratings` (append-only); FK `behavior_snapshots.screening_test_id` | Ja |
| 015 | Tabellen `tiers` + `student_subscriptions` | Ja |
| 016 | Tabelle `student_coach` (Schüler-Coach-Zuordnung) | Ja |
| 017 | Tabellen `coaching_sessions` + `session_students` (Anwesenheit) | Ja |
| 018 | Tabelle `student_task_progress` (Aufgaben-Fortschritt) | Ja |
| 019 | Tabellen `student_progress` + `xp_events` (append-only); DB-Trigger `apply_xp_event` akkumuliert XP serverseitig | Ja |
| 020 | Tabelle `parent_reports` (Coach-Bericht an Eltern) | Ja |
| 021 | Plpgsql-Funktion `app_provision_student` (SECURITY DEFINER, nur service_role) — atomare Lead→Student-Conversion in einer Transaktion | SECURITY DEFINER |

Alle neuen Tabellen haben `enable row level security` + spezifische Policies. `xp_events` hat kommentiert kein update/delete-Policy (append-only).

---

## Neue Routen

| Route | Komponente | Schutz |
|---|---|---|
| `/admin/leads` | `LeadsPage` | ProtectedRoute (admin, coach) |
| `/admin/tiers` | `TiersPage` | ProtectedRoute (admin) |
| `/admin/diagnostics` | `DiagnosticsPage` | ProtectedRoute (admin) |
| `/coach/intake` | `IntakePage` | ProtectedRoute (coach, admin) |
| `/screening` | `DiagnosisSession screening` | ProtectedRoute (student, coach, admin) |
| `/screening/result` | `DiagnosisResult` | ProtectedRoute (student, coach, admin) |
| `/demo/widgets` | `TaskWidgetDemo` | Offen (kein Login) |
| `/demo/design` | `DesignDemo` | Offen (kein Login) |
| `/showcase` | `DesignShowcase` | Offen (kein Login) |

`/diagnosis` und `/diagnosis/result` waren bereits vorhanden und bleiben offen (Tablet-Modus ohne Login, bewusst).

---

## Komponenten-Neuzugänge

| Datei | Beschreibung | Zeilen |
|---|---|---|
| `src/components/brand/EdvanceLogo.tsx` | SVG-Wordmark + Symbol (Design-Handoff), light/dark/color-Varianten | 249 |
| `src/components/edvance/DashboardTiles.tsx` | Schnellzugriff-Kacheln (Link + EdvanceCard) für alle Dashboards | 62 |
| `src/components/edvance/tasks/MCWidget.tsx` | Multiple-Choice-Widget für Schüler-Ansicht | 48 |
| `src/components/edvance/tasks/MatchingWidget.tsx` | Zuordnungs-Widget (Map-basiert) | 120 |
| `src/components/edvance/tasks/StepsWidget.tsx` | Schritte-Widget mit Step-Tracker | 44 |
| `src/components/edvance/tasks/TaskAnswerArea.tsx` | Routing-Komponente: wählt Widget nach `input_type` | 201 |
| `src/components/edvance/tasks/TaskAssetEditor.tsx` | Admin-Upload für Aufgaben-Assets (Storage) | 145 |
| `src/components/edvance/tasks/TaskFilterBar.tsx` | Suchleiste + Filter für Admin-Aufgabenliste | 194 |
| `src/components/edvance/tasks/TaskMetaRow.tsx` | Metadaten-Zeile (Fach, Klasse, Difficulty, Cognitive) | 74 |
| `src/components/edvance/tasks/TaskPedagogyAccordion.tsx` | Aufklappbare Pädagogik-Details | 98 |
| `src/components/edvance/tasks/TaskPreviewCard.tsx` | Admin-Aufgaben-Vorschau-Card | 62 |
| `src/components/edvance/tasks/TaskQuestionBlock.tsx` | CognitiveHero + SubtaskCards + InputCue | 170 |

In `src/components/edvance/index.tsx` (559 Zeilen gesamt) wurden bestehende Komponenten erweitert und neue hinzugefügt: `EdvanceBadge` mit Varianten levelup/repair, `MasteryBar`, `XPBar`, `StatCard`, `AvatarInitials`, `ProgressStep`, `EmptyState`, `LoadingPulse`, `ToastBanner`.

---

## Lib-Layer-Übersicht

Alle Dateien in `src/lib/supabase/`. Alle Funktionen verwenden `SupabaseResult<T>` + try/catch.

| Datei | Beschreibung |
|---|---|
| `auth.ts` | Auth-Hilfsfunktionen (vorhanden vor diesem Branch) |
| `behavior.ts` | `persistBehaviorSnapshot` — insert-only in `behavior_snapshots` |
| `client.ts` | Supabase-Client (VITE_SUPABASE_ANON_KEY, kein service_role) |
| `intake.ts` | `createIntakeSession`, `updateIntakeSession` (draft→final), `listIntakeSessions` |
| `leads.ts` | `createLead`, `listLeads`, `updateLead` (Status-Änderungen), `getLead` |
| `parentReports.ts` | `createParentReport`, `publishParentReport`, `listParentReports`, `getParentReport` |
| `profiles.ts` | `getCoaches` (erweitert um Profil-Lookup) |
| `progress.ts` | `getStudentProgress`, `awardXp` (insert-only in `xp_events`), `listXpEvents` |
| `provision.ts` | `provisionStudent` — ruft Edge Function `provision_student` via `supabase.functions.invoke` auf |
| `screening.ts` | `createScreeningTest`, `getActiveScreeningTest`, `getScreeningSnapshots`, `updateScreeningProgress`, `abortScreeningTest`, `completeScreeningTest` |
| `screeningRatings.ts` | `createScreeningRating`, `getRatingsForTest` — Coach-Bewertungen (separates Append-Only) |
| `sessions.ts` | `createCoachingSession`, `listCoachingSessions`, `updateSessionAttendance`, `getCoachingSession` |
| `storage.ts` | `uploadTaskAsset`, `deleteTaskAsset`, `getTaskAssetUrl` |
| `studentCoach.ts` | `assignCoach`, `getStudentCoach`, `listStudentsByCoach` |
| `students.ts` | `getStudentByProfile`, `listStudentsWithName`, `updateStudentProfile` + Fach-Mapping |
| `subscriptions.ts` | `createSubscription`, `cancelSubscription`, `getActiveSubscription` |
| `taskProgress.ts` | `upsertTaskProgress`, `getTaskProgress`, `listTaskProgressByStudent` |
| `tasks.ts` | `getSubjects`, `getTasksByMicroskill`, `listTasks`, `updateTaskAssets`, `updateTask` + Diagnostik-Seeding-Funktionen |
| `tiers.ts` | `listTiers`, `createTier`, `updateTier` |

---

## Sicherheits-Audit

| Prüfpunkt | Befund |
|---|---|
| `.env` in `.gitignore` | Bestätigt: `.env` und `.env.local` sind eingetragen |
| `.env` staged | Nein — `git status` zeigt keine gestagten `.env`-Dateien |
| `.env.example` committet | Ja (ohne echte Werte) |
| service_role Key im Frontend | Nicht vorhanden — `src/` enthält keinen Verweis auf `SUPABASE_SERVICE_ROLE_KEY` |
| service_role in Edge Function | Korrekt: `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — nur im Deno-Runtime injiziert |
| Supabase direkt in Komponenten/Pages | Nicht vorhanden — alle Supabase-Calls ausschließlich in `src/lib/supabase/` |
| ProtectedRoute | Alle neuen auth-pflichtigen Routen sind mit ProtectedRoute abgesichert |
| BehaviorSnapshot Update/Delete | Nicht vorhanden — `behavior.ts` enthält nur `insert` |
| xp_events Update/Delete | Nicht vorhanden — Migration 019 kommentiert ausdrücklich: kein update/delete-Policy |
| screening_ratings | Append-only: nur `insert` + `select` in `screeningRatings.ts` |
| RLS auf alle neuen Tabellen | Bestätigt: Migrationen 012–020 enthalten jeweils `enable row level security` + Policies |
| `app_provision_student` | SECURITY DEFINER, nur via service_role-Edge-Function aufrufbar |
| CORS in Edge Function | `Access-Control-Allow-Origin: '*'` — akzeptabel für interne Admin-Aktion, nicht öffentlich |
| Auth/RLS-Änderungen | Migrationen 011, 021 enthalten RLS/Auth-Änderungen — Migration 021 hat expliziten Hinweis: `Auth/RLS-AENDERUNG – per CLAUDE.md mit Rasit explizit abstimmen` |

---

## CLAUDE.md-Compliance

### Bestätigt sauber

- Keine Supabase-Calls außerhalb `src/lib/supabase/` (Seiten und Komponenten rein)
- Keine `mock`/`MOCK_`-Runtime-Treffer in produktivem Code (`mockData.ts`, `diagnosisMockData.ts` gelöscht)
- Alle neuen Tabellen mit RLS + Policies
- `xp_events` und `behavior_snapshots` sind append-only — keine update/delete-Operationen
- Kind-seitiges Feedback: kein Korrekt/Falsch-Indikator in Student-Views gefunden; `DiagnosisSession` (Student-Sicht) zeigt keine Antwort-Auswertung
- `ProtectedRoute` für alle neuen auth-pflichtigen Routen
- Nur `VITE_SUPABASE_ANON_KEY` im Frontend — kein service_role Key
- TypeScript: Exit-Code 0
- `EmptyState` und `LoadingPulse` werden in allen neuen Seiten verwendet (34 Treffer in `src/pages/`)
- `EdvanceCard` für Cards in allen neuen Seiten verwendet
- Keine rohen `<table>`-Elemente in Pages
- Commit-Präfixe (`feat:`, `fix:`, `refactor:`, `docs:`) vollständig eingehalten (30/30 konventionellen Commits)

### Warnungen

**W1 — Hardcodierte Hex-Farben in Komponenten (außerhalb `src/styles/`)**

Folgende Dateien verwenden Hex-Codes direkt statt CSS-Variablen:

- `/home/user/Edvance/src/components/edvance/tasks/MatchingWidget.tsx` Zeilen 14–17: `TINTS`-Array mit `#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed`. Die Farben sind CSS-Variable-Entsprechungen (`--primary`, `--success`, `--warning`, `--color-moment-repair`), aber als Hex hardcodiert.
- `/home/user/Edvance/src/components/edvance/tasks/MCWidget.tsx` Zeile 37: `color: active ? '#fff' : 'var(--primary)'` — `#fff` statt `'white'` oder `'var(--color-bg-surface)'`.
- `/home/user/Edvance/src/components/edvance/index.tsx` Zeilen 309–310: `AVATAR_PALETTE` mit 8 Hex-Codes. Algorithmische Hash-Funktion für Avatar-Farben — ein vertretbarer Sonderfall, aber nicht konform.
- `/home/user/Edvance/src/pages/student/StudentDashboard.tsx` Zeile 305: `fg: '#9A6B00'` in `CLUSTER_TINTS` — es fehlt eine CSS-Variable für diesen Gold-Textkontrast.
- `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` Zeilen 19–22: `COLORS`-Objekt mit `#334D7A`, `#F7F7F5`, `#1A1A18`, `#E8A020`. Diese sind Brand-Fixwerte im SVG-Logo-Kontext — ein Grenzfall, da SVG-Paths keine Tailwind-Klassen tragen können, aber `var(--color-primary)` wäre möglich.
- `/home/user/Edvance/src/components/edvance/DrawCanvas.tsx` Zeilen 14+16: `STROKE_COLOR = '#0F172A'` und `BG_COLOR = '#FFFFFF'` — Canvas-2D-API benötigt konkrete Farben, CSS-Variablen würden `getComputedStyle()` erfordern.

**W2 — Inline-Styles (124 Treffer gesamt)**

Die Anzahl der `style={{`-Vorkommen ist hoch. Die meisten verwenden korrekt `var(--...)`. Explizit zu überprüfen:
- `/home/user/Edvance/src/pages/DiagnosisSession.tsx` hat 15+ Inline-Style-Blöcke, davon viele mit `border: '2px solid var(--border)'` oder `borderBottomWidth: '4px'`. Diese könnten als Tailwind-Klassen `border-2 border-border border-b-4` ausgedrückt werden.
- `DiagnosisSession.tsx` Zeile 423: `borderBottom: \`4px solid ${r.dark}\`` — dynamischer Wert mit CSS-Variable-Referenz, technisch erlaubt per CLAUDE.md §11 ("wirklich dynamische Werte").

**W3 — Dateigröße-Überschreitungen (>400 Zeilen)**

| Datei | Zeilen | Empfehlung |
|---|---|---|
| `/home/user/Edvance/src/pages/DiagnosisResult.tsx` | 946 | In Abschnitte aufteilen: `DiagnosisResultHeader`, `ClusterFeedbackCard`, `MicroskillTable` |
| `/home/user/Edvance/src/pages/DiagnosisSession.tsx` | 764 | Trennung: `SetupScreen`, `CoachView`, `StudentView` in eigene Dateien auslagern |
| `/home/user/Edvance/src/components/edvance/index.tsx` | 559 | Einzelne Komponenten in eigene Dateien — `ToastBanner.tsx`, `LoadingPulse.tsx`, etc. |
| `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` | 427 | Grenzwert leicht überschritten (+27 Zeilen) |
| `/home/user/Edvance/src/pages/student/StudentDashboard.tsx` | 419 | Grenzwert leicht überschritten (+19 Zeilen) |
| `/home/user/Edvance/src/types/index.ts` | 461 | Typ-Definitionen aufteilen (z.B. `types/db.ts`, `types/ui.ts`) |

**W4 — Demo-Routen ohne Login-Schutz**

`/demo/widgets`, `/demo/design`, `/showcase` und `/diagnosis` sind ohne `ProtectedRoute`. Dies ist laut Retro für Tablet-Demo-Modus bewusst. Vor Produktionsdeployment prüfen, ob diese Routen erreichbar bleiben sollen.

**W5 — deprecated Token `--level-purple` in DesignShowcase**

`/home/user/Edvance/src/pages/DesignShowcase.tsx` Zeile 306 verwendet `var(--level-purple)`. Der Token wurde per M3 auf `var(--color-moment-repair)` umgebogen (Alias existiert), sollte aber direkt auf `var(--color-moment-repair)` aktualisiert werden.

**W6 — `ThemeContext` mit hardcodierten Hex-Farben**

`/home/user/Edvance/src/context/ThemeContext.tsx` enthält ein Theme-Objekt mit `#2D6A9F`, `#98C0D8` etc. Dies war eine bewusste Entscheidung (ThemeContext = kosmetisch, localStorage-basiert). Keine Änderung ohne Rasit-Freigabe (CLAUDE.md §3 Auth/Context).

### Blocker

Keine TypeScript-Fehler. Keine Supabase-Calls in Komponenten/Pages. Keine BehaviorSnapshot-Updates/Deletes. Kein service_role Key im Frontend. Keine kind-seitigen Richtig/Falsch-Indikatoren.

Die oben genannten Warnungen sind Stilbrüche und Größenlimits — kein Blocker für Merge oder Deployment.

---

## Technische Schulden & Offene Punkte

### P0 — Dringend (vor erstem Produktionseinsatz)

- **Diagnostik-Content-Seeding fehlt**: `/screening` zeigt korrekt einen EmptyState, solange keine Tasks mit `is_diagnostic=true` in der DB sind. Ohne Content ist die Kernfunktion nicht nutzbar. Seeding über `/admin/diagnostics` erfordert manuelles Befüllen.
- **CORS wildcard in Edge Function**: `Access-Control-Allow-Origin: '*'` erlaubt Aufrufe von beliebigen Origins. Da die Funktion `authorization`-Header prüft, ist das Risiko begrenzt, sollte aber auf die Edvance-Domain eingeschränkt werden.

### P1 — Mittelfristig

- **Dateigröße-Refactoring**: `DiagnosisResult.tsx` (946 Z.), `DiagnosisSession.tsx` (764 Z.), `edvance/index.tsx` (559 Z.) überschreiten das 400-Zeilen-Limit erheblich. Empfehlung: Auslagerung in Sub-Komponenten.
- **MatchingWidget-Farben**: `TINTS`-Array in `MatchingWidget.tsx` sollte auf CSS-Variablen umgestellt werden (passende Variablen existieren bereits: `--primary`, `--success`, `--warning`, `--color-moment-repair`).
- **`StudentDashboard.tsx` CLUSTER_TINTS**: `fg: '#9A6B00'` → neue CSS-Variable `--color-accent-dark` oder `--color-accent-on` definieren.
- **Zwei-Geräte-Flow**: Schüler-Tablet + Coach-Ansicht hat keinen Cross-Tab-Sync mehr (localStorage entfernt). Supabase Realtime als nächster Schritt.
- **DesignShowcase `--level-purple`**: auf `--color-moment-repair` aktualisieren.

### P2 — Nice-to-have

- **DrawCanvas CSS-Variablen**: `STROKE_COLOR`/`BG_COLOR` könnten via `getComputedStyle(canvas)` aus CSS-Variablen gelesen werden — Theme-Unterstützung für Dark Mode.
- **`EdvanceLogo.tsx` COLORS**: SVG-Pfade könnten `currentColor` + CSS nutzen, um Theme-Änderungen automatisch zu reflektieren.
- **`AvatarInitials` PALETTE**: 8 Hex-Werte als CSS-Variablen definieren, z.B. `--avatar-palette-1` bis `--avatar-palette-8`.
- **Tests**: Keine Tests für neue Lib-Layer-Funktionen vorhanden. Kandidaten: `buildRunTasks`, `rebuildRunTasks`, `provisionStudent`-Workflow.
- **MCWidget `#fff`**: auf `'white'` oder `var(--color-bg-surface)` umstellen (1-Zeilen-Fix).
- **Streak-Repair- und Boss-Gradient-Flows**: Token/Badge/Toast sind vorbereitet, UI-Flows fehlen noch.
- **Türkis-/Repair-Farben**: finale WCAG-AA-Verifikation auf `/showcase` und `/demo/design` steht aus.

---

## Architekturentscheidungen (begründet)

| Entscheidung | Begründung |
|---|---|
| Append-only via separate `screening_ratings`-Tabelle statt `behavior_snapshots`-ALTER | Hält BehaviorSnapshots unberührt; Coach-Rating ist ein separates Ereignis mit eigenem Lifecycle |
| Non-rekursive RLS via Security-Definer-Helper (`get_my_student_id`, `is_parent_of_student`) | Vermeidet Supabase-bekannte Performance-Probleme bei rekursiven RLS-Policies |
| Lead→Student-Conversion atomar in plpgsql-RPC, Edge Function nur für auth-User-Anlage | Client hat nur anon-Key; Auth-Admin-API benötigt service_role → Trennung ist sicherheitstechnisch erzwungen |
| `jsonb` statt Normalisierung für `generated_test`/`result_summary` | Diagnose-Struktur ist schema-flüchtig (neue Aufgabentypen); Normalisierung würde Migrations-Overhead erzeugen |
| localStorage komplett aus `DiagnosisContext` entfernt, nur ThemeContext behält es | Diagnose-Daten sind sensibel und müssen in DB persistiert werden; Theme-Präferenz ist kosmetisch |
| `tsc -b` (Solution-Build) statt `tsc --noEmit` | `tsconfig.json` der Lösung hat `files: []`; `--noEmit` würde nichts prüfen |
| Demo-Routen (`/demo/*`, `/showcase`, `/diagnosis`) ohne Auth | Tablet-Demo-Modus und Design-Verifikation sollen ohne Login erreichbar sein; bewusst |
| PR #16 base war `main` statt `dev` | Abweichung von CLAUDE.md §5; Entscheidung Rasit (dokumentiert in Retro 2026-05-16) |
