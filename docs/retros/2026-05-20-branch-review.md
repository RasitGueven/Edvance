# Branch-Review 2026-05-20 — claude/sweet-ramanujan-UJ7ns

## Zusammenfassung

Dieser Branch enthält zwei vollständige Feature-Pakete: das Real-Data-Programm (Migrationen 011–021, vollständiger Supabase-Lib-Layer, Edge Function, Mock-Entfernung) und das Brand-System mit Farbsystem-Feinschliff (Level-Up Türkis-Identität, neue CSS-Tokens, EdvanceLogo-Komponente). TypeScript ist fehlerfrei (`npx tsc --noEmit` = kein Output). Es existieren mehrere Inline-Style-Verstöße und zwei Dateien über 400 Zeilen, die in nachfolgenden Sessions adressiert werden sollten.

---

## Feature 1: Real-Data-Programm

### Was gebaut wurde

Vollständige Ablösung aller Mock-Daten durch echte Supabase-Anbindung. Abgedeckter Scope: Lead-Erfassung, Erstgespräch/Screening, Tarif-Verwaltung, Schüler-Provisionierung, Coach-/Student-/Parent-Dashboards. localStorage komplett aus `DiagnosisContext` entfernt (außer ThemeContext, bewusst kosmetisch).

### Datenbankschema (neue Tabellen / Migrationen)

| Migration | Inhalt |
|---|---|
| 011 | RLS-Fix `students`/`parent_student`/`student_subjects` + Security-Definer-Helper |
| 012 | `leads` — Lead-Erfassung vor Account-Anlage, nur coach/admin-Zugriff |
| 013 | `intake_sessions` — Erstgespräch-Protokolle |
| 014 | `screening_tests` + `screening_ratings` (Coach-Rating append-only), `behavior_snapshots.screening_test_id` |
| 015 | `tiers` + `student_subscriptions` |
| 016 | `student_coach` — Coach-Zuweisung |
| 017 | `coaching_sessions` + `session_students` |
| 018 | `student_task_progress` |
| 019 | `student_progress` + append-only `xp_events` (Trigger `apply_xp_event`) |
| 020 | `parent_reports` |
| 021 | RPC `app_provision_student` (plpgsql, `SECURITY DEFINER`, nur `service_role`) — atomar: profiles → students → parent_student → student_subjects → student_coach → student_subscriptions → leads-Status |

Alle neuen Tabellen haben RLS aktiviert. Append-only-Tabellen (`behavior_snapshots`, `xp_events`, `screening_ratings`) enthalten kein UPDATE/DELETE im Lib-Layer.

### Lib-Layer (neue Supabase-Funktionen in `src/lib/supabase/`)

Alle Module liefern `SupabaseResult<T>` mit try/catch:

- `auth.ts` — Session, Rollen-Check
- `behavior.ts` — `persistBehaviorSnapshot` (insert-only)
- `intake.ts` — Erstgespräch-CRUD
- `leads.ts` — `createLead`, `listLeads`, `updateLead`
- `parentReports.ts` — Reports per Kind
- `profiles.ts` — `getCoaches`
- `progress.ts` — XP/Streak aus `student_progress`
- `provision.ts` — Client-seitiger Wrapper für Edge Function `provision_student`
- `screening.ts` — `createScreeningTest`, `getActiveScreeningTest`, `completeScreeningTest`, `getScreeningSnapshots`
- `screeningRatings.ts` — Coach-Rating-Persistenz (separate Tabelle, kein ALTER auf `behavior_snapshots`)
- `sessions.ts` — Coaching-Sessions
- `storage.ts` — Task-Assets
- `studentCoach.ts` — Coach-Zuweisung
- `students.ts` — `getStudentByProfile`, `listStudentsWithName`
- `subscriptions.ts` — `listTiers`, Abo-Verwaltung
- `taskProgress.ts` — `student_task_progress`
- `tasks.ts` — Aufgaben, Cluster, Microskills (342 Zeilen, unter Limit)
- `tiers.ts` — Tarif-Katalog

### Edge Function

`supabase/functions/provision_student/index.ts` (Deno, service-role):
1. Auth-User für Schüler anlegen (Auth-Admin-API)
2. Optional Elternteil per Invite
3. Atomarer DB-Teil via RPC `app_provision_student`
4. Cleanup: bei RPC-Fehler werden angelegte Auth-User wieder gelöscht

