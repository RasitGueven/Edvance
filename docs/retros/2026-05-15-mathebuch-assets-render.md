# Retro: Mathebuch-Assets & Markdown/LaTeX-Renderer
Datum: 15.05.2026

## Was wurde gebaut

Diese Phase schließt die Mathebuch-Import-Pipeline (begonnen am 13.05.) ab.
Drei unabhängige Erweiterungen wurden in einem PR gebündelt und am 14.05.2026
in `main` gemergt (PR #11).

### 1. MathContent-Renderer (vollständiger Ersatz)

Der bisherige minimale Tokenizer in `src/lib/render/MathContent.tsx` wurde
durch eine vollwertige Render-Pipeline ersetzt:

- **react-markdown** als Basis (GFM-Variante via remark-gfm: Tabellen, Listen,
  Bold, Strike, Durchgestrichen)
- **remark-math + rehype-katex** für Inline-Math `$...$` und Display-Math
  `$$...$$`
- Vollständige Component-Overrides mit Tailwind-Klassen für `p`, `strong`,
  `em`, `ul`, `ol`, `li`, `table`, `thead`, `tr`, `th`, `td`, `code`, `a`,
  `hr`, `blockquote`
- API bleibt stabil: `<MathContent text={...} />` — kein Breaking Change für
  Aufrufer (TaskPlayer, LambacherPreview)

Neue Abhängigkeiten in `package.json`:
- `react-markdown: ^10.1.0`
- `remark-gfm: ^4.0.1`
- `remark-math: ^6.0.0`
- `rehype-katex: ^7.0.1`
- `katex: ^0.16.45` (+ `@types/katex: ^0.16.8`)

### 2. Asset-Rendering (AssetList-Komponente)

Neue Komponente `src/lib/render/AssetList.tsx`:

- Rendert `TaskAsset[]` (ein Bild = volle Breite zentriert, zwei oder mehr =
  2-Spalten-Grid, responsive mit `sm:grid-cols-2`)
- `<figure>` / `<figcaption>` Semantik
- Lazy-Loading per `loading="lazy"`
- `max-h-72` Höhenbegrenzung, `object-contain` für Proportionserhalt
- Gibt `null` zurück wenn das Array leer ist (kein leerer Wrapper im DOM)

### 3. Schema-Erweiterung: tasks.assets (Migration 009)

- Neue Spalte `tasks.assets jsonb NOT NULL DEFAULT '[]'::jsonb`
- Partial-Filter-Index `tasks_has_assets_idx` für schnelle Abfrage aller
  Aufgaben mit mindestens einem Asset
- TypeScript-Typ `TaskAsset { url: string; alt: string; caption?: string }`
  in `src/types/index.ts` ergänzt
- `Task.assets: TaskAsset[]` als Pflichtfeld (Datenbank liefert immer `[]` als
  Default, kein `| null` nötig)

### 4. Importer-Erweiterung (lambacher.ts)

- Neue Hilfsfunktion `asAssets()`: validiert Asset-Einträge — nur Objekte mit
  `url` (string, nicht leer) + `alt` (string, nicht leer) werden durchgelassen,
  `caption` ist optional; Einträge ohne Pflichtfelder werden stillschweigend
  verworfen
- `toDbTask()` befüllt jetzt das `assets`-Feld

### 5. LambacherPreview-Seite (Admin)

Neue Seite `src/pages/admin/LambacherPreview.tsx`:

- Route: `/admin/lambacher-preview`, geschützt durch `ProtectedRoute` mit
  `allowedRoles={['admin']}`
- Lädt alle Tasks mit `source = 'mathebuch_lambacher_8_nrw'` via neuer
  Wrapper-Funktion `getTasksBySource()`, sortiert nach `source_ref`
- Filter-Leiste nach `content_type` (Buttons zeigen nur Typen mit count > 0)
- Pro Task: `<Card>` mit Titel, Meta-Chips (source_ref, curriculum_ref,
  cognitive_type, estimated_minutes, class_level), Schwierigkeits-Punkte-Row,
  `AssetList`, `MathContent` für Frage, aufklappbare Hinweis- und
  Lösungsblöcke
- Eigene Sub-Komponenten: `DifficultyDots`, `MetaRow`, `TaskCard` (alle lokal
  in der Datei)

### 6. Supabase-Wrapper: getTasksBySource()

Neue Funktion in `src/lib/supabase/tasks.ts`:
- Filtert nach `source`-Spalte, sortiert nach `source_ref` (nullsFirst: false)
- Gleiche Error-Handling-Konvention wie alle anderen Wrapper

### 7. Bug-Fix Migration 008

Migration 007 hatte einen Partial Unique Index `(source, source_ref) WHERE
source_ref IS NOT NULL` angelegt. PostgREST-Upsert mit `onConflict:
'source,source_ref'` schickt `ON CONFLICT (cols)` ohne `WHERE`-Klausel —
Postgres findet keinen passenden Constraint und wirft einen Fehler.

Migration 008 ersetzt den Partial Index durch einen echten `UNIQUE
CONSTRAINT (source, source_ref)`. Funktional äquivalent, da Postgres-UNIQUE
sowieso `NULL != NULL` behandelt und mehrere Zeilen mit `source_ref = NULL`
erlaubt bleiben.

### 8. PLUGIN_BRIEFING.md erweitert

- Neues Feld `assets` dokumentiert (Format, Pflicht-/Optionalfelder,
  Storage-Bucket-Empfehlung `task-assets`, Warnung zu Klett-CDN-URLs)
- Vollständiges Beispiel-JSON mit `assets`-Array ergänzt

---

## Technische Details

### Neue Dateien

| Datei | Zeilen | Zweck |
|---|---|---|
| `src/lib/render/MathContent.tsx` | 84 | Markdown+LaTeX-Renderer |
| `src/lib/render/AssetList.tsx` | 43 | Bild-Renderer für TaskAsset[] |
| `src/pages/admin/LambacherPreview.tsx` | 203 | Admin-Vorschau-Seite |
| `migrations/008_task_source_constraint.sql` | 29 | Partial Index → UNIQUE CONSTRAINT |
| `migrations/009_task_assets.sql` | 38 | tasks.assets-Spalte + Index |

### Geänderte Dateien

| Datei | Beschreibung |
|---|---|
| `src/types/index.ts` | `TaskAsset`-Typ + `Task.assets: TaskAsset[]` ergänzt |
| `src/lib/supabase/tasks.ts` | `getTasksBySource()` hinzugefügt |
| `src/App.tsx` | Route `/admin/lambacher-preview` + Import hinzugefügt |
| `scripts/import/lambacher.ts` | `asAssets()`-Funktion + `assets`-Mapping in `toDbTask()` |
| `scripts/import/PLUGIN_BRIEFING.md` | `assets`-Feld dokumentiert |
| `schema_content.sql` | Auf Stand Migration 009 nachgezogen |
| `package.json` / `package-lock.json` | 5 neue Render-Abhängigkeiten |

### Migrations-Status

| Migration | Beschreibung | Status |
|---|---|---|
| 001–007 | Siehe Retros 2026-05-08, 2026-05-13 | Ausgeführt |
| 008 | UNIQUE CONSTRAINT (source, source_ref) | Manuell im Studio ausführen |
| 009 | tasks.assets jsonb NOT NULL DEFAULT '[]' | Manuell im Studio ausführen |

Beide Migrationen (008, 009) müssen noch manuell im Supabase SQL Editor
ausgeführt werden. Der Importer und die Preview-Seite sind ohne Migration 008
nicht lauffähig (Upsert schlägt fehl). AssetList funktioniert erst korrekt,
wenn Migration 009 aktiv ist.

---

## Architektur-Entscheidungen

### Render-Pipeline in src/lib/render/ statt src/components/

`MathContent` und `AssetList` liegen unter `src/lib/render/` und nicht unter
`src/components/edvance/`. Begründung: Diese Dateien sind reine Render-Helfer
ohne Design-System-Kopplung — sie sind nicht Teil des Edvance-Brand-Design-
Systems (EdvanceCard, StatCard etc.), sondern generische Content-Renderer.
Die Platzierung in `lib/` signalisiert, dass sie technisch driven sind und
kein Marken-Look tragen müssen.

### Kein typography-Plugin

Tailwind Typography (`@tailwindcss/typography`) wurde bewusst nicht
eingesetzt. Stattdessen überschreiben explizite `components`-Overrides in
MathContent.tsx jeden Element-Typ direkt mit Tailwind-Klassen. Das vermeidet
Kollisionen mit Edvance-CSS-Variablen-System und gibt vollständige Kontrolle
über Styling ohne Plugin-Konfiguration.

### LambacherPreview als isolierter Admin-Screen

Die Preview-Seite verwendet shadcn `Card` / `CardContent` direkt statt
`EdvanceCard`, weil es sich um eine interne Admin-Ansicht handelt, die nicht
dem Schüler-/Eltern-/Coach-Design unterliegt. Die Komponenten `LoadingPulse`
und `EmptyState` wurden nicht eingesetzt (sie existieren noch nicht als
fertige Komponenten im Codebase, obwohl ROADMAP.md sie als „Fertig" führt —
bekannte Diskrepanz, Retro 2026-05-08).

### assets als JSONB statt eigene Tabelle

Eine eigene `task_assets`-Tabelle hätte RLS und Joins erfordert. JSONB ist
ausreichend, da Assets ordered sein müssen, keine eigenen Berechtigungen
benötigen und immer zusammen mit dem Task geladen werden. Der Kompromiss:
keine Datenbank-seitige Validierung von url/alt — das übernimmt der Importer
und künftig ein Zod-Schema im Frontend.

### Idempotenter Upsert erst nach Migration 008 möglich

Die ursprüngliche Partial-Index-Lösung aus Migration 007 war semantisch
korrekt, aber PostgREST-inkompatibel. Migration 008 ist ein reiner Fix ohne
Semantikänderung: NULL-Zeilen bleiben erlaubt (Postgres-UNIQUE lässt mehrere
NULLs zu), aber der CONSTRAINT ist jetzt für PostgREST sichtbar.

---

## TypeScript-Status

Ausführungsdatum: 2026-05-15

```
npx tsc --noEmit
```

Ergebnis: **Exit 0 — keine Fehler, keine Warnungen.**

Der gesamte Code (inkl. neuer MathContent.tsx, AssetList.tsx,
LambacherPreview.tsx, Importer-Erweiterung, getTasksBySource) ist
vollständig typsicher.

---

## Offene Punkte

### Sofort-Prio (Blocker für erste Daten)

1. **Migrationen 008 + 009 im Supabase Studio ausführen** (Owner: Rasit).
   Ohne 008 schlägt jeder `--write`-Lauf des Importers fehl. Ohne 009 fehlt
   die `assets`-Spalte.

2. **Storage-Bucket `task-assets` anlegen** (Owner: Rasit).
   Im Supabase Studio: Storage → New Bucket → Name `task-assets` → Public
   aktivieren. Ohne Bucket können keine Asset-URLs gesetzt werden.

3. **Ersten Lambacher-Content-Drop** (Owner: Rasit + Chrome-Plugin-Claude).
   Raw-JSONs in `scripts/import/raw/lambacher-8-nrw/` ablegen,
   `npm run import:lambacher` im Dry-Run prüfen, dann `-- --write`.

### Mittelfristig

4. **`EmptyState`- und `LoadingPulse`-Komponenten implementieren.**
   LambacherPreview und weitere künftige Seiten nutzen aktuell rohe
   `<p>` und `<Card>` für Lade- und Leer-Zustände. ROADMAP.md deklariert
   diese Komponenten als „Fertig" — das stimmt nicht (bekannt seit
   Retro 2026-05-08, Zeile 128).

