# Edvance – Gesamtdokumentation aller Änderungen (Stand: 2026-05-21)

## Übersicht

Dieses Dokument ist die konsolidierte Dokumentation aller Änderungen am Edvance-Projekt
vom initialen Setup bis einschließlich Phase 7 (Brand-System + Level-Up Farbsystem-Feinschliff,
Merge-Stand 2026-05-21). Es fasst sieben Entwicklungsphasen zusammen und dient als
Referenz für alle Folge-Sessions.

**Tech-Stack:** Vite + React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui + Supabase
**Branch-Stand:** `main` enthält Phasen 1–7 via Merges aus `feature/*`-Branches in `dev`.
**Commit-Bereich:** initialer Setup bis Merge #18 (`9b4388f`)

---

## 1. Design-System & Token-Architektur

### 1.1 CSS-Variablen & Token-Hierarchie

Das Design-System besteht aus zwei Schichten:

**Schicht 1: `src/styles/tokens.css`** (Single Source of Truth für alle Farb-Tokens)

Semantische Token-Gruppen:
- **Primär:** `--color-primary #334D7A`, `--color-primary-hover #253D6A`, `--color-primary-light #EEF2F8`
- **Hintergrund:** `--color-bg-app #F7F7F5`, `--color-bg-surface #FFFFFF`, `--color-bg-subtle #EFEFED`, `--color-border #E8E8E5`
- **Text:** `--color-text-primary #1A1A18`, `--color-text-secondary #4A4A47`, `--color-text-tertiary #888884`, `--color-text-link #334D7A`
- **Akzent (XP/Gold):** `--color-accent #E8A020`, `--color-accent-light #FBEAD0` (Badge-BG), `--color-accent-celebration #F5C842`
- **On-Farben (WCAG):** `--color-accent-on #4A2E00`, `--color-accent-celebration-on #3A2000`
- **Status:** success `#2A8A4A`, warning `#C87E00`, error `#C83232`, info `#334D7A` (+ je `*-light`)
- **Hero-Navy:** `--color-hero-navy #14213D`, `--color-hero-navy-2 #1F3157`

Premium-Gradients (alle via `tokens.css`):
- `--gradient-brand`: `135deg, #14213D → #334D7A`
- `--gradient-hero`: `135deg, #14213D → #1F3157 → #334D7A`
- `--gradient-primary-btn`: `180deg, #3B5A8C → #334D7A`
- `--gradient-gold`: `135deg, #F5C842 → #E8A020`
- `--gradient-levelup`: `135deg, #1FD3C6 → #0B8B85`
- `--gradient-repair`: `135deg, #A78BFA → #7C3AED`
- `--gradient-success`: `135deg, #34A35A → #1F6F3A`
- `--gradient-surface`: `180deg, #FFFFFF → #FAFAF7`
- `--gradient-celebration`: `radial-gradient(ellipse at top, #2D4070 → #14213D)`

Brand-getönte Shadows (Premium, nicht grau):
- `--shadow-premium-sm/md/lg/xl` — rgba(20, 33, 61, ...) Basis
- `--shadow-glow-primary` — rgba(51, 77, 122, ...)
- `--shadow-glow-gold` — rgba(245, 200, 66, 0.32)
- `--shadow-glow-levelup` — rgba(25, 201, 188, 0.36)
- `--shadow-inset-card` — inset 0 1px 0 rgba(255,255,255,0.6)

**Schicht 2: `src/styles/globals.css`**

Importiert `tailwindcss` und `tokens.css`. Definiert:
- Legacy-Brand-Tokens: `--brand-navy #1B2A3E`, `--brand-blue #2D6A9F`, `--brand-blue-light #98C0D8`, `--brand-blue-pale #EBF4FA`
- Semantische Aliases: `--primary #2D6A9F`, `--background #FAFAF7`, `--surface #FFFFFF`, `--border #E8E8E5`, `--border-strong #D4D4D0`
- Text: `--text-primary #1A1A18`, `--text-secondary #4A4A47`, `--text-muted #888884`, `--text-inverse #FFFFFF`
- Status: `--success #0F6E56`, `--warning #D97706`, `--destructive #DC2626`, `--info #0EA5E9`
- **Gamification Legacy-Aliases (Single Source, keine eigenen Hex-Werte):**
  - `--xp-gold: var(--color-accent)` (→ `#E8A020`)
  - `--xp-gold-light: var(--color-accent-light)` (→ `#FBEAD0`)
  - `--level-purple: var(--color-moment-repair)` (→ `#8B5CF6`)
  - `--streak-orange: #EA580C` (einziger noch direkter Hex-Wert)
- Spacing 4pt-Grid: `--space-1` (4px) bis `--space-16` (64px)
- Radii: `--radius-sm 8px`, `--radius-md 12px`, `--radius-lg 16px`, `--radius-xl 24px`, `--radius-full 9999px`
- Transitions: `--transition-fast 120ms`, `--transition-base 200ms`, `--transition-slow 350ms`

**`@theme inline`-Block (Tailwind v4 Mapping):**
Alle Token aus `tokens.css` werden als Tailwind-Utilities verfügbar gemacht, z.B.
`bg-color-levelup`, `text-color-text-primary`, etc. Legacy-Aliases werden ebenfalls gemappt
(`--color-xp-gold`, `--color-brand-navy`, `--color-text-muted → --color-text-tertiary`).

