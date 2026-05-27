# Retro 2026-05-27 — v2 Design-System Big-Bang Migration: Abschluss

## Status
**Migration durch.** `feature/v2-migration` enthält 10 Commits, alle Phasen aus
`CLAUDE_CODE_MIGRATION_PROMPT.md` abgearbeitet (mit pragmatischen Anpassungen,
wo der Ist-Zustand des Repos von der Doku-Annahme abwich).

## Was migriert wurde (Was-Liste)

### Token-Track
- `tokens.css` komplett neu — v2-Tokenset gemäß Kapitel 5.1 der Doku:
  Primary-Midnight + 6 Grün-Kontexte + 5 Rot-Kontexte + 1 Lila-Repair + Gold-Familie
  + 5 Mastery-Stufen + Badge-Rarity + Moment-Tokens + Schatten/Radius/Timing
- `globals.css` ausgemistet: v1-`:root`-Variablen weg, `@theme inline` auf v2,
  Premium-Shadows + Gradients + `noise-overlay` entfernt
- 4 neue v2-Animationen (`animate-fly-in`, `animate-xp-float`, `animate-count-up`,
  `animate-bar-grow`) global verfügbar
- Glass-Foundations (`glass-pill/card/button`) + `light-source` + `student-hero`/`student-header`
- 38+ Code-Files: alle v1-Var-Referenzen (`--brand-navy`, `--brand-blue`,
  `--primary`, `--success`, `--destructive`, `--xp-gold`, `--streak-orange`,
  `--level-purple`, `--color-levelup`, Premium-Shadows, Gradients) auf v2-Pendants

### Komponenten-Bibliothek
- `src/components/edvance/index.tsx` (559 Z. → 31 Z. Re-Exports)
- 13 Atome in eigenen Dateien — alle < 130 Zeilen:
  - **Neu/grundlegend überarbeitet**: `EdvanceCard` (4 Varianten + 10 Akzente),
    `EdvanceBadge` (24 Varianten), `MasteryBar` (5 Stufen), `XPBar` (kein Shimmer),
    `StreakPill` (NEU), `RarityBadge` (NEU), `Modal` (NEU)
  - **Aus Monolith ausgelagert**: `StatCard`, `AvatarInitials`, `ProgressStep`,
    `EmptyState`, `LoadingPulse`, `ToastBanner`
- 3 neue Effekt-Moment-Komponenten in `src/components/edvance/moments/`:
  `LevelUpModal`, `BossChallengeModal` (+ Schatten-Variante), `StreakRepairFlow`
  (Zwei-Phasen-Komposit)

### Schema-Track (6 neue Migrationen)
- `032_two_streaks.sql` — zwei Streak-Modell + `calc_presence_multiplier()`
- `033_mastery_five_stages.sql` — SQL-Helper `mastery_stage(score)` /
  `mastery_stage_from_level(lvl)`
- `034_badge_rarity.sql` — Enums + `badge_catalog` (13 Badges: 10 MVP + 3 Klassen-Platin)
  + `student_badges` Join-Table mit RLS
- `035_streak_repair_inventory.sql` — Token-Inventory mit earned/used Tracking
- `036_drop_streak_days.sql` — Final-Cleanup, `streak_days` gedroppt

### Lib-Layer (neu/erweitert)
- `src/lib/mastery.ts` — `masteryStage(score)` + Type `MasteryStage`
- `src/lib/supabase/badges.ts` — `getBadgeCatalog`, `getStudentBadges`, `awardBadge`
- `src/lib/supabase/streakRepair.ts` — `getRepairTokens`, `useRepairToken`, `awardRepairToken`
- `src/lib/supabase/parentReports.ts` — `saveReportDraft`-Alias zugefügt
- `src/types/index.ts` — `StudentProgress` mit beiden Streak-Feldern (streak_days entfernt
  nach Migration 036); neue Types `Badge`, `StudentBadge`, `BadgeRarity`, `BadgeForm`,
  `StreakRepairInventory`

### Pages-Migrationen (alle 4 Rollen)
- **Eltern**: `ParentDashboard` (StreakPills + MasteryBar pro Fach + 4 Report-Sektionen);
  NEU `ScreeningReportPage` (`/parent/screening`)
- **Coach**: `CoachDashboard` (Inline-Style-Blocker gefixt, StatCard, Routes auf neue
  Pages); `SessionCard` ausgegliedert; NEU `ScreeningResultsPage`, `ReportsPage`
- **Schüler**: `StudentDashboard` 419→215 Z. (CLAUDE.md §4 erfüllt), gesplittet in
  `StudentDashboardHero/Filters/Clusters`, dekorative Blobs raus, zwei StreakPills im
  Glas, Skilltree-Grün-Akzente statt hardcoded CLUSTER_TINTS
- **Admin**: `AdminDashboard` Inline-Style-Blocker gefixt; 8 neue Stub-Routes
  (OnboardingPage, SchedulePage, CoachesPage, AssignmentsPage, XpRulesPage,
  ScreeningItemsPage, ScreeningItemEditorPage, ScreeningCoveragePage)
- `EdvanceLogo.tsx` Inline-Style-Blocker aus dem 2026-05-19/20/26-Review gefixt

### Demo & Showcase
- `/demo/design` Tab "v2" mit Foundations-Showcase (Animationen, Glas, Schatten,
  Mastery-Vorschau)
- 3 neue Demo-Routes in `/demo/v2/`: `kit`, `student`, `parent` (Phase 9 Doku-Vorgabe)
- `glass-card`-Bug auf hellem Hintergrund im DesignDemo gefixt (Hard Rule §3)

### Documentation
- `docs/DESIGN_SYSTEM.md` (NEU) — vollständige v2-Referenz
- `docs/retros/2026-05-27-v2-migration-start.md` (Phase 0)
- Diese Datei (Phase 9 Abschluss)

