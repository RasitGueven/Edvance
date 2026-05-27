# Edvance Design System v2

> **Stand:** 27.05.2026 · **Single Source of Truth** für alle Visual-Entscheidungen.
> Spezifische Tokens leben in [`src/styles/tokens.css`](../src/styles/tokens.css).
> Glas-/Hero-/Animations-Klassen in [`src/styles/globals.css`](../src/styles/globals.css).

---

## 1. Brand-Personality

Edvance ist **warm, intelligent und ermutigend**.
- Für Schüler: motivierend, spielerisch, nie kindisch
- Für Coaches: professionell, übersichtlich, effizient
- Für Eltern: vertrauenswürdig, klar, beruhigend

## 2. Token-Familie

### 2.1 Primär — Midnight Academy
- `--color-primary` `#334D7A` (Brand-Blau, ersetzt v1-Navy `#1B2A3E`)
- `--color-primary-hover` `#253D6A`
- `--color-primary-light` `#EEF2F8`

### 2.2 Hintergrund
- `--color-bg-app` `#F7F7F5` (App-Hintergrund, warmes Off-White)
- `--color-bg-surface` `#FFFFFF`
- `--color-bg-subtle` `#EFEFED`
- `--color-border` `#E8E8E5`

### 2.3 Text
- `--color-text-primary` `#1A1A18`
- `--color-text-secondary` `#4A4A47`
- `--color-text-tertiary` `#888884`
- `--color-text-link` `#334D7A`

### 2.4 Akzent — Streak-Aktiv-Amber
- `--color-accent` / `--color-accent-streak` `#E8A020`
- `--color-accent-streak-light` `#FEF9EE`

### 2.5 Gold-Familie (Alltags-XP + Warnung)
- `--color-gold-altgold` `#D4A843` — XP-Bar-Verlauf-Start, Level-Avatar
- `--color-gold-champagner` `#E8D5A3` — XP-Bar-Verlauf-Ende
- `--color-gold-warning` `#C87E00` — Warnungen
- `--color-gold-warning-light` `#FEF3E2`

### 2.6 Grün-Familie (6 Kontexte)
| Token | Hex | Kontext |
|---|---|---|
| `--color-success` | `#2A8A4A` | Mastered dauerhaft |
| `--color-success-eltern` | `#3AAF6A` | Stärken Eltern |
| `--color-success-answer` | `#27AE60` | Richtige Antwort |
| `--color-success-grow` | `#5DD68C` | Wachsender Balken |
| `--color-success-celebration` | `#1DB954` | Boss-Challenge |
| `--color-success-skilltree` | `#22C55E` | Skill-Tree freigeschaltet |

### 2.7 Rot-Familie (5 Kontexte)
| Token | Hex | Kontext |
|---|---|---|
| `--color-error-gap` | `#C03030` | Lücken Eltern (leise) |
| `--color-error-answer` | `#E88080` | Falsche Antwort (Schüler) |
| `--color-error-exam` | `#C83232` | Klassenarbeit-Warnung |
| `--color-error-streak` | `#E03535` | Streak-Verlust (laut, kurz) |
| `--color-error-coach` | `#B91C1C` | Notfall Coach |

### 2.8 Lila — Streak-Repair
- `--color-repair` `#7B5EA7` · `--color-repair-light` `#F0EAFA` · `--color-repair-surface` `#F5F0FC`

### 2.9 Mastery-Stufen (5)
| Score | Stufe | Token | Hex |
|---|---|---|---|
| 0–39  | Introduced  | `--color-mastery-introduced`  | `#B8B8B4` |
| 40–59 | Developing  | `--color-mastery-developing`  | `#F39C12` |
| 60–74 | Progressing | `--color-mastery-progressing` | `#9DB84D` |
| 75–84 | Proficient  | `--color-mastery-proficient`  | `#27AE60` |
| 85–100| Mastered    | `--color-mastery-mastered`    | `#2A8A4A` |