**Utility-Klassen (via `@layer utilities`):**
- Shadow: `.shadow-card`, `.shadow-elevation-sm/md/lg`, `.shadow-premium-sm/md/lg/xl`, `.shadow-glow-primary/gold/levelup`
- Gradients: `.bg-gradient-brand/hero/primary-btn/gold/levelup/repair/success/surface/celebration`
- Glassmorphism: `.glass-light`, `.glass-dark`
- Micro-Interaktion: `.hover-lift` (translateY(-2px) + shadow-premium-lg)
- Noise-Overlay: `.noise-overlay` (Premium-Tiefe auf dunklen Flächen via SVG-feTurbulence)
- Typografie: `.text-display` (font-feature-settings, letter-spacing), `.text-eyebrow` (11px, 0.18em)
- Toast-Klassen: `.toast-success/xp/levelup/warning/error` (kein Inline-Style)

**Keyframes & Animationsklassen:**
- `@keyframes xp-pulse`, `skeleton-shimmer`, `toast-slide-down/up`, `mastery-fill`, `scale-in`, `fade-in`, `xp-shimmer`, `bounce-pop`
- Utility-Klassen: `.animate-xp-pulse`, `.animate-skeleton`, `.animate-toast-in/out`, `.animate-scale-in`, `.animate-fade-in`, `.animate-bounce-pop`
- `.mastery-bar-fill`: CSS-Transition statt Keyframe (width-Änderungen animiert)
- `.xp-bar-fill`: Shimmer-Gradient + width-Transition

### 1.2 Gamification-Farb-Mapping

| Moment | Token (Single Source) | Hex | Verwendung |
|---|---|---|---|
| Alltags-XP / Badges | `--color-accent` / `--xp-gold` | `#E8A020` | XPBar, xp-Badge, Celebration-Accents |
| XP-Badge-Hintergrund | `--color-accent-light` / `--xp-gold-light` | `#FBEAD0` | Badge-BG auf hellen Surfaces |
| Level-Up (Meilenstein, UI) | `--color-levelup` | `#0E9E96` | EdvanceBadge variant=levelup |
| Level-Up (Meilenstein, Bühne) | `--color-moment-levelup` | `#19C9BC` | ScenarioCelebration auf Navy |
| Level-Up On-Color | `--color-levelup-on` | `#04302D` | Text auf levelup-Hintergrund (WCAG) |
| Level-Up Gradient | `--gradient-levelup` | `#1FD3C6 → #0B8B85` | ToastBanner type=levelup, Badge |
| Level-Up Glow | `--shadow-glow-levelup` | rgba(25,201,188,0.36) | ScenarioCelebration Aura |
| Task-/Boss-Erfolg | `--color-moment-green` | `#1DB954` | auf `--color-moment-bg` (Navy) |
| Streak-Verlust | `--color-moment-red` | `#E03535` | Warnmomente |
| Streak-Repair | `--color-moment-repair` / `--level-purple` | `#8B5CF6` | EdvanceBadge variant=repair |
| Streak-Repair On-Color | `--color-moment-repair-on` | `#FFFFFF` | Text auf Repair-Hintergrund |
| Streak-Repair Gradient | `--gradient-repair` | `#A78BFA → #7C3AED` | Vorbereitet, kein UI-Flow noch |
| Celebration-Bühne | `--color-moment-bg` | `#1A2E4A` | Hintergrund für Level-Up-Screens |
| Streak-Feuer | `--streak-orange` | `#EA580C` | EdvanceBadge variant=streak |

**Regelwerk (enforcement):**
Emotionale Momente (moment-*) max. 3 Sekunden sichtbar, max. 1× pro Session triggerbar.
`--color-levelup` für UI/Badges (ruhig), `--color-moment-levelup` für Celebration-Bühne (leuchtend).

### 1.3 Brand-Identität & Logo

**Datei:** `src/components/brand/EdvanceLogo.tsx`

Das Edvance-Logo ist ein inline SVG-System aus drei Exports:

**`EdvanceSymbol`** — J-Kurve-Symbol allein (Hairline + Dot + Gold-Pfeil)
- Props: `size` (default 32), `color` (default `#334D7A` midnight), `accentColor` (default `#E8A020` gold), `filled` (boolean, Hairline vs. calligraphisch)
- SVG viewBox 0 0 100 100
- Paths: `spine` (M 8,36 C 12,52 28,60 34,58 C 52,54 70,14 90,8), `arrow` (M 83,14 L 90,8 L 81,7), `calligraphic` (gefüllte Variante)
- Dot: `<circle cx="8" cy="36" r="3.5"/>` in Primärfarbe

**`EdvanceLogo`** — Symbol + Wordmark nebeneinander (Navbar-Variante)
- Props: `size` (default 20, steuert Schriftgröße), `color`, `accentColor`, `symbolRight` (boolean)
- Symbol-Größe: `size * 1.8`, Gap: `size * 0.55`
- Wordmark-Font: `Space Grotesk`, weight 400, `letterSpacing: '0.045em'`
- Inline-Styles für font-family, fontSize, gap sind berechtigt (dynamisch via Props)

**`EdvanceAppIcon`** — Gerundetes Quadrat (App-Icon / Avatar / Badge)
- Props: `size` (default 48), `background`, `symbolColor`, `accentColor`, `borderRadius` (auto: `size * 0.22`), `filled`
- Inner SVG-Größe: `size * 0.52`

Einbindung: Wordmark-Logo ist in `EdvanceNavbar` integriert.

