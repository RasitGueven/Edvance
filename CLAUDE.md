# Edvance – Projekt-Kontext für Claude

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (CSS-Variablen als Theme-Tokens via `@theme inline`)
- shadcn/ui Komponenten (lokal in `src/components/ui/`)
- Supabase (Auth + Postgres + RLS)
- React Router v6

## Projektstruktur

```
src/
  components/ui/   # shadcn-Komponenten (button, card, input, label, avatar, badge)
  context/         # AuthContext (user, role, loading, signIn, signOut)
  lib/             # supabase.ts, utils.ts, mockData.ts
  pages/           # Login, CoachDashboard, AdminDashboard, StudentDashboard, ParentDashboard
  styles/          # globals.css (CSS-Variablen, Tailwind v4 Theme)
```

## Auth & Rollen

- Rollen: `student | parent | coach | admin`
- Role-Fetch läuft in separatem `useEffect` (nicht im `onAuthStateChange`) – verhindert Supabase-internen Lock-Deadlock
- `ProtectedRoute` wartet mit Spinner solange `user` existiert aber `role` noch null ist
- Test-User immer über Supabase Dashboard anlegen, nie per rohem SQL-Insert (sonst NULL-Token-Fehler bei Login)

## Bekannte Fixes (nicht rückgängig machen)

- RLS-Policy `coaches_admins_see_all_profiles` nutzt `public.get_my_role()` (SECURITY DEFINER) statt direktem `profiles`-Subselect – verhindert Endlosrekursion
- Auth-Tokens in `auth.users` müssen als leerer String gesetzt sein (nicht NULL) – bei manuell angelegten Usern ggf. mit `coalesce(field, '')` fixen

---

## Edvance Design System

### Grundprinzipien

- Viel Whitespace – nie eng, nie überladen
- Klare visuelle Hierarchie: ein dominantes Element pro Abschnitt
- Keine harten Schatten – nur subtile (`shadow-sm`, `shadow-md`)
- Abgerundete Ecken: Cards `radius-xl`, Buttons `radius-lg`, Badges `radius-full`

### Typografie

- Überschriften: `font-semibold`, nie `font-bold` außer bei Zahlen/KPIs
- Fließtext: `text-sm`, Zeilenabstand `leading-relaxed`
- Labels/Captions: `text-xs`, `uppercase`, `tracking-wider`, `text-muted`
- Zahlen & Metriken: `font-bold`, `text-2xl` oder größer, Farbe aus CSS-Variablen

### Farben

- Primäre Aktionen: `var(--primary)`
- Erfolg/Positiv: `var(--success)`
- Warnung: `var(--warning)`
- Fehler: `var(--destructive)`
- Hintergründe: Wechsel zwischen `--background` und `--card` für Tiefe
- Niemals hardcodierte Hex-Werte

### Komponenten-Regeln

- Cards: immer `border border-border`, kein outline, padding `p-6`
- Buttons: primäre Aktionen solid, sekundäre `outline`, destruktive `ghost`
- Badges: immer `rounded-full`, `text-xs`, `font-semibold`
- Stat-Zahlen: groß (`text-3xl`), farbig, mit kleiner Caption darunter
- Listen: nicht table-artig – lieber Cards oder visuelle Elemente

### Was nie erlaubt ist

- Keine grauen Placeholder-Screens
- Keine langen ungroupten Formulare
- Keine Tabellen für mehr als 5 Spalten – lieber Cards
- Kein Text über 65 Zeichen Breite (`max-w-prose`)
