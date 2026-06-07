# Retro 2026-06-07 — Vollständiger Code-Review (Stand nach PR #18)

Branch: `claude/sweet-ramanujan-t1Jk3` (identisch mit `main` nach Merge PR #18).  
Review-Session: `claude/sweet-ramanujan-t1Jk3`.

## Scope

Vollständiger Code-Review des gesamten `src/`-Verzeichnisses nach Abschluss aller
gemergten PRs (#16 Real-Data-Programm, #17 dev-Sync, #18 Brand-System + Farbsystem).
Kein neuer Feature-Code — reine Analyse und Dokumentation.

---

## TypeScript

`npm run lint` (`tsc -b --noEmit`) läuft ohne Output und ohne Exit-Code-Fehler durch.

**Ergebnis: 0 TypeScript-Fehler.**

---

## Dateien über 400 Zeilen (CLAUDE.md §4)

| Datei | Zeilen | Priorität |
|---|---|---|
| `src/pages/DiagnosisResult.tsx` | 946 | Kritisch — 2,4× Limit |
| `src/pages/DiagnosisSession.tsx` | 764 | Kritisch — 1,9× Limit |
| `src/components/edvance/index.tsx` | 559 | Hoch — 1,4× Limit |
| `src/pages/DesignShowcase.tsx` | 478 | Mittel (Showcase-only) |
| `src/types/index.ts` | 461 | Mittel (Type-Datei) |
| `src/pages/admin/DiagnosticsPage.tsx` | 427 | Mittel |
| `src/pages/student/StudentDashboard.tsx` | 419 | Mittel |

`DiagnosisResult.tsx` enthält mindestens 8 auslagerfähige Subkomponenten:
`RadialGauge`, `MetricGauge`, `KpiCard`, `SkillBar`, `SnapshotCard`,
`SignalPill`, `BehaviorBadge`, `FocusSection`.

---

## Design-Regel-Verstöße (CLAUDE.md §11)

### Blocker — `boxShadow` als Inline-Style

- `src/pages/admin/AdminDashboard.tsx` Z. 71, 183:
  `style={{ boxShadow: SHADOW_CARD }}` — `SHADOW_CARD = '0 4px 24px 0 rgba(0,0,0,0.08)'`
- `src/pages/coach/CoachDashboard.tsx` Z. 82, 110:
  `style={{ boxShadow: SHADOW_CARD }}` und `style={{ boxShadow: SHADOW_ACTIVE }}`
- `src/pages/DiagnosisSession.tsx` Z. 33:
  `boxShadow: '0 3px 0 0 var(--primary-shadow)'`

Fix: hardkodierte `rgba()`-Strings → `shadow-card` / `shadow-elevation-md` Tailwind-Utilities.
Außerdem nutzen `AdminDashboard` und `CoachDashboard` shadcn `<Card>` statt `EdvanceCard`.

### Warnung — Hardkodierte Hex-Farben

- `src/components/edvance/tasks/MatchingWidget.tsx` Z. 14–17:
  Vier Hex-Codes `#2D6A9F`, `#16a34a`, `#d97706`, `#7c3aed` als Tint-Array.
- `src/components/edvance/tasks/MCWidget.tsx` Z. 37:
  `color: active ? '#fff' : 'var(--primary)'` — `'#fff'` Literal.
- `src/pages/student/StudentDashboard.tsx` Z. 305:
  `fg: '#9A6B00'` in `CLUSTER_TINTS`-Array (einziger Eintrag mit hartem Hex).
- `src/components/edvance/DrawCanvas.tsx` Z. 14, 16:
  `STROKE_COLOR = '#0F172A'`, `BG_COLOR = '#FFFFFF'` (Canvas API — technisch bedingt,
  CSS-Variable-Fallback wäre sauberer).
- `src/components/brand/EdvanceLogo.tsx` Z. 19–22:
  Vier Hex-Werte im `COLORS`-Objekt (SVG-Brand-Asset, eng an Design-Handoff gebunden —
  akzeptabel, aber explizit so dokumentieren).
- `src/pages/DiagnosisResult.tsx` Z. 634, 638, 645:
  `style={{ background: 'white' }}` — dekorative Kreise/Avatar. In Dark-Mode nicht neutral.

### Warnung — Fehlende `LoadingPulse`-Komponente (Schüler-Screens)

- `src/pages/student/ClusterView.tsx` Z. 79:
  `<p className="text-sm text-muted">Lade Cluster …</p>`
- `src/pages/student/TaskPlayer.tsx` Z. 148:
  `<p className="text-sm text-muted">Lade Aufgabe …</p>`
- `src/pages/student/StudentDashboard.tsx` Z. 285:
  `<p className="mt-6 text-sm text-muted">Lade Themen …</p>`

Alle drei Schüler-Screens verstoßen gegen das Verbot grauer Placeholder-Screens.

### Warnung — Fehlende `EmptyState`-Komponente

- `src/pages/student/StudentDashboard.tsx` Z. 287–292:
  Leerer Cluster-Zustand → rohes `<Card><CardContent>Noch keine Themen …</CardContent></Card>`
- `src/pages/student/StudentDashboard.tsx` Z. 369–376:
  Leere Suchresultate → rohes `<Card><CardContent>Keine Treffer.</CardContent></Card>`
- `src/pages/student/ClusterView.tsx`:
  Fehler-/Leer-Zustand (kein Cluster gefunden) → rohes `<Card>` + Text

---

## Supabase-Kapselung

**Sauber.** Alle Pages und Components importieren ausschließlich aus `src/lib/supabase/*`.
Kein direkter `supabase.from()` oder `supabase.auth.*`-Aufruf außerhalb von `src/lib/`.

---

## Mock-Überreste

**Keine aktiven Mocks.** Die zwei verbleibenden Treffer in
`src/lib/supabase/sessions.ts` und `src/lib/supabase/profiles.ts` sind
Dokumentationskommentare (`// ersetzt MOCK_SESSIONS`), kein aktiver Code.

---

## Auth & Sicherheit

**Alle produktiven Routes korrekt geschützt** via
`<ProtectedRoute allowedRoles={[...]}>`. Admin, Coach, Parent, Student — vollständig.

### Warnung — Bewusst ungeschützte Diagnose-Routes

- `src/App.tsx` Z. 124: `/diagnosis` — kein `ProtectedRoute`
  (laut Kommentar: "lokal, ohne Login – Tablet-Sicht")
- `src/App.tsx` Z. 125: `/diagnosis/result` — kein `ProtectedRoute`

Entscheidung ist im Code dokumentiert. Kein Blocker, aber bekannte Einschränkung.

### Blocker (vor Deploy klären) — Korrekt-Quote auf Schüler-Route

`src/pages/DiagnosisResult.tsx` Z. 682–683: "Korrekt-Quote"-KPI berechnet
`correctCount / completedSnaps.length` auf Basis von `coach_rating`-Werten.
Diese Route (`/diagnosis/result`) ist **nicht** hinter `ProtectedRoute` und ist
aus der ungeschützten Tablet-Session (`/diagnosis`) erreichbar.

Während einer Live-Session ist `coach_rating` immer `null` (der KPI zeigt 0/X).
Im Screening-Resume-Pfad können geratete Werte jedoch vorhanden sein.

**Verstoß gegen CLAUDE.md §6:** „Kind-seitig: Niemals visuelles Feedback ob Antwort richtig/falsch."

**Rasit muss entscheiden:**
- Option A: KPI-Render nur wenn `role === 'coach'` (bedingtes Rendering)
- Option B: `/diagnosis/result` hinter `ProtectedRoute` (bricht Tablet-offline-Szenario)

---

## Gesamtbewertung

**GELB — kein Deploy-Stopper außer Korrekt-Quote-KPI**

| Kategorie | Status |
|---|---|
| TypeScript | ✅ 0 Fehler |
| Supabase-Kapselung | ✅ sauber |
| Mock-Sweep | ✅ abgeschlossen |
| Auth-Routing (produktive Screens) | ✅ vollständig |
| `.env` in `.gitignore` | ✅ korrekt |
| BehaviorSnapshots append-only | ✅ eingehalten |
| Inline-Shadow-Styles | ❌ 3 Dateien (P1) |
| Hardkodierte Hex-Farben | ⚠️ 6 Stellen (P2) |
| LoadingPulse fehlend | ⚠️ 3 Schüler-Screens (P2) |
| EmptyState fehlend | ⚠️ 3 Stellen (P2) |
| Dateigröße > 400 Zeilen | ⚠️ 7 Dateien (P1/P2) |
| Korrekt-Quote auf ungeschützter Route | 🔴 Blocker vor Deploy |

---

## Offene Punkte (priorisiert)

### P0 — Blocker vor jedem Deploy
- **Korrekt-Quote-KPI** in `DiagnosisResult.tsx` hinter Role-Check stellen
  (Option A: `role === 'coach'`-Guard; Option B: Route schützen)

### P1 — Vor nächstem Milestone
- `AdminDashboard.tsx` + `CoachDashboard.tsx`:
  `SHADOW_CARD`/`SHADOW_ACTIVE` → `shadow-card` / `shadow-elevation-md`
  + shadcn `<Card>` → `EdvanceCard`
- `DiagnosisResult.tsx` (946 Z.) aufteilen:
  `RadialGauge`, `KpiCard`, `SkillBar`, `SnapshotCard`, `BehaviorBadge`, `FocusSection`
  → je eigene Datei in `src/components/edvance/diagnosis/`
- `DiagnosisSession.tsx` (764 Z.) aufteilen:
  Formular-Blöcke und Hilfsfunktionen auslagern

### P2 — Mittelfristig
- Schüler-Screens: `LoadingPulse` statt Inline-Text (3 Screens)
- Schüler-Screens: `EmptyState` statt rohes `<Card>` (3 Stellen)
- `MatchingWidget.tsx`: 4 Hex-Farben → CSS-Variablen in `globals.css`
- `StudentDashboard.tsx` Z. 305: `fg: '#9A6B00'` → CSS-Variable
- `DiagnosisResult.tsx`: `background: 'white'` → `var(--background)`
- Space Grotesk self-hosten (DSGVO)
- `favicon.ico` + `apple-touch-icon.png` für iOS/Legacy generieren
- TaskPlayer Submit-Flow + XP-Vergabe implementieren
- Realtime-Sync Zwei-Geräte-Flow