**Statische Assets in `public/brand/`:**
- `edvance-logo-dark.svg`, `edvance-logo-light.svg`
- `edvance-symbol.svg`
- `edvance-app-icon.svg`
- `edvance-favicon.svg`

---

## 2. Datenbankschema (Migrationen 001–021)

Alle Migrationen liegen unter `migrations/` und sind in `schema.sql` gespiegelt.
Ausführung: manuell im Supabase SQL Editor.

### 2.1 Schüler-Onboarding-Pipeline

**Basis-Tabellen (vor Migration 011):**

`profiles` — erweitert `auth.users`
- `id uuid` (PK, FK → auth.users), `email text`, `role text` (student|parent|coach|admin), `full_name text`, `created_at timestamptz`
- Hilfsfunktion: `get_my_role()` (SECURITY DEFINER, vermeidet RLS-Rekursion)

`students`
- `id uuid` (PK), `profile_id uuid` (→ profiles), `class_level integer` (5–13), `school_name text`, `school_type text` (Gymnasium|Gesamtschule|Realschule|Hauptschule)
- Hilfsfunktionen (Migration 011): `get_my_student_id()`, `is_parent_of_student(p_student_id uuid)` — beide SECURITY DEFINER

`parent_student` — Eltern-Kind-Verknüpfung
- PK: `(parent_id, student_id)`, beide → profiles

`subjects` — vorbefüllt: Mathematik, Deutsch, Englisch

`student_subjects` — PK: `(student_id, subject_id)`

**Migration 012 — `leads`**
- `id`, `full_name text NOT NULL`, `contact_email`, `contact_phone`, `class_level`, `school_type`, `school_name`, `subjects text[]`, `goal text` (IMPROVE_GRADES|CLOSE_GAPS|EXAM_PREP|GENERAL), `known_weak_topics text[]`, `source`, `status text` (new→contacted→onboarding_scheduled→converted→rejected), `owner_id uuid → profiles`, `notes`, `converted_student_id uuid → students`, `contacted_at`, `onboarding_scheduled_at`
- Indizes: `leads_status_idx`, `leads_owner_idx`

**Migration 013 — `intake_sessions`**
- `id`, `student_id → students`, `lead_id → leads`, `coach_id → profiles`, `conducted_at`, `goals`, `motivation`, `learning_history`, `parent_expectations`, `known_weak_topics text[]`, `agreed_next_steps`, `notes`, `status text` (draft|final)
- Index: `intake_sessions_student_idx`

**Migration 015 — `tiers` + `student_subscriptions`**

`tiers`:
- `id`, `name text UNIQUE`, `price_cents integer`, `features jsonb`, `sort_order integer`, `active boolean`
- Seed: Basic (8900ct), Standard (12900ct), Premium (16900ct)

`student_subscriptions`:
- `id`, `student_id → students`, `tier_id → tiers`, `status text` (active|paused|cancelled), `started_at`, `ended_at`

**Migration 016 — `student_coach`**
- PK: `(student_id, coach_id)`, `assigned_at`, `active boolean`
- Index: `student_coach_coach_idx`

**Migration 021 — `app_provision_student` (atomare RPC)**

Signature:
```sql
app_provision_student(
  p_student_uid uuid, p_student_email text,
  p_parent_uid uuid, p_parent_email text,
  p_full_name text, p_class_level integer,
  p_school_type text, p_school_name text,
  p_subjects text[], p_coach_id uuid,
  p_tier_id uuid, p_lead_id uuid
) RETURNS uuid
```
SECURITY DEFINER, nur `service_role` darf ausführen (REVOKE ALL FROM public/anon/authenticated).
Ablauf: profiles insert (Schüler + optional Eltern) → students insert → parent_student → student_subjects (mit Exception bei unbekanntem Fach) → student_coach → student_subscriptions → leads UPDATE (status='converted', converted_student_id).
Gibt `v_student_id uuid` zurück.

### 2.2 Lernbetrieb-Schema

**Migration 014 — `screening_tests` + `screening_ratings`**

`screening_tests`:
- `id`, `student_id → students`, `subject text`, `status text` (in_progress|completed|aborted), `coach_id → profiles`, `coach_note`, `generated_test jsonb`, `generated_test_version smallint default 1`, `result_summary jsonb`, `estimated_total_minutes integer`, `started_at`, `completed_at`
- Unique-Index: `(student_id, subject) WHERE status = 'in_progress'` (nur ein aktiver Test pro Fach)
- `behavior_snapshots` erhält FK `screening_test_id uuid → screening_tests`

`screening_ratings` (append-only — kein UPDATE-, kein DELETE-Policy):
- `id`, `behavior_snapshot_id → behavior_snapshots`, `screening_test_id → screening_tests`, `rating smallint` (1|2|3|4), `coach_id → profiles`

**Migration 017 — `coaching_sessions` + `session_students`**

`coaching_sessions`:
- `id`, `coach_id → profiles`, `room text`, `scheduled_at timestamptz NOT NULL`, `status text` (upcoming|active|done)
- Indizes: `coaching_sessions_coach_idx`, `coaching_sessions_scheduled_idx`

`session_students`:
- PK: `(session_id, student_id)`, `attendance text` (present|absent|unknown)
- Index: `session_students_student_idx`

**Migration 018 — `student_task_progress`**
- PK: `(student_id, task_id)`, `completed_at timestamptz default now()`
- Index: `student_task_progress_student_idx`

### 2.3 Gamification & Elternreports

**Migration 019 — `student_progress` + `xp_events`**