Frontend-Helper: [`src/lib/mastery.ts`](../src/lib/mastery.ts) (`masteryStage(score)`).
SQL-Helper: `public.mastery_stage(score)` / `public.mastery_stage_from_level(lvl)`.

### 2.10 Badge-Rarity
| Token | Hex |
|---|---|
| `--color-badge-bronze` | `#A0714A` |
| `--color-badge-silver` | `#8A9BB0` |
| `--color-badge-gold` | `#C49A2A` |
| `--color-badge-platinum-*` | Conic-Gradient `#FFD2A8 → #D6A8FF → #A8E0FF` |
| `--color-badge-center` | `#2A3A5A` (Innen-Navy) |

### 2.11 Schatten (blau getönt)
- `--shadow-xs` · `--shadow-md` · `--shadow-lg` · `--shadow-xl` — alle mit `rgba(51,77,122,…)` Tint
- Premium-Shadows (`--shadow-premium-*`, `--shadow-glow-*`) sind in v2 abgeschafft.

### 2.12 Rundungen
- `--radius-sm` 6px · `--radius-md` 10px · `--radius-lg` 14px · `--radius-xl` 20px · `--radius-full`

### 2.13 Timing
- `--duration-instant` 100ms · `--duration-fast` 150ms (Eltern-Standard) · `--duration-base` 200ms (Schüler) · `--duration-slow` 350ms · `--duration-celebration` 500ms
- `--ease-bounce` (cubic-bezier 0.34, 1.56, 0.64, 1) · `--ease-out` (cubic-bezier 0.16, 1, 0.3, 1)

---

## 3. Hard Rules (8, nicht verhandelbar)

1. `--color-accent` (`#E8A020`) **NIE** als Textfarbe auf weißem Hintergrund — WCAG fail.
2. Celebration-Farben (`--color-moment-*`) **nur** in Animations-Modals, **max. 3 Sekunden** sichtbar.
3. Glaseffekte (`glass-pill/card/button`) **ausschließlich** auf dunklem Hintergrund (`student-header`, `student-hero`, Modal-Bühne).
4. Level-Up und Boss-Challenge max. **1× pro Session** triggern.
5. Streak-Verlust (`#E03535`) erscheint kurz — direkt danach Repair-Angebot in Lila (`#7B5EA7`).
6. Mastered-Status (`#2A8A4A`) kann **nur** in einer Präsenz-Session vergeben werden — kein visuelles Mastered-Label ohne Coach-Bestätigung im Backend.
7. Alle Schatten verwenden die blauen Variablen (`--shadow-xs/md/lg/xl`) — kein neutrales Grau.
8. Rundungen immer aus dem Token-System (`--radius-*`) — kein hardcodiertes `rounded-full` außer für echte Kreise.

---

## 4. Energie-Differenzierung Rolle → UI

| Aspekt | Eltern | Schüler | Coach |
|---|---|---|---|
| Animations-Standard | `--duration-fast` (150ms), `--ease-out` | `--duration-base` (200ms), `--ease-bounce` erlaubt | `--duration-fast` |
| Verlauf-Hero | nein | `student-hero` + Light-Source | nein |
| Glaseffekte | nein | ja, nur auf dunklen Flächen | nein |
| Emotionale Moment-Modals | nein | ja (Level-Up, Boss, Streak-Repair) | nein |
| Grün-Standard | `success-eltern` | `success-answer` (richtig) / `success-grow` (Balken) / `success` (mastered) | `success-eltern` |
| Rot-Standard | `error-gap` (leise) | `error-answer` / `error-streak` | `error-coach` (Notfall) / `error-exam` (KA) |

---

## 5. Streak-System (zwei unabhängige Streaks)