---

## Was bewusst nicht angerührt wurde

| Bereich | Begründung |
|---|---|
| BehaviorSnapshots / Diagnostik-Logik | Append-only + `is_diagnostic=true` Pfad bleibt unverändert (CLAUDE.md §6) |
| `provision_student` Edge Function | Stop-Bedingung aus Auftrag — nur via explizite Freigabe |
| Bestehende RLS-Policies | Stop-Bedingung — nur neue Policies für 034/035 angelegt |
| XP-Vergabe-System (`xp_events`, `apply_xp_event`) | Trigger bleibt; nur neue Spalten in `student_progress` ergänzt |
| Mastery-Backend-Schema | `level: 1..10` bleibt; nur Frontend-Visualisierung auf 5 Stufen |
| Coins / zweite Währung | Zurückgestellt (Auftrag) |
| Dark Mode | Zurückgestellt (Auftrag) |
| Boss-Challenge-Character als Figur | Offen, kommt später (Auftrag) |
| Klassenarbeit-Vorbereitung Spezial-Animation | Nicht spezifiziert (Auftrag) |
| WCAG-AA-Audit als formaler Audit | Nicht im Scope (Auftrag) |
| Mock-Sweep (Mocks aus Runtime entfernt) | Nicht zurückgedreht — bleibt entfernt |

---

## Adaptionen ggü. der Doku

Die Migration-Doku wurde gegen einen anderen (vermutlich späteren) Repo-Stand verfasst.
Folgende Anpassungen waren nötig:

1. **`dev`-Branch existierte nicht** → angelegt vom aktuellen Stand (`main` =
   `claude/epic-hypatia-BEdsV` = `9b4388f`); davon `feature/v2-migration` abgezweigt.
2. **`tokens-demo.css` existierte nicht** → „Datei löschen"-Schritt entfiel.
3. **`[data-design="v2"]`-Mechanismus existierte nicht** → „Demo-Scope abräumen"-Aufgabe
   reduziert auf glass-card-Bug-Fix in DesignDemo + Hinzufügen der 3 V2*-Demo-Pages.
4. **Viele in der Doku referenzierte Pages existierten nicht** (`ScreeningReportPage`,
   `IntakePage`-Varianten, `ScreeningResultsPage`, `ReportsPage`, `OnboardingPage`,
   `SchedulePage`, `CoachesPage`, `AssignmentsPage`, `XpRulesPage`,
   `ScreeningItems*Page`, V2Kit/V2Student/V2Parent) → alle als minimaler Routenstub mit
   `EmptyState` oder funktionalem Stub angelegt; die als „funktional" (Coach
   ScreeningResults/Reports, V2*-Demos, Parent-Screening) wurden voll implementiert.
5. **Migrations 022-031 Lücke**: existiert. Nummerierung folgt der Doku-Spezifikation
   (032-036) — Lücke nicht aufgefüllt.

---

## Bekannte Limits am Ende

| Bereich | Limit | Aktion |
|---|---|---|
| `src/pages/admin/DiagnosticsPage.tsx` | 427 Z. — über CLAUDE.md §4-Hard-Limit | Splitt in Folge-Session (Definition of Done #19) |
| `src/types/index.ts` | 461 Z. — über 400-Limit | Splitt in Sub-Module in Folge-Session |
| Bundle > 500 kB | Vite-Warnung | Code-Splitting per route lazy-loading in Folge-Session |
| MOCK-Daten im Eltern/Coach-Screening | Bis Screening-Result-Schema steht | Sobald Lib steht: ersetzen, im Code mit `MOCK:` markiert |
| Migrations 032-036 noch nicht in Supabase ausgeführt | Außerhalb der Code-Migration | Coach/Admin müssen sie via SQL-Editor anstoßen |

---

## Folge-Tasks (nächste Sessions)

1. **DiagnosticsPage** splitten (Limit-Verletzung)
2. **types/index.ts** in Sub-Module (`student.ts`, `parent.ts`, `coach.ts`, …) splitten
3. **WCAG-AA-Audit** der neuen Tokens (Akzent-Amber auf Weiß ist seit jeher Vorsicht)
4. **Screening-Result-Schema** + Lib (`getMasteryBySubject`, `getScreeningResultsForStudent`)
   — ersetzt MOCK-Blöcke
5. **Boss-Challenge-Character** designen (offen)
6. **Dark Mode** (zurückgestellt)
7. **Code-Splitting** (lazy routes) gegen Bundle-Größe
8. **Migrations 032-036 in Production** anstoßen (Coach/Admin)
9. **TypeScript-Tests** für `mastery.ts` und `calc_presence_multiplier`
10. **Routing-Cleanup** für die 8 Stub-Admin-Routes wenn Pages voll implementiert sind

---

## Commit-Historie auf `feature/v2-migration`

```
97434c9 docs(retro): v2 migration start retro
a2b7749 feat(v2): token cutover — single source v2, no demo scope
19836a6 feat(v2): Phase 2 — global animations, glass + light-source foundations
200beae feat(v2): Phase 3a/3b — atoms split, new v2 variants, new components
1367c52 chore(db): migrations 032-035 + Lib-Layer
44cd41a feat(v2): Phase 5 — Eltern-Flow
86f64ed feat(v2): Phase 6 — Coach-Flow
0ac5fc4 feat(v2): Phase 7 — Schüler-Flow (Moments + Dashboard-Split)
6de56c0 feat(v2): Phase 8 — Admin-Flow + 8 neue Routen
(dieser Commit) feat(v2): Phase 9 — Migration 036 + V2-Demo + Docs
```

Build durchläuft. TSC grün.