`student_progress`:
- PK: `student_id uuid → students`, `xp_total integer default 0`, `streak_days integer default 0`, `level integer default 1`, `last_activity timestamptz`

`xp_events` (append-only — kein UPDATE-, kein DELETE-Policy):
- `id`, `student_id → students`, `task_id → tasks`, `xp integer`, `reason text`
- Index: `xp_events_student_idx`
- Trigger `xp_events_apply` (AFTER INSERT): ruft `apply_xp_event()` auf

Trigger-Logik `apply_xp_event()` (PLPGSQL, SECURITY DEFINER):
- Bei erstem XP-Event: INSERT in student_progress, level = 1 + (xp / 500)
- Bei folgendem Event: Streak-Logik (heute = kein Increment, gestern = +1, sonst = reset auf 1)
  UPDATE student_progress: xp_total + new.xp, level neu berechnet, streak_days, last_activity = now()

**Migration 020 — `parent_reports`**
- `id`, `student_id → students`, `period_start date`, `period_end date`, `summary jsonb`, `coach_note text`, `status text` (draft|published), `published_at timestamptz`
- Index: `parent_reports_student_idx`
- Policy: Eltern/Schüler sehen nur published-Reports

### 2.4 RLS-Policies

**Allgemeines Muster:**
- Nicht-rekursive Policies via Security-Definer-Helfer (`get_my_role()`, `get_my_student_id()`, `is_parent_of_student()`)
- Coach/Admin erhalten `for all using(get_my_role() in ('coach','admin'))` mit gleichem `with check`
- Append-only-Tabellen (`xp_events`, `screening_ratings`) haben ausschließlich INSERT + SELECT Policies — keine UPDATE/DELETE

**Policy-Übersicht nach Tabelle:**

| Tabelle | Student | Eltern | Coach/Admin |
|---|---|---|---|
| profiles | eigenes Profil | eigene Kinder | alle |
| students | eigenes | via is_parent_of_student | alle (for all) |
| leads | — | — | alle (for all) |
| intake_sessions | — | read via is_parent_of_student | alle (for all) |
| screening_tests | eigene (select) | via is_parent_of_student | alle (for all) |
| screening_ratings | eigene Tests (select) | via Tests | insert+select |
| tiers | authenticated read | authenticated read | write |
| student_subscriptions | eigene (select) | via is_parent_of_student | alle |
| student_coach | eigene (select) | via is_parent_of_student | admin: all |
| coaching_sessions | via session_students | — | coach: rw eigene; admin: all |
| session_students | eigene | via is_parent_of_student | coach: rw; admin: all |
| student_task_progress | eigene (rw) | via is_parent_of_student | select |
| student_progress | eigene (select) | via is_parent_of_student | select |
| xp_events | insert+select eigene | via is_parent_of_student | select |
| parent_reports | published only | published only | alle (for all) |

---

## 3. Supabase Lib-Layer

### 3.1 Architektur-Prinzipien

- Alle Supabase-Aufrufe ausschließlich in `src/lib/supabase/` — niemals direkt in Komponenten oder Pages
- Rückgabetyp durchgängig `SupabaseResult<T>` (`{ data: T | null, error: string | null }`) mit try/catch
- Timestamps: `new Date().toISOString()` für Inserts
- Client: `src/lib/supabase/client.ts` — exportiert das zentrale `supabase`-Objekt

### 3.2 Funktions-Inventar

**L1 — `leads.ts`** (91 Zeilen)
- `getLeads()` → `SupabaseResult<Lead[]>`
- `createLead(input)` → `SupabaseResult<Lead>`
- `updateLeadStatus(id, status, extra?)` → `SupabaseResult<Lead>`

**L1 — `students.ts`** (133 Zeilen)
- `getStudents()` → `SupabaseResult<Student[]>`
- `getStudentById(id)` → `SupabaseResult<Student>`
- `listStudentsWithName()` — mit JOIN auf profiles für Anzeigenamen
- Fach-Mapping: subject-Namen → UUIDs

**L1 — `profiles.ts`** (41 Zeilen)
- `getCoaches()` → `SupabaseResult<Profile[]>` — alle profiles mit role='coach'
- `getProfileById(id)`

**L2 — `intake.ts`** (77 Zeilen)
- `createIntakeSession(input)` → `SupabaseResult<IntakeSession>`
- `updateIntakeSession(id, patch)` → `SupabaseResult<IntakeSession>`
- `getIntakeSessionByStudent(studentId)` → `SupabaseResult<IntakeSession>`

**L2 — `subscriptions.ts`** (65 Zeilen)
- `getSubscriptionByStudent(studentId)` → `SupabaseResult<StudentSubscription>`
- `createSubscription(studentId, tierId)` → `SupabaseResult<StudentSubscription>`

**L2 — `studentCoach.ts`** (65 Zeilen)
- `assignCoach(studentId, coachId)` → `SupabaseResult<void>`
- `getCoachByStudent(studentId)` → `SupabaseResult<Profile>`

**L3 — `screening.ts`** (146 Zeilen)
- `createScreeningTest(studentId, subject, coachId?)` → `SupabaseResult<ScreeningTest>`
- `getActiveScreeningTest(studentId, subject)` → `SupabaseResult<ScreeningTest | null>`
- `saveGeneratedTest(testId, generated_test)` → `SupabaseResult<void>`
- `completeScreeningTest(testId, result_summary)` → `SupabaseResult<void>`
- `getScreeningTestsByStudent(studentId)` → `SupabaseResult<ScreeningTest[]>`