CORS-Header korrekt gesetzt. `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig über `Deno.env` — nicht im Frontend.

### UI-Änderungen

- `/admin/leads` — Lead-Erfassung + Liste + Status-Workflow (new → contacted → onboarding_scheduled → converted/rejected)
- `/coach/intake` — Erstgespräch-Protokoll (draft → final)
- `/admin/tiers` — Tarif-Verwaltung aus DB-Katalog statt Hardcode
- `/admin/diagnostics` — Admin-Oberfläche zum manuellen Task-Seeding
- `/screening` — DB-gestützt mit Resume-Funktion
- `CoachDashboard` — echte Sessions und Anwesenheit
- `StudentDashboard` — XP/Streak aus `student_progress`
- `ClusterView` — Fortschritt aus `student_task_progress`
- `ParentDashboard` — echte Kind-Daten + Reports
- Schnellzugriff-Kacheln (`DashboardTiles`) für alle drei Rollen

### Offene Punkte

- Diagnostik-Content-Seeding (`tasks.is_diagnostic = true`) fehlt — `/screening` zeigt korrekten EmptyState, wird aber erst mit Content vollständig nutzbar
- Browser-Verifikation des U4-Conversion-Flows und `/screening`-Flows steht aus (durch Rasit)
- PR #16 hat `main` als Base-Branch statt `dev` (Abweichung CLAUDE.md §5, Entscheidung Rasit dokumentiert)
- Zwei-Geräte-Flow (Schüler-Tablet + Coach) hat keinen Cross-Tab-Sync mehr nach localStorage-Entfernung; Realtime ist eigener Folgeschritt

---

## Feature 2: Brand-System & Farbsystem

### Was gebaut wurde

Level-Up-Meilenstein bekommt eine eigene Premium-Türkis-Identität, abgesetzt von Alltags-XP (Gold), Task/Boss-Erfolg (Grün) und Streak-Verlust (Rot). Zusätzlich Streak-Repair-Token (Lila). Gold vereinheitlicht auf Single Source. Edvance-Logo/Wordmark als React-Komponente.

### CSS-Tokens (neu/geändert in `src/styles/tokens.css`)

**Neue Tokens:**
- `--color-levelup: #0E9E96` — ruhige UI-/Badge-Variante
- `--color-moment-levelup: #19C9BC` — leuchtend auf Navy-Bühne
- `--color-levelup-on: #04302D` — Text-On-Color (WCAG-konform)
- `--color-moment-repair: #8B5CF6` — Streak-Repair (Lila, seltenes Power-up)
- `--color-moment-repair-on: #FFFFFF`
- `--color-accent-light: #FBEAD0` — Badge-BG für Accent/XP
- `--gradient-levelup`, `--gradient-repair`, `--shadow-glow-levelup`
- Premium-Gradient-Suite: `--gradient-brand`, `--gradient-hero`, `--gradient-primary-btn`, `--gradient-gold`, `--gradient-success`, `--gradient-surface`, `--gradient-celebration`
- Premium-Shadow-Suite: `--shadow-premium-sm/md/lg/xl`, `--shadow-glow-primary`, `--shadow-glow-gold`, `--shadow-inset-card`
- Hero-Navy-Tokens: `--color-hero-navy: #14213D`, `--color-hero-navy-2: #1F3157`