| Aspekt | Präsenz-Streak | Home-Streak |
|---|---|---|
| Einheit | Kalenderwoche | Zwischen 2 Sessions |
| Trigger | Mind. 1 Präsenz-Session in der Woche | Alle Tasks der Post-Session erledigt |
| Farbe | `--color-accent-streak` `#E8A020` auf `--color-accent-streak-light` | `--color-primary` auf `--color-primary-light` |
| Icon | `Flame` (lucide) | `Home` |
| DB-Feld | `presence_streak_weeks` | `home_streak_sessions` |
| Ferien | eingefroren, opacity 0.75, `Snowflake`-Icon, **kein Reset** | gleich |
| Multiplikator | 3 W ×1.10 · 5 W ×1.20 · 8 W ×1.30 (`calc_presence_multiplier`) | kein Multiplikator |

Komponente: [`StreakPill`](../src/components/edvance/StreakPill.tsx).

---

## 6. Komponenten-Bibliothek

### 6.1 Atome (`src/components/edvance/`)
- **`EdvanceCard`** — 4 Varianten (`default` | `subtle` | `hero-student` | `hero-parent`), 10 Akzente
- **`EdvanceBadge`** — 24 Varianten (Rot 5 + Grün 4 + XP/Streak 4 + Mastery 5 + Sonstige 6)
- **`MasteryBar`** — 5 Stufen via Score 0-100 (legacy Level 1-10 als `level`-Prop)
- **`XPBar`** — Altgold→Champagner-Verlauf, einmaliger `animate-xp-float` (kein Endlos-Shimmer)
- **`StreakPill`** — presence / home, mit Ferien-Snowflake und Multiplikator-Suffix
- **`RarityBadge`** — bronze / silver / gold / platinum × round / shield
- **`StatCard`**, **`AvatarInitials`**, **`ProgressStep`**, **`EmptyState`**, **`LoadingPulse`**, **`ToastBanner`**, **`Modal`**

### 6.2 Effekt-Momente (`src/components/edvance/moments/`)
- **`LevelUpModal`** — Midnight-Navy + Champagner-Krone + Altgold-XP-Badge, Auto-Dismiss 3s
- **`BossChallengeModal`** — 4s-Verlauf-Animation, moment-boss-green Text, Altgold-Sterne, Schatten-Variante
- **`StreakRepairFlow`** — Zwei-Phasen (Rot ~1.8s → Lila-Repair-Offer)

### 6.3 Komposit-Pages (`src/pages/`)
- Eltern: `ParentDashboard`, `ScreeningReportPage`
- Coach: `CoachDashboard`, `IntakePage`, `SessionCard`, `ScreeningResultsPage`, `ReportsPage`
- Schüler: `StudentDashboard` (+ Hero/Filters/Clusters Subkomponenten), `ClusterView`, `TaskPlayer`
- Admin: 14 Routen (Dashboard, Leads, Tiers, Diagnostics, Onboarding, Schedule, Coaches, Assignments, XpRules, ScreeningItems/-Editor/-Coverage, LambacherPreview)

---

## 7. Showcase-Routes

- `/demo/design` — Tab "v2" zeigt Animationen, Glas-Foundations, Schatten, Mastery-Stufen
- `/demo/v2/kit` — komplette Atom-Bibliothek
- `/demo/v2/student` — Schüler-Erlebnis inkl. Effekt-Momente (Trigger-Buttons)
- `/demo/v2/parent` — Eltern-Erlebnis (ruhig, kein Glas)

---

## 8. Was bewusst NICHT in v2 ist

- **Türkis-Level-Up** (`#0E9E96` / `#19C9BC`): verworfen — Level-Up nutzt jetzt Midnight-Navy + Champagner + Altgold
- **Premium-Gradients & Glow-Shadows**: ersatzlos gestrichen (`--gradient-*`, `--shadow-glow-*`)
- **Dark Mode**: zurückgestellt
- **Coins / zweite Währung**: zurückgestellt
- **Boss-Challenge-Character als Figur**: offen, kommt später
- **WCAG-AA-Audit** als formaler Audit: nicht in v2 enthalten (Token-System ist neu zu prüfen)