**L3 — `screeningRatings.ts`** (49 Zeilen)
- `createScreeningRating(input)` → `SupabaseResult<ScreeningRating>` (append-only)
- `getRatingsByTest(screeningTestId)` → `SupabaseResult<ScreeningRating[]>`

**L4 — `sessions.ts`** (105 Zeilen)
- `getSessionsByCoach(coachId)` → `SupabaseResult<CoachingSession[]>`
- `getUpcomingSession(coachId)` → `SupabaseResult<CoachingSession | null>`
- `createSession(input)` → `SupabaseResult<CoachingSession>`
- `updateAttendance(sessionId, studentId, attendance)` → `SupabaseResult<void>`
- `getSessionStudents(sessionId)` → `SupabaseResult<SessionStudent[]>`

**L4 — `taskProgress.ts`** (43 Zeilen)
- `markTaskComplete(studentId, taskId)` → `SupabaseResult<void>`
- `getCompletedTasks(studentId)` → `SupabaseResult<string[]>` (task_ids)

**L4 — `progress.ts`** (69 Zeilen)
- `getStudentProgress(studentId)` → `SupabaseResult<StudentProgress>`
- `insertXpEvent(studentId, xp, reason, taskId?)` → `SupabaseResult<void>` (Trigger kümmert sich um student_progress)

**L4 — `parentReports.ts`** (64 Zeilen)
- `getPublishedReports(studentId)` → `SupabaseResult<ParentReport[]>`
- `createReport(input)` → `SupabaseResult<ParentReport>` (coach/admin only)
- `publishReport(reportId)` → `SupabaseResult<void>`

**Weitere:**
- `tiers.ts` (60 Zeilen): `getTiers()`, `upsertTier(input)`, `deleteTier(id)`
- `tasks.ts` (342 Zeilen): CRUD für tasks, Filter, Diagnostic-Felder, Asset-Verknüpfung
- `storage.ts` (40 Zeilen): Task-Asset-Upload/Download via Supabase Storage
- `behavior.ts` (39 Zeilen): `insertBehaviorSnapshot()` (erweitert um `screening_test_id`-FK)
- `auth.ts` (52 Zeilen): Login, Logout, Session-Management
- `provision.ts` (39 Zeilen): Edge-Function-Client-Wrapper (siehe Abschnitt 4)

---

## 4. Edge Function: provision_student

