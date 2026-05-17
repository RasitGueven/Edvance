# Retro: Gesamtüberblick aller Änderungen – 2026-05-17

Abgedeckter Zeitraum: ab Retro 2026-05-13-mathebuch-import.md bis heute.
Commits: `180344c` bis `79829fd` (Merge PR #11 in main).

---

## 1. Was wurde gebaut (Features & Fixes)

### feat(import): Microskill-Lookup aus NRW-Klasse-8-Taxonomie (`64d2950`)

**Was:** Der Lambacher-Importer wurde um automatische Anreicherung via
Topic-Code erweitert. Plugin-Claude liefert im Feld `competence` einen
Code wie `M8.AF.01`; der Importer sucht diesen in der Taxonomie-Map und
übernimmt `estimated_minutes`, `cognitive_type` und `curriculum_ref`
automatisch — ohne dass die JSON-Datei diese Felder explizit setzen muss.

**Warum:** Ohne Lookup musste entweder jeder Eintrag manuell annotiert
werden oder die Felder blieben leer. Mit der Taxonomie-Map reicht ein
einziger Topic-Code aus dem Plugin.

**Dateien:**
- `scripts/import/lambacher.ts` — `loadTaxonomy()`, `toDbTask()` erweitert
  um `taxonomy`-Parameter und `unknownCompetences`-Set; Run-Log enthält
  unbekannte Codes für Tracking.
- `scripts/import/PLUGIN_BRIEFING.md` — Topic-Code-Tabelle (17 Microskills)
  ergänzt; neue Semantik für `estimated_minutes` (nur bei Abweichung vom
  Topic-Default setzen).

---

### docs: schema_content.sql + Retro nachgezogen (`180344c`)

**Was:** `schema_content.sql` auf DB-Stand nach Migrationen 005–007 gebracht.
Neue Spalten auf `tasks` und `microskills`, vier neue Indizes, Kopfkommentar
mit Migrations-Stand. Retro `2026-05-13-mathebuch-import.md` verfasst.

**Dateien:**
- `schema_content.sql`
- `docs/retros/2026-05-13-mathebuch-import.md`

---

### fix(migrations): 008 ersetzt Partial-Unique-Index durch echten Constraint (`797d918`)

**Was:** Migration 007 hatte `(source, source_ref)` als `PARTIAL UNIQUE
INDEX WHERE source_ref IS NOT NULL` angelegt. PostgREST/Supabase-Upsert
sendet `ON CONFLICT (cols)` ohne `WHERE`-Klausel — Postgres findet den
partiellen Index nicht und wirft "there is no unique or exclusion constraint
matching the ON CONFLICT specification". Migration 008 droppt den Index und
legt stattdessen einen vollwertigen `UNIQUE CONSTRAINT` an.

**Warum funktioniert das trotzdem korrekt:** Postgres-UNIQUE-Constraints
behandeln `NULL != NULL`, d.h. mehrere Zeilen mit `source_ref = NULL`
bleiben weiterhin erlaubt — semantisch identisch zum partiellen Index.

**Dateien:**
- `migrations/008_task_source_constraint.sql` (neu)
- `schema_content.sql` (nachgezogen)

---

### feat(admin): LambacherPreview-Seite für Mathebuch-Import (`b6bcf70`)

**Was:** Neue Admin-Route `/admin/lambacher-preview` zeigt alle Tasks mit
`source = 'mathebuch_lambacher_8_nrw'` als gerenderte Cards. Pro Card:
Titel, Meta-Chips (source_ref, curriculum_ref, cognitive_type,
estimated_minutes, Klasse), Schwierigkeitspunkte als Dot-Reihe,
expandierbare Hinweis- und Lösungsblöcke. Filter-Buttons nach `content_type`
(nur angezeigte Typen mit Treffern erscheinen).

**Warum:** Rasit muss importierte Aufgaben sofort sichten und prüfen können,
bevor sie in Lernpfade eingebaut werden. Die Preview-Seite schließt die
Feedback-Schleife: Import → DB → visueller Check → Korrektur.

**Dateien:**
- `src/pages/admin/LambacherPreview.tsx` (neu, 203 Zeilen)
- `src/lib/supabase/tasks.ts` — neue Wrapper-Funktion `getTasksBySource()`
- `src/App.tsx` — neue Route, geschützt via `ProtectedRoute` für `admin`

---

### feat(render): MathContent rendert jetzt Markdown + LaTeX (`9026184`)

**Was:** Der bisherige minimale Tokenizer in `MathContent.tsx` wurde durch
`react-markdown` mit der Plugin-Kette `remark-gfm → remark-math → rehype-katex`
ersetzt. Die öffentliche API bleibt stabil (`<MathContent text={...} />`).
Unterstützte Elemente: Inline-Math `$...$`, Display-Math `$$...$$`,
GFM-Tabellen, geordnete und ungeordnete Listen, Bold, Kursiv, Strike,
Code-Blöcke, Blockquotes, Links, horizontale Linien. Alle HTML-Elemente
werden mit Tailwind-Klassen überschrieben — kein `@tailwindcss/typography`-
Plugin benötigt.

**Warum:** Lambacher-Aufgaben enthalten regelmäßig LaTeX-Terme und einfache
Tabellen (Wertetabellen für lineare Funktionen, Wahrscheinlichkeitstabellen).
Ohne vollständiges Rendering sind diese Aufgaben nicht nutzbar.

**Abhängigkeiten (neu):**
- `react-markdown`
- `remark-gfm`
- `remark-math`
- `rehype-katex`

**Dateien:**
- `src/lib/render/MathContent.tsx` (138 → 84 Zeilen, vollständige Neufassung)
- `package.json`, `package-lock.json`

---

### feat(assets): Bilder/Abbildungen pro Aufgabe (`c5c6ef9`)

**Was:** Jede Aufgabe kann jetzt eine geordnete Liste von Bild-Assets
mitführen. Ein Asset besteht aus `url` (Pflicht), `alt` (Pflicht) und
`caption` (optional). Der Importer validiert und filtert Assets mit
fehlender URL oder fehlendem Alt-Text stillschweigend heraus.

Rendering-Logik in `AssetList.tsx`:
- 1 Asset → volle Breite, zentriert
- 2+ Assets → 2-Spalten-Grid (responsive via `sm:grid-cols-2`)
- Lazy-Loading, `max-h-72`, `object-contain`, Border und Background aus CSS-Variablen

**Warum:** Viele Lambacher-Aufgaben sind ohne die zugehörige Abbildung
(Würfelskizzen, Koordinatensysteme, Diagramme) nicht lösbar. Assets
bringen den "wie im Mathebuch"-Look.

**Storage-Entscheidung:** Klett-CDN-URLs funktionieren nicht hinter Login.
Empfehlung: eigener public Supabase-Storage-Bucket `task-assets`. Auto-Upload
durch den Importer steht noch aus — aktuell muss Plugin-Claude die URL
manuell setzen.

**Dateien:**
- `src/lib/render/AssetList.tsx` (neu, 43 Zeilen)
- `src/types/index.ts` — neuer Typ `TaskAsset`, `Task.assets: TaskAsset[]`
- `migrations/009_task_assets.sql` (neu) — `tasks.assets jsonb NOT NULL DEFAULT '[]'`, Filter-Index
- `scripts/import/lambacher.ts` — Funktion `asAssets()`, `assets`-Feld in `toDbTask()`
- `src/pages/admin/LambacherPreview.tsx` — `<AssetList assets={task.assets} />` eingehängt
- `scripts/import/PLUGIN_BRIEFING.md` — `assets`-Feld + Storage-Bucket-Empfehlung dokumentiert
- `schema_content.sql` — nachgezogen

---

## 2. Architektur-Entscheidungen

### UNIQUE CONSTRAINT statt Partial-Unique-Index für Upsert-Idempotenz

PostgREST (und damit der Supabase-Client) setzt für `.upsert(row, { onConflict: 'col1,col2' })`
intern `ON CONFLICT (col1, col2) DO UPDATE` — ohne WHERE-Klausel. Postgres
findet einen partiellen Index nicht als passenden Conflict-Handler. Ein echter
`UNIQUE CONSTRAINT` hingegen ist immer kompatibel. Bei Nullable-Spalten
behandelt Postgres `NULL != NULL` auch ohne Partial-Klausel korrekt, sodass
mehrere Zeilen mit `source_ref = NULL` weiterhin erlaubt bleiben.

### react-markdown + remark-Plugins statt eigenem Tokenizer

Ein eigener Tokenizer kann LaTeX und GFM-Syntax nur unvollständig abdecken
und ist ein Wartungsproblem. `react-markdown` mit dem Remark-Rehype-Ökosystem
ist die Community-Lösung für genau diesen Use-Case. Component-Overrides für
alle Basis-Elemente stellen sicher, dass kein unkontrolliertes HTML entsteht
und alle Klassen aus Tailwind stammen.

### assets als jsonb statt eigene Tabelle

Assets sind immer exklusiv zu einer Task, werden immer gemeinsam geladen
und haben keine eigene Identität (kein eigener Primärschlüssel nötig). Eine
eigene Tabelle hätte jeden Task-Fetch zu einem Join gemacht ohne echten
Mehrwert. `jsonb NOT NULL DEFAULT '[]'` hält die Abfragen einfach, die
Validierung liegt auf Client-Seite im Importer.

### Auto-Upload der Assets: bewusst vertagt

Klett-CDN-URLs funktionieren nicht öffentlich. Der Importer selbst zu
einem Upload-Tool zu machen würde seinen Scope sprengen (Fetch, Resize,
Supabase-Storage-Upload). Die sauberere Lösung ist ein separates
Upload-Script, das Plugin-Claude-JSONs nachbearbeitet. Steht als offener
Punkt.

### Importer-Modi: Dry-Run als Default

Standardaufruf ohne `--write` zeigt alle zu importierenden Zeilen mit
ihrer `source_ref` und den ersten 60 Zeichen der Question. Das erlaubt
schnelle Validierung ohne DB-Schreibzugriff — wichtig, da der Importer
`SUPABASE_SERVICE_ROLE_KEY` braucht und mit Admin-Rechten schreibt.

---

## 3. Datenbankänderungen

Alle Migrationen werden manuell im Supabase SQL Editor ausgeführt.
Kein automatisches Migrations-Tooling vorhanden.

### Migration 008 — `tasks_source_ref_unique` (Constraint-Fix)

```sql
drop index if exists tasks_source_ref_unique;
alter table tasks add constraint tasks_source_ref_unique unique (source, source_ref);
```

**Voraussetzung:** Migration 007 muss ausgeführt sein.
**Status:** Ausgeführt und verifiziert (Idempotenz-Test: 2× `--write` → 0 Errors).

### Migration 009 — `tasks.assets` (JSONB-Spalte + Index)

```sql
alter table tasks add column if not exists assets jsonb not null default '[]'::jsonb;
create index if not exists tasks_has_assets_idx
  on tasks ((jsonb_array_length(assets) > 0))
  where jsonb_array_length(assets) > 0;
```

**Voraussetzung:** Migration 008 muss ausgeführt sein.
**Status:** In `migrations/009_task_assets.sql` dokumentiert. Manuell im Studio auszuführen, sofern noch nicht geschehen.

### RLS-Status

Keine neuen Policies in diesem Zyklus. Bestehende Policies aus
`schema_content.sql` gelten weiterhin:
- `subjects`, `skill_clusters`, `microskills`, `tasks` → SELECT für alle
  authentifizierten User
- `task_coach_metadata` → SELECT nur für Rollen `coach` und `admin`
- `tasks` → ALL (INSERT/UPDATE/DELETE) nur für Rolle `admin`

Der Lambacher-Importer nutzt den `SERVICE_ROLE_KEY` und umgeht RLS
bewusst — er läuft ausschließlich lokal, niemals im Browser.

### Schema-Sync-Status

`schema_content.sql` spiegelt den realen DB-Stand nach Migrationen 005–009
inklusive. Der bekannte Konflikt mit `schema.sql` (doppelte
`subjects`-Definition) besteht weiter — der Kommentar am Dateikopf
dokumentiert den additiven Workaround.

---

## 4. Offene Punkte & TODOs

### Kritisch / blockierend für nächste Phase

- **Migration 009 im Supabase Studio ausführen**, falls noch nicht geschehen.
  Ohne die `assets`-Spalte schlägt jeder Lambacher-Import mit `--write` fehl.
- **Erster Content-Drop steht aus.** `scripts/import/raw/lambacher-8-nrw/`
  ist leer. Kein Plugin-Claude-Output vorhanden. Ohne Daten kann der
  LambacherPreview nichts anzeigen. Owner, Kapitel-Auswahl und Deadline
  sind noch nicht definiert.

### Offene technische Schulden

- **LambacherPreview nutzt shadcn `<Card>` statt `EdvanceCard`.**
  Die Preview-Seite ist ein reines Admin-/Entwickler-Tool, daher akzeptabel,
  aber bei einer produktiven Schüler-Ansicht müsste auf `EdvanceCard` gewechselt
  werden.
- **Ladezustand in LambacherPreview ist ein einfaches `<p>`** statt
  `LoadingPulse`. Für ein Admin-Tool toleriert, für Schüler-/Coach-Views
  wäre `LoadingPulse` Pflicht.
- **Leerer Zustand in LambacherPreview ist ein roher `<Card>` mit Text** statt
  `EmptyState`-Komponente.
- **Assets-Auto-Upload fehlt.** Plugin-Claude muss URLs manuell setzen.
  Sauberere Lösung: separates `scripts/import/upload-assets.ts`, das
  Bild-URLs in JSONs erkennt, in Supabase Storage hochlädt und die URL
  ersetzt.
- **Kein Supabase-Storage-Bucket `task-assets` angelegt.** Das
  PLUGIN_BRIEFING.md empfiehlt ihn, er muss aber manuell im Studio
  erstellt werden (public, Name `task-assets`).
- **`schema.sql` und `schema_content.sql` doppeln die `subjects`-Definition.**
  Konsolidierung steht noch aus — Workaround im Kommentar dokumentiert.
- **Vier Zombie-`feature/*`-Branches lokal** (content-schema, diagnosis-engine,
  diagnostic-engine, student-learning-path) — alle bereits in `dev`
  integriert, nur Pointer-Cleanup nötig: `git branch -d <name>`.
- **ROADMAP.md behauptet "Fertig: EdvanceCard, MasteryBar, XPBar, StatCard,
  Badges, EmptyState, LoadingPulse"** — `EdvanceCard` existiert in
  `src/components/edvance/index.tsx`. `MasteryBar`, `XPBar`, `StatCard`,
  `EmptyState`, `LoadingPulse`, `ToastBanner` sind dort nicht zu finden.
  Diskrepanz aus dem 2026-05-08-Retro weiter offen.

---

## 5. TypeScript-Status

```
npx tsc --noEmit
Exit code: 0 — keine Fehler
```

Alle 5 neuen/geänderten Source-Dateien sind typsicher:
- `src/lib/render/MathContent.tsx` — stabile Props-Signatur, JSX-Return-Type explizit
- `src/lib/render/AssetList.tsx` — `TaskAsset[]` aus zentralem `types/index.ts`
- `src/pages/admin/LambacherPreview.tsx` — `Task`, `Filter` typisiert, `useMemo`/`useEffect` korrekt
- `src/lib/supabase/tasks.ts` — `getTasksBySource()` gibt `SupabaseResult<Task[]>` zurück
- `src/types/index.ts` — `TaskAsset`-Typ und `Task.assets: TaskAsset[]` ergänzt

---

## 6. Nächste Schritte (aus ROADMAP)

Laut `docs/ROADMAP.md` (Stand vor diesem Zyklus):

1. **Mathebuch-Import (Lambacher Schweizer 8. Klasse NRW) via Chrome-MCP**
   — Pipeline ist fertig, Content-Drop steht aus. Nächster konkreter
   Schritt: Plugin-Claude auf erste Buchseite(n) ansetzen, JSONs in
   `scripts/import/raw/lambacher-8-nrw/` ablegen, Dry-Run prüfen, dann
   `--write`.

2. **Schüler-Tablet Session-View (Lernpfad-Rendering aus echten tasks)**
   — Setzt echte Task-Daten in der DB voraus (→ Punkt 1 zuerst).
   Komponenten-Grundlage (`MathContent`, `AssetList`) ist vorhanden.

3. **Home-Quest Flow** — Gamification-Schicht über dem Lernpfad.

4. **Elternreport** — Vor/Nachher-Vergleich, Coach-Zitat.

5. **Supabase Echtdaten-Anbindung (Profiles/Students von Mock auf Supabase)**
   — `src/lib/supabase/students.ts` ist Stub und wartet auf Umsetzung.

**Empfohlene Priorität für die nächste Session:**
Migration 009 im Studio bestätigen → Storage-Bucket `task-assets` anlegen →
ersten Content-Drop mit Plugin-Claude starten (1 Kapitel, 10–15 Aufgaben) →
LambacherPreview als Qualitätscheck nutzen.