5. **Zod-Validierung für `TaskAsset`-Format.**
   Die Datenbank validiert das JSONB-Format nicht. Aktuell übernimmt nur
   `asAssets()` im Importer eine Soft-Validierung. Für spätere direkte
   Writes (Admin-UI, andere Importquellen) ein Zod-Schema in `src/lib/`
   ergänzen.

6. **SCHEMA.md aktualisieren.**
   Die `tasks`-Tabellendefinition in `docs/SCHEMA.md` führt `assets` noch
   nicht auf. Außerdem fehlen die Migrationen 008 und 009 im SQL-Datei-
   Verzeichnis am Ende des Dokuments.

7. **ROADMAP.md nachziehen.**
   Der Abschnitt „In Arbeit" (Serlo-Entfernung) ist erledigt.
   „Mathebuch-Import" ist ebenfalls abgeschlossen (Pipeline + Renderer +
   Assets). Der Abschnitt „Nächste Schritte" kann entsprechend aktualisiert
   werden: erster Content-Drop steht noch aus, aber die technische Pipeline
   ist fertig.

8. **Auto-Upload im Importer.**
   `asAssets()` validiert Asset-Einträge, aber der Importer lädt keine
   Bilder hoch — das muss manuell gemacht werden. Mittelfristig könnte der
   Importer Base64- oder lokale Bildpfade erkennen und automatisch in den
   `task-assets`-Bucket hochladen.