**Datei:** `supabase/functions/provision_student/index.ts`
**Deploy:** `supabase functions deploy provision_student`
**Runtime:** Deno, Supabase Edge Functions
**Auth:** Service-Role-Key wird vom Runtime injiziert (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
**Zugriff:** Ausschließlich via `src/lib/supabase/provision.ts` — niemals direkt aus Komponenten

### 4.1 Ablauf

1. OPTIONS-Preflight beantworten (CORS-Headers)
2. Request-Body validieren (`full_name` Pflichtfeld)
3. Service-Role-Client erstellen (`autoRefreshToken: false`, `persistSession: false`)
4. Schüler-E-Mail normalisieren: wenn leer → `student.<uuid>@edvance.invalid`
5. **Schritt 1 — Schüler-auth-User anlegen:** `admin.auth.admin.createUser()` mit `email_confirm: true` und zufälligem Passwort (`crypto.randomUUID() + crypto.randomUUID()`)
6. **Schritt 2 — optionaler Eltern-Invite:** falls `parent_email` vorhanden → `admin.auth.admin.inviteUserByEmail()`. Bei Fehler: Schüler-User wieder löschen, 502 zurückgeben
7. **Schritt 3 — atomarer DB-Teil:** `admin.rpc('app_provision_student', {...})` mit allen 12 Parametern
8. **Schritt 4 — Cleanup bei RPC-Fehler:** `deleteUser(studentUid)` + `deleteUser(parentUid)`, 400 zurückgeben
9. Erfolg: `json(200, { student_id: data })`

### 4.2 Parameter & Return

**Request Body (`Body`-Typ):**
```typescript
{
  lead_id?: string | null
  full_name: string           // Pflichtfeld
  student_email?: string | null
  parent_email?: string | null
  class_level?: number | null
  school_type?: string | null  // Gymnasium|Gesamtschule|Realschule|Hauptschule
  school_name?: string | null
  subjects?: string[]          // Fach-Namen, z.B. ["Mathematik","Englisch"]
  coach_id?: string | null
  tier_id?: string | null
}
```

**Response (Erfolg):** `{ student_id: string }` (UUID des neu angelegten students-Eintrags)
**Response (Fehler):** `{ error: string }` mit HTTP-Status 400/502

**Client-Wrapper (`src/lib/supabase/provision.ts`):**
```typescript
export type ProvisionInput = { /* identisch mit Body */ school_type?: SchoolKind | null }
export async function provisionStudent(
  input: ProvisionInput
): Promise<SupabaseResult<{ student_id: string }>>
```
Ruft `supabase.functions.invoke('provision_student', { body: input })` auf und normalisiert den Return auf `SupabaseResult<T>`.

---

## 5. UI-Screens & Komponenten

### 5.1 Admin-Screens

**`/admin` — `AdminDashboard.tsx`** (237 Zeilen)
- KPI-StatCards (Gesamtschüler, aktive Sessions, offene Leads, Conversion-Rate)
- Schnellzugriff-Kacheln via `DashboardTiles`
- Schüler anlegen via `provisionStudent()` direkt aus Dashboard

**`/admin/leads` — `LeadsPage.tsx`** (382 Zeilen)
- Lead-Erfassung (Formular: Name, E-Mail, Telefon, Klasse, Schultyp, Fächer, Ziel)
- Lead-Liste mit Status-Workflow (new → contacted → onboarding_scheduled → converted/rejected)
- "In Schüler konvertieren"-Button löst `provisionStudent()` aus → `converted_student_id` gesetzt

**`/admin/tiers` — `TiersPage.tsx`** (210 Zeilen)
- Tarif-Verwaltung aus DB-Katalog (`tiers`-Tabelle)
- CRUD: Tarif erstellen, Preis/Features bearbeiten, deaktivieren
- Ersetzt frühere Hardcode-TIERS-Konstante vollständig

**`/admin/diagnostics` — `DiagnosticsPage.tsx`** (427 Zeilen)
- Oberfläche zum manuellen Seeden von Diagnostic-Content
- Nutzt `updateTaskDiagnostic()` + `createDiagnosticTask()` aus `src/lib/supabase/tasks.ts`
- Für Befüllung von `tasks.is_diagnostic=true` (aktuell noch offen)

**`/admin/lambacher` — `LambacherPreview.tsx`** (208 Zeilen)
- Vorschau des Lambacher-Schweizer-8-Imports (Phase 3 Asset-Generator)

### 5.2 Coach-Screens

**`/coach` — `CoachDashboard.tsx`** (312 Zeilen)
- Echte Daten: `getSessionsByCoach()`, `getUpcomingSession()`, `listStudentsWithName()`
- Nächste Session mit Schülerliste + Anwesenheits-Tracking
- Schnellzugriff-Kacheln (Erstgespräch, Screening starten, Schülerliste)
- MOCK_SESSIONS und MOCK_COACHES vollständig entfernt (U1, U7)

**`/coach/intake` — `IntakePage.tsx`** (324 Zeilen)
- Erstgespräch-Protokoll (6 Felder: goals, motivation, learning_history, parent_expectations, known_weak_topics, agreed_next_steps)
- Status: draft → final via `updateIntakeSession()`
- Coach wählt Schüler aus Liste, Protokoll wird in `intake_sessions` gespeichert

**`/coach/cluster` — `ClusterView.tsx`** (274 Zeilen) — student-seitig zugänglich
- Fortschritt aus `student_task_progress` (U8, war localStorage)
- Cluster-Ansicht nach Kompetenzbereich (NRW Klasse 8 Mathe-Taxonomie)
- MasteryBar pro Cluster-Item

### 5.3 Schüler-Screens

**`/student` — `StudentDashboard.tsx`** (419 Zeilen)
- XP + Streak aus `student_progress` (U9)
- XPBar-Komponente live (Level berechnet aus DB-Wert)
- Schnellzugriff-Kacheln (Aufgaben, Screening, Cluster)
- EmptyState wenn kein Fortschritt vorhanden

**`/student/task-player` — `TaskPlayer.tsx`** (357 Zeilen)
- Aufgaben-Player mit `TaskAnswerArea` (MC, Matching, Steps, Draw)
- XP-Gutschrift via `insertXpEvent()` nach Abschluss → Trigger aktualisiert `student_progress`
- Kind-seitiges Feedback: kein Korrekt/Falsch-Indikator (CLAUDE.md §6)

**`/student/widget-demo` — `TaskWidgetDemo.tsx`** (193 Zeilen)
- Demo aller Input-Widgets ohne Login-Pflicht (aus Phase 2)

**`/diagnosis` — `DiagnosisSession.tsx`** (764 Zeilen) + **`DiagnosisResult.tsx`** (946 Zeilen)
- Diagnose-Engine de-mockt (U5a/b): echter Generator + echter Task-Content aus DB
- `mockDiagnosisTasks.ts` gelöscht
- Screening-Modus (`/screening`): DB-persistiert via `createScreeningTest`, DB-Resume via `getActiveScreeningTest`
- `behavior_snapshots` mit `screening_test_id`-FK
- localStorage vollständig entfernt aus `DiagnosisContext` (nur ThemeContext bleibt localStorage)

**Hinweis:** Beide Diagnose-Dateien überschreiten 400 Zeilen (DiagnosisSession 764, DiagnosisResult 946) — Refactor empfohlen.

### 5.4 Eltern-Screens

**`/parent` — `ParentDashboard.tsx`** (145 Zeilen)
- Echte Kind-Daten via `getStudentProgress()` + `getPublishedReports()` (U10)
- Zeigt XP, Level, Streak, letzten Bericht
- Vor/Nachher-Vergleich aus `parent_reports.summary` (jsonb)
- Coach-Zitat mit `AvatarInitials`-Komponente

### 5.5 Demo/Showcase-Screens

**`/showcase` (implizit) — `DesignShowcase.tsx`** (478 Zeilen)
- Vollständige Komponentenbibliothek: EdvanceCard (alle Varianten), EdvanceBadge, MasteryBar, XPBar, StatCard, EmptyState, LoadingPulse, ToastBanner
- Neue Gruppe „Emotionale Momente" (Phase 7): Level-Up-Türkis, Moment-Levelup, Repair, Boss-Grün, Streak-Rot, Moment-Bühne
- Gamification-Gruppe: vereinheitlichtes Gold

**`/demo/design` — `DesignDemo.tsx`** (113 Zeilen)
- Live-Szenarien aus Phase 1: 5 Szenarien + UI-Kit Showcase

**`/demo/scenarios` — `ScenarioUIKit.tsx`** + `ScenarioStudent.tsx`**
- ScenarioCelebration: Level-Badge mit `--gradient-levelup` + `--shadow-glow-levelup` auf Navy-Bühne

**`/demo/widgets` — `TaskWidgetDemo.tsx`**
- MC, Zuordnung, Schritte ohne Login-Pflicht

### 5.6 Wiederverwendbare Komponenten

**`src/components/edvance/index.tsx`** (560 Zeilen) — Kern-Komponentenbibliothek:

| Komponente | Props (Auswahl) | Beschreibung |
|---|---|---|
| `EdvanceCard` | variant (default\|raised\|navy\|blue-pale\|hero\|glass\|premium), accent (none\|left-primary\|left-success\|left-warning\|left-destructive) | Basis-Card, niemals rohe `<div>` |
| `EdvanceBadge` | variant (primary\|success\|warning\|destructive\|muted\|xp\|streak\|levelup\|repair) | Status- und Gamification-Badges |
| `MasteryBar` | level (1–10), showLabel, size (sm\|md\|lg) | Kompetenzfortschritt, animiert via CSS-Transition |
| `XPBar` | current, max, level, levelName | XP-Fortschritt mit Shimmer-Animation + bounce-pop |
| `StatCard` | value, label, icon, trend, color | KPI-Anzeige mit Trend-Badge |
| `AvatarInitials` | name, size (sm\|md\|lg), color | Deterministische Farbe aus name-Hash |
| `ProgressStep` | steps, current | Onboarding-Stepper |
| `EmptyState` | icon, title, description, action | Pflicht bei leeren Zuständen |
| `LoadingPulse` | lines, type (card\|list\|stat) | Skeleton-Loader, immer bei Ladezuständen |
| `ToastBanner` | type (success\|xp\|levelup\|warning\|error), message, xpAmount, onClose | Auto-close nach 2.7s + Slide-Animation |

**`src/components/edvance/DashboardTiles.tsx`**
- `DashboardTiles({ tiles: DashboardTile[] })` — Grid 1/2/3-spaltig
- `DashboardTile`: `{ to, icon, title, description, anchor? }`
- `anchor=true` → `<a href>` (Anker), sonst React-Router `<Link>`
- Icon-Background via `color-mix(in srgb, var(--primary) 12%, transparent)` (Inline-Style, berechtigt: dynamisch berechnet)
- Touch-Target: `min-h-[44px]` auf dem Link-Wrapper

**`src/components/edvance/tasks/` — Task-Komponenten:**
- `TaskAnswerArea` — Input-Dispatcher (MC → MCWidget, Matching → MatchingWidget, Steps → StepsWidget, Draw → DrawCanvas)
- `MCWidget` — Multiple-Choice ohne Korrekt/Falsch-Feedback
- `MatchingWidget` — Zuordnungs-Widget
- `StepsWidget` — Schrittweise Lösungsführung
- `TaskAssetEditor` — Upload-Pipeline (Storage + RLS)
- `TaskFilterBar` — Aufgaben-Filter nach Cluster, Niveau, Typ
- `TaskMetaRow` — Metadaten-Zeile (Klasse, Quelle, Typ)
- `TaskPedagogyAccordion` — Didaktische Hinweise aufklappbar
- `TaskPreviewCard` — Preview-Card mit Cognitive-Hero + Sub-Task-Split
- `TaskQuestionBlock` — Frageblock mit Sub-Task-Split

**`src/components/edvance/onboarding/` — Onboarding-Schritte:**
- `StepIndicator`, `StudentDataStep`, `SubjectsStep`, `CoachStep`, `TierStep`, `SummaryStep`

**`src/components/edvance/` — Weitere:**
- `EdvanceNavbar` — Navbar mit eingebettetem `EdvanceLogo`
- `DrawCanvas` — Freihand-Zeichnen für DRAW-Aufgaben
- `MathToolbar` — Mathematik-Eingabehilfe
- `ProtectedRoute` — Auth-Guard via `useAuth()`; Rollen-Check nie direkt in Pages
- `ThemePanel` — Theme-Switcher (nutzt localStorage, bewusst)

---

## 6. Offene Punkte & Nächste Schritte

### Kritisch (blockiert produktiven Betrieb)

1. **Diagnostik-Content-Seeding** — `tasks.is_diagnostic=true`-Einträge fehlen → `/screening` zeigt korrekten EmptyState, ist aber nicht nutzbar. Lösung: Seed-Script oder manueller Import via `/admin/diagnostics`.

### Verifizierung ausstehend (durch Rasit)

2. **Browser-Verifikation U4** — `provisionStudent()`-Flow (Lead → Schüler) wurde nicht im Browser durchgespielt.
3. **Browser-Verifikation `/screening`** — DB-Resume-Logik (getActiveScreeningTest + rebuildRunTasks) nur TypeScript-seitig geprüft.

### Architektur / Roadmap

4. **PR #16** — Base-Branch war `main` statt `dev` (Abweichung CLAUDE.md §5). Bereits gemergt (Merge #17 als Synchronisation).
5. **Dateigröße-Überschreitungen** — `DiagnosisSession.tsx` (764 Zeilen), `DiagnosisResult.tsx` (946 Zeilen) überschreiten die 400-Zeilen-Grenze deutlich. Refactor in Sub-Komponenten empfohlen.
6. **Realtime Cross-Device** — Schüler-Tablet + Coach haben keinen Cross-Tab-Sync mehr (localStorage entfernt). Supabase Realtime-Subscriptions = eigener Folgeschritt.
7. **Mathebuch-Import** — Lambacher Schweizer 8. Klasse NRW steht noch aus (Canva-Prompts + Asset-Generator vorbereitet).
8. **Home-Quest Flow** — Schüler-seitiger Lernpfad-Einstieg noch nicht implementiert.
9. **Türkis/Repair WCAG-AA-Verifikation** — `--color-levelup #0E9E96` und `--color-moment-repair #8B5CF6` als kalibrierte Vorschläge; finale Freigabe nach visueller + WCAG-AA-Prüfung auf `/showcase`.
10. **Vollständige Streak-Repair- und Boss-Gradient-Flows** — Token, Badge, Toast vorbereitet; UI-Flows = separater Schritt.
11. **Space Grotesk** — Wordmark-Font wird als CSS-Stack referenziert, muss im Produktions-Build via Google Fonts oder self-hosted geladen werden.

---

## 7. Technische Entscheidungen & Architektur-Logik

### 7.1 Nicht-rekursive RLS via Security-Definer-Helper

Statt Inline-Subqueries in Policies (zirkuläre Referenz auf `profiles`) werden
`get_my_role()`, `get_my_student_id()` und `is_parent_of_student()` als SECURITY DEFINER
Funktionen ohne RLS-Überprüfung ausgeführt. Dies verhindert Endlosrekursion und hält
Policies wartbar.

### 7.2 Append-only-Tabellen (CLAUDE.md §6)

`behavior_snapshots`, `xp_events` und `screening_ratings` sind streng append-only.
Keine UPDATE/DELETE-Policies existieren. `student_progress` wird ausschließlich via
`apply_xp_event()`-Trigger aus `xp_events` aktualisiert — nie direkt beschrieben.
Coach-Ratings werden als separate `screening_ratings`-Zeilen gespeichert statt
`behavior_snapshots`-Spalten zu mutieren.

### 7.3 Atomare Lead→Student-Conversion

Der `provisionStudent()`-Aufruf ist zweistufig:
- **Edge Function** (service_role): auth-User-Anlage für Schüler und Eltern (anon-Key kann keine auth-User anlegen)
- **RPC `app_provision_student`** (SECURITY DEFINER, service_role only): alle DB-Inserts in einer PLPGSQL-Transaktion

Bei RPC-Fehler werden die auth-User wieder gelöscht (Cleanup-Schritt 4), sodass kein Halb-Zustand entsteht.

### 7.4 Screening = produktisierter Einstieg der Diagnose-Engine

Es gibt keine separate Screening-Engine. `/screening` nutzt denselben `DiagnosisContext` und Generator wie `/diagnosis`, aber mit:
- `createScreeningTest()` (DB-Session statt in-memory)
- Snapshot-Persistenz mit `screening_test_id`-FK
- DB-Resume via `getActiveScreeningTest()` + `rebuildRunTasks()` aus `generated_test`-jsonb
- `completeScreeningTest()` bei Abschluss

### 7.5 jsonb statt Normalisierung für generierte Inhalte

`screening_tests.generated_test` (jsonb) speichert den vollständigen generierten Test.
`screening_tests.result_summary` (jsonb) speichert die Ergebnis-Zusammenfassung.
`parent_reports.summary` (jsonb) speichert den Report-Inhalt.
Dies erlaubt flexible Schemaentwicklung ohne Schema-Migrationen für Content-Änderungen.

### 7.6 Token-Single-Source-Strategie (Phase 7)

Nach Phase 7 gilt: alle Gamification-Farben sind auf `tokens.css` als Single Source zurückgeführt.
`globals.css` enthält nur noch Legacy-Aliases via `var(--color-*)` — keine eigenen Hex-Werte außer `--streak-orange`.
Nachträgliche Farbanpassungen erfolgen ausschließlich in `tokens.css`.

### 7.7 Inline-Styles — erlaubte Ausnahmen

CLAUDE.md §4/§11 verbietet Inline-Styles für statische Werte. Erlaubte Ausnahmen im Code:
- `MasteryBar`: `style={{ width: mounted ? \`${pct}%\` : '0%', backgroundColor: color }}` — Prozentzahl ist runtime-berechnet
- `XPBar`: `style={{ width: mounted ? \`${pct}%\` : '0%' }}` — runtime-berechnet
- `StatCard`: `style={{ backgroundColor: \`color-mix(in srgb, ${color} 14%, white)\` }}` — dynamischer color-Parameter
- `DashboardTiles.tsx`: `style={{ background: ICON_BG }}` — ICON_BG ist `color-mix(in srgb, var(--primary) 12%, transparent)`, Tailwind kann color-mix nicht direkt ausdrücken
- `EdvanceLogo.tsx`: `style={{ fontFamily, fontSize, gap, ... }}` — alle Werte dynamisch von Props abhängig

### 7.8 ThemeContext bleibt localStorage

`ThemeContext` ist der einzige bewusst verbleibende localStorage-Nutzer.
Die Entscheidung ist bewusst (kosmetisch, keine pädagogischen Daten, keine Sync-Anforderung).
Alle anderen localStorage-Nutzungen wurden in U5c und U8–U10 entfernt.

### 7.9 TypeScript-Prüfung

Gemäß Retro 2026-05-16 ist der korrekte Lint-Befehl `npm run lint` (ruft `tsc -b` aus),
nicht `npx tsc --noEmit` (Solution-tsconfig hat `files:[]`). `node_modules` muss installiert sein.

