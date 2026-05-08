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
  components/ui/       # shadcn-Komponenten (button, card, input, label, avatar, badge)
  components/edvance/  # Edvance Design System Komponenten (EdvanceCard, Badge, etc.)
  context/             # AuthContext (user, role, loading, signIn, signOut)
  lib/                 # supabase.ts, utils.ts, mockData.ts
  pages/               # Login, CoachDashboard, AdminDashboard, StudentDashboard, ParentDashboard, DesignShowcase
  styles/              # globals.css (CSS-Variablen, Tailwind v4 Theme)
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

## Brand Personality
Edvance ist warm, intelligent und ermutigend.
- Für Schüler: motivierend, spielerisch, nie kindisch
- Für Coaches: professionell, übersichtlich, effizient
- Für Eltern: vertrauenswürdig, klar, beruhigend

## Nicht verhandelbar
- Nie hardcodierte Farben – immer CSS-Variablen aus `src/styles/globals.css`
- Nie rohe divs für Cards – immer `EdvanceCard` aus `src/components/edvance`
- Nie leere States ohne `EmptyState`-Komponente
- Nie Ladezustände ohne `LoadingPulse`-Komponente
- Nie graue Placeholder-Screens
- Nie mehr als 3 verschiedene Schriftgrößen pro Screen
- Tailwind-Klassen haben Vorrang vor Inline-Styles – keine Inline-Styles außer für dynamisch berechnete Werte (z.B. Breiten in Prozentzahlen)

## Typografie-Hierarchie
- Screen-Titel: `text-2xl font-bold text-[--text-primary]`
- Section-Header: `text-xs font-semibold uppercase tracking-widest text-[--text-muted]`
- Card-Titel: `text-base font-semibold`
- Body: `text-sm leading-relaxed text-[--text-secondary]`
- Metriken/KPIs: `text-3xl font-bold` (mit Farbe je nach Kontext)
- Captions: `text-xs text-[--text-muted]`

## Spacing-Rhythmus
- Zwischen Screen-Sections: `gap-6` oder `gap-8`
- Innerhalb Cards: `p-6`
- Zwischen Cards: `gap-4`
- Zwischen Label und Element: `gap-2`
- Niemals `gap-1` oder `gap-3` für große Layouts

## Duolingo-Prinzipien die wir übernehmen
1. Jeder Erfolg wird gefeiert – XP, Badges, Animationen
2. Fortschritt ist immer sichtbar – Balken, Level, Streaks
3. Ein klarer primärer CTA pro Screen – nie zwei gleichwertige Buttons
4. Farbe hat Bedeutung – nie nur Dekoration
5. Touch-Targets sind groß – min 44px Höhe für alle interaktiven Elemente
6. Leere Zustände sind einladend – nie nur "Keine Daten"

## Per-Screen Regeln

### Schüler-Screens
- Aufgaben-Cards: weiß, großer Text, viel Luft
- Buttons: groß, rund (`rounded-xl`), primary-filled
- Feedback: nur positiv oder neutral – nie rot für falsche Antworten
- Gamification-Elemente immer sichtbar: XP-Bar, aktueller Streak

### Coach-Screens
- Dashboard: Navy-Header, weiße Cards, klare Datenhierarchie
- Status-Farben: grün=gut, gelb=aufmerksam, rot=sofort handeln
- Live-Daten: immer mit Timestamp oder "gerade eben"
- Interventions-Button: immer rot, immer prominent

### Eltern-Screens
- Vor/Nachher immer als Vergleich – nicht nur aktuelle Daten
- Positive Entwicklungen prominent, Probleme sachlich formuliert
- Coach-Zitat immer persönlich – mit Name und Avatar

## Komponenten-Entscheidungsbaum
| Bedarf | Komponente |
|--------|-----------|
| Metriken anzeigen | `StatCard` |
| Liste von Objekten | `EdvanceCard` pro Item, nie `<table>` |
| Status zeigen | `EdvanceBadge` |
| Fortschritt zeigen | `MasteryBar` oder `XPBar` |
| Ladezeit überbrücken | `LoadingPulse` |
| Nichts vorhanden | `EmptyState` |
| Erfolgsmeldung | `ToastBanner` type xp oder success |
| Onboarding-Fortschritt | `ProgressStep` |
| Nutzer-Identität | `AvatarInitials` |

## Verbotene Patterns
❌ Tabellen mit mehr als 4 Spalten  
❌ Modals für einfache Bestätigungen – lieber Inline  
❌ Text-Links als primäre Aktionen  
❌ Disabled Buttons ohne Tooltip warum  
❌ Mehr als 2 CTAs pro Card  
❌ Alerts/Banners die den Content verschieben  
❌ Hardcodierte Hex-Farben  
❌ Inline-Styles für statische Werte  