9. **Zombie-Branches lokal aufräumen.**
   Vier lokale Feature-Branches (content-schema, diagnosis-engine,
   diagnostic-engine, student-learning-path) haben 0 ungemergede Commits
   und können gelöscht werden (`git branch -d`).

10. **LambacherPreview für >50 Tasks optimieren.**
    Aktuell lädt die Preview-Seite alle Tasks auf einmal. Bei wachsendem
    Content-Corpus (angestrebt sind mehrere hundert Aufgaben pro Kapitel)
    sollte Paginierung oder Virtual-Scroll ergänzt werden.

---

## Datei-Übersicht (komplett)

### Neu erstellt (diese Phase)
- `src/lib/render/MathContent.tsx`
- `src/lib/render/AssetList.tsx`
- `src/pages/admin/LambacherPreview.tsx`
- `migrations/008_task_source_constraint.sql`
- `migrations/009_task_assets.sql`
- `docs/retros/2026-05-15-mathebuch-assets-render.md` (diese Datei)

### Geändert (diese Phase)
- `src/types/index.ts` — TaskAsset-Typ, Task.assets-Feld
- `src/lib/supabase/tasks.ts` — getTasksBySource()
- `src/App.tsx` — Route + Import LambacherPreview
- `scripts/import/lambacher.ts` — asAssets(), toDbTask() assets-Mapping
- `scripts/import/PLUGIN_BRIEFING.md` — assets-Dokumentation
- `schema_content.sql` — auf Stand Migration 009 nachgezogen
- `package.json` / `package-lock.json` — 5 Render-Deps

### Kontext: Geändert in vorherigen Phasen (13.05.)
- `scripts/import/lambacher.ts` (initiales Skelett)
- `src/lib/taxonomy/nrw_math_klasse8.json`
- `migrations/005–007`
- `src/types/index.ts` (Content-Typen, Microskill, Task ohne assets)