**Geänderte Tokens (Legacy auf Single Source umgebogen):**
- `--xp-gold` → `var(--color-accent)` (Gold #E8A020, minimal von #F59E0B korrigiert)
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

**Neue Utility-Klassen in `src/styles/globals.css`:**
- `.shadow-premium-sm/md/lg/xl`, `.shadow-glow-primary/gold/levelup`
- `.bg-gradient-brand/hero/primary-btn/gold/levelup/repair/success/surface/celebration`
- `.glass-light`, `.glass-dark` (Glasmorphismus)
- `.hover-lift` (Micro-Interaktion)
- `.noise-overlay` (Premium-Tiefe auf dunklen Flächen)
- `.toast-levelup` (Türkis-Gradient), `.text-display`, `.text-eyebrow`

### Komponenten

- `src/components/brand/EdvanceLogo.tsx` — drei Exporte: `EdvanceSymbol` (J-Kurve allein), `EdvanceLogo` (Symbol + Wordmark), `EdvanceAppIcon` (gerundetes Quadrat)
- `EdvanceBadge` — neue Varianten `levelup` (Türkis) und `repair` (Lila)
- `ToastBanner` — neuer Typ `levelup` via `.toast-levelup`-Klasse
- `DesignShowcase` — neue Sektion „Emotionale Momente" mit P3-Farbswatches

### Offene Punkte

- Türkis- und Repair-Hexwerte sind kalibrierte Vorschläge — finale WCAG-AA-Prüfung im Browser ausstehend (`/showcase`, `/demo/design`)
- Vollständige UI-Flows für Streak-Repair und Boss-Gradient sind nur token-/badge-/toast-seitig vorbereitet; eigentliche Flows sind separater Schritt

---

## TypeScript-Status

`npx tsc --noEmit` — kein Output, keine Fehler. Build ist sauber.

---

## Regelprüfung (CLAUDE.md)

### Verstösse — Blocker

**Inline-Styles mit statischen Werten (CLAUDE.md §4, §11):**

- `/home/user/Edvance/src/pages/admin/AdminDashboard.tsx` Zeile 20: `const SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'` — hardcodierter Shadow-Wert, als Inline-Style auf `Card` angewendet (Zeilen 71, 183). Muss durch `shadow-premium-md` oder `shadow-elevation-md` Utility ersetzt werden.
- `/home/user/Edvance/src/pages/DiagnosisSession.tsx` — 21 Inline-Style-Vorkommen. Die meisten verwenden `var(--border)` oder `var(--border-strong)`, was den Token-Regeln entspricht, aber als statische Werte in Tailwind-Klassen ausdrückbar wäre (z.B. `border-2 border-[var(--border)]`). Einige setzen dynamisch berechnete Farben via `color-mix()` — das ist als Ausnahme vertretbar, aber der Umfang (21 Vorkommen) ist zu hoch.
- `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` — Layout-Properties (`display: 'inline-flex'`, `alignItems: 'center'`, `gap`, `flexDirection`) in Inline-Styles (Zeilen 115, 137, 154, 201). Diese sind statisch und müssen durch Tailwind-Klassen ersetzt werden. Ausnahme: der dynamisch berechnete `gap`-Wert (Zeile 105: `Math.round(size * 0.55)`) ist als wirklich dynamischer Wert akzeptabel.

**Dateigrösse über 400 Zeilen (CLAUDE.md §4):**

- `/home/user/Edvance/src/pages/admin/DiagnosticsPage.tsx` — 427 Zeilen. Empfehlung: `NewTaskForm`-Komponente in eigene Datei auslagern.
- `/home/user/Edvance/src/pages/student/StudentDashboard.tsx` — 419 Zeilen. Empfehlung: Cluster-/Task-Bereich in separate Unterkomponente auslagern.
- `/home/user/Edvance/src/pages/DiagnosisSession.tsx` — 764 Zeilen. Erheblich über Limit; bereits bekannte Schuld. Sollte aufgeteilt werden (z.B. Aufgaben-Render-Komponenten, Answer-State-Logik).
- `/home/user/Edvance/src/pages/DesignShowcase.tsx` — 478 Zeilen. Über Limit; akzeptabel als reine Dokumentations-/Showcase-Seite, aber Aufteilung in Sektions-Komponenten empfohlen.

### Warnungen

**Inline-Styles mit CSS-Variablen (zulässig aber verbessert werden sollte):**

- `LeadsPage.tsx` Zeile 219–224: `borderColor` und `background` via `var(--primary)` / `var(--border)` — Werte sind dynamisch (abhängig von `active`-State), damit als Ausnahme akzeptabel. Könnte durch `className`-Toggle sauberer sein.
- `Login.tsx` Zeile 49/54: `style={{ background: 'var(--color-moment-gold)' }}` und `style={{ background: 'var(--color-primary-light)' }}` — statische Werte, sollten als Tailwind-Klassen ausgedrückt werden (`bg-[var(--color-moment-gold)]`).

**Rohe `Card` statt `EdvanceCard` (CLAUDE.md §11):**

- `AdminDashboard.tsx` Zeilen 71, 183: shadcn `Card` direkt verwendet statt `EdvanceCard`. Für die OnBoarding-Success-State-Card und die Wizard-Card sollte `EdvanceCard` genutzt werden.

### Positiv-Befunde

- Kein direkter Supabase-Aufruf in Komponenten oder Pages — alle Zugriffe ausschließlich über `src/lib/supabase/`.
- `.env` und `.env.local` stehen korrekt in `.gitignore`.
- `behavior_snapshots` — nur insert, kein update/delete im gesamten Lib-Layer. Append-only-Regel eingehalten.
- `xp_events` ebenfalls append-only (Trigger-basiert).
- Auth-geschützte Routen via `ProtectedRoute` — kein manueller Rollen-Check in Pages.
- `SUPABASE_SERVICE_ROLE_KEY` nicht im Frontend — ausschliesslich in Edge Function via `Deno.env`.
- Alle neuen Supabase-Lib-Funktionen haben try/catch mit aussagekräftigen Fehlermeldungen.
- `EmptyState` und `LoadingPulse` werden in allen neuen Pages verwendet.
- `EdvanceBadge` für Status-Anzeigen in LeadsPage und CoachDashboard.

---

## Architekturentscheidungen

1. **Append-only Coach-Rating**: Coach-Bewertungen als separate `screening_ratings`-Tabelle statt ALTER auf `behavior_snapshots`. Hält die Snapshots unveränderlich und macht Ratings auditierbar.
2. **Nicht-rekursive RLS**: Security-Definer-Helper-Funktionen (`get_my_role`, `get_my_student_id`, `is_parent_of_student`) statt Inline-Joins in Policies. Verhindert RLS-Performance-Probleme bei rekursiven Policy-Checks.
3. **Atomare Provisionierung**: Lead-zu-Schüler-Konvertierung in einer einzigen plpgsql-Transaktion (RPC 021). Edge Function übernimmt nur den auth-API-Teil, der ausserhalb von DB-Transaktionen laufen muss.
4. **jsonb für Screening**: `generated_test`- und `result_summary`-Felder als jsonb statt normalisierter Tabellen — richtig für volatile, schema-lose Diagnose-Strukturen.
5. **Eine Engine**: `/diagnosis` und `/screening` teilen dieselbe Runtime — kein Mock-Zwilling. Screening ist der produktisierte Einstieg.
6. **Single Source für Farb-Tokens**: `tokens.css` als einzige Quelle; `globals.css` referenziert ausschliesslich via `var()`. Legacy-Aliase in `globals.css` auf tokens.css umgebogen.
7. **Level-Up Farb-Taxonomie**: Klare semantische Trennung — Gold = Alltags-XP, Türkis = Meilenstein-Level-Up, Grün = Task/Boss-Erfolg, Rot = Streak-Verlust, Lila = Streak-Repair. Jede Farbe hat eine eindeutige Bedeutung.

---

## Nächste Schritte

1. **Priorität Hoch**: Diagnostik-Content seeden (`tasks.is_diagnostic = true`) — ohne Content bleibt `/screening` im EmptyState. Kann über `/admin/diagnostics` manuell oder via Seed-Script erfolgen.
2. **Priorität Hoch**: Browser-Verifikation durch Rasit — U4-Conversion-Flow (Lead → Schüler anlegen), `/screening`-Ablauf mit echtem Content.
3. **Priorität Mittel**: Inline-Style-Bereinigung in `AdminDashboard.tsx` (SHADOW_CARD → shadow-Utility-Klassen) und `EdvanceLogo.tsx` (statische Layout-Properties → Tailwind).
4. **Priorität Mittel**: `DiagnosticsPage.tsx` (427 Zeilen) und `StudentDashboard.tsx` (419 Zeilen) unter 400-Zeilen-Limit bringen.
5. **Priorität Mittel**: `DiagnosisSession.tsx` (764 Zeilen) aufteilen — ist die grösste technische Schuld im Frontend.
6. **Priorität Niedrig**: WCAG-AA-Prüfung der neuen Türkis-/Repair-Tokens im Browser (`/showcase`, `/demo/design`).
7. **Priorität Niedrig**: Realtime Cross-Tab-Sync für Zwei-Geräte-Flow (Schüler-Tablet + Coach) — Supabase Realtime Subscriptions.
8. **Priorität Niedrig**: `AdminDashboard.tsx` und `IntakePage.tsx` auf `EdvanceCard` statt rohe shadcn `Card` umstellen.
