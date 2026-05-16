# Retro: Render-Layer, Assets-Feld und LambacherPreview-Seite
Datum: 2026-05-16

## Was wurde gebaut

### fix(migrations): 008 — UNIQUE CONSTRAINT statt partial Index (797d918)
- `migrations/008_task_source_constraint.sql`: Ersetzt den in Migration 007 angelegten partial UNIQUE INDEX `(source, source_ref) WHERE source_ref IS NOT NULL` durch einen echten `UNIQUE CONSTRAINT` auf denselben beiden Spalten.
- Hintergrund: PostgREST-Upsert via `.upsert(row, { onConflict: 'source,source_ref' })` schickt `ON CONFLICT (cols)` ohne WHERE-Klausel. Postgres findet keinen passenden Index und wirft einen Fehler. Der Constraint ist semantisch aequivalent zum partial Index — mehrere Zeilen mit `source_ref = NULL` bleiben weiterhin erlaubt, weil in Postgres NULL != NULL.
- `schema_content.sql` entsprechend nachgezogen.

### feat(render): MathContent rendert Markdown + LaTeX (9026184)
- `package.json`: neue Abhaengigkeiten `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`.
- `src/lib/render/MathContent.tsx`: Komplettumbau. Vorgaenger war ein manueller Tokenizer. Der neue Renderer nutzt die Render-Pipeline `remark-gfm → remark-math → rehype-katex` ueber `react-markdown`.
- Unterstuetzte Inhalte: GFM-Tabellen, Listen, Bold, Strike, Inline-LaTeX `$...$`, Display-LaTeX `$$...$$`.
- Alle HTML-Tags werden durch eigene `components`-Map gerendert, die ausschliesslich Tailwind-Klassen und CSS-Variablen nutzen. Kein `style`-Attribut in der Komponente.
- Die oeffentliche API bleibt unveraendert: `<MathContent text={string | null | undefined} />`.

### feat(assets): Bilder/Abbildungen pro Aufgabe (c5c6ef9)
- `migrations/009_task_assets.sql`: Neues Feld `tasks.assets jsonb NOT NULL DEFAULT '[]'`. Partial-Index `tasks_has_assets_idx` fuer schnelle Abfrage "alle Aufgaben mit mindestens einem Asset".
- `schema_content.sql` nachgezogen.
- `src/types/index.ts`: Neuer Typ `TaskAsset { url: string; alt: string; caption?: string }`. `Task.assets` von implizitem `unknown` auf `TaskAsset[]` typisiert.
- `src/lib/render/AssetList.tsx`: Neuer Renderer. Logik: 1 Asset → volle Breite zentriert, 2+ Assets → responsives 2-Spalten-Grid (`sm:grid-cols-2`). Lazy-Loading via `loading="lazy"`. `alt`-Text ist Pflichtfeld im Typ. Caption optional als `<figcaption>`.
- `scripts/import/lambacher.ts`: Neue Funktion `asAssets()` extrahiert Asset-Daten aus Roh-JSON.
- `scripts/import/PLUGIN_BRIEFING.md`: Dokumentation des Asset-Formats fuer das Chrome-Plugin.

### feat(admin): LambacherPreview-Seite (b6bcf70)
- `src/lib/supabase/tasks.ts`: Neue Funktion `getTasksBySource(source)` — laedt alle Tasks einer Quelle, sortiert nach `source_ref`.
- `src/App.tsx`: Route `/admin/lambacher-preview` eingetragen.
- `src/pages/admin/LambacherPreview.tsx` (201 Zeilen): Neue Admin-Seite zur visuellen Qualitaetspruefung importierter Aufgaben.
  - Filter-Buttons nach `content_type` mit Live-Zaehler per Typ.
  - `TaskCard`: zeigt `AssetList`, `MathContent` (question, hint, solution), Metadaten-Chips (source_ref, curriculum_ref, cognitive_type, estimated_minutes, class_level), `DifficultyDots`.
  - Hint und Loesung auf Toggle (Button "Hinweis zeigen" / "Loesung zeigen") — standardmaessig verborgen.
  - Lade- und Fehlerzustand per Card dargestellt.

## Entscheidungen

### react-markdown + KaTeX statt manueller Tokenizer
Begruendung: Der manuelle Tokenizer war auf einfache `$...$`-Muster beschraenkt und unterstuetzte kein GFM (Tabellen, Listen). Mathebuch-Inhalte kommen regelmaessig mit Tabellen und verschachtelten Listen. `react-markdown` mit der Remark/Rehype-Pipeline ist de-facto Standard, gut gewartet und deckt beide Anforderungen (GFM + LaTeX) durch separate, komponierbare Plugins ab.

### JSONB fuer assets statt separater Tabelle
Begruendung: Assets sind intrinsisch an eine Task gebunden, aendern sich selten unabhaengig und muessen immer zusammen mit der Task geladen werden. JSONB vermeidet einen JOIN, vereinfacht den Import-Skript und haelt die Migrations-Komplexitaet niedrig. Die Validierung des Formats erfolgt auf Client-Seite ueber den `TaskAsset`-TypeScript-Typ.

### Partial UNIQUE INDEX → UNIQUE CONSTRAINT (Migration 008)
Begruendung: Erzwungen durch PostgREST-Verhalten. Der partial Index war semantisch korrekt (NULL != NULL bei Postgres UNIQUE), aber inkompatibel mit der ON CONFLICT-Syntax ohne WHERE. Ein echter Constraint behebt das Problem ohne Verhaltensaenderung fuer bestehende Daten.

### LambacherPreview nur als Admin-Route
Begruendung: Die Seite ist ein internes QA-Werkzeug. Sie zeigt Loesungen und Coach-Hinweise ohne Einschraenkung — das ist fuer Schueler-Sichten verboten. Die Seite bleibt hinter der `/admin/`-Route und wird spaeter durch `ProtectedRoute allowedRoles={['admin']}` abgesichert (aktuell noch offen, siehe Offene Punkte).

## Validierung

### TypeScript-Check
`npx tsc --noEmit` laeuft ohne Fehler oder Warnungen durch. Kein Fehler-Output.

### Statische Pruefungen
- Keine Inline-Styles (`style={{`) in den geaenderten Dateien gefunden.
- Keine hardcodierten Hex-Farben ausserhalb von CSS-Dateien gefunden.
- Kein direkter Supabase-Aufruf in Komponenten oder Pages — `LambacherPreview.tsx` ruft ausschliesslich `getTasksBySource` aus `src/lib/supabase/tasks.ts` auf.
- Kein `update` oder `delete` auf `behavior_snapshots` in den geaenderten Dateien.

### Dateigroessen
| Datei | Zeilen |
|---|---|
| `src/lib/render/MathContent.tsx` | 84 |
| `src/lib/render/AssetList.tsx` | 43 |
| `src/pages/admin/LambacherPreview.tsx` | 203 |
| `src/lib/supabase/tasks.ts` | 242 |

Alle Dateien liegen unter dem 400-Zeilen-Limit.

### Diff-Groesse
Feature-Commits innerhalb der 300-LOC-Grenze. Migration 008 ist ein reines Fix-Commit (< 10 LOC effektiv).

## Design-Regel-Konformitaet

- Keine Inline-Styles: Eingehalten. Alle Styles ueber Tailwind-Klassen und CSS-Variablen (`text-foreground`, `text-muted-foreground`, `bg-secondary`, etc.).
- Keine hardcodierten Farben: Eingehalten.
- Kein direkter Supabase-Zugriff in Komponenten: Eingehalten.
- `AssetList` gibt `null` zurueck wenn `assets` leer oder nicht vorhanden — kein leerer Container.
- `MathContent` zeigt einen stilisierten Fallback-Text bei leerem `text`-Prop — kein blanker Screen.
- `LambacherPreview` zeigt Lade- und Fehlerzustaende, jedoch ohne `LoadingPulse`-Komponente (see Offene Punkte).
- Ladeindikator ist ein einfaches `<p>`-Element, kein `LoadingPulse`. Verletzt die CLAUDE.md-Regel "Nie Ladezustaende ohne LoadingPulse-Komponente".
- Leere Ergebnis-Liste wird per Card mit Text dargestellt, nicht mit `EmptyState`-Komponente. Verletzt die CLAUDE.md-Regel "Nie leere States ohne EmptyState-Komponente".
- `LambacherPreview` nutzt `<Card>` / `<CardContent>` aus shadcn/ui, nicht `EdvanceCard`. Fuer reine Admin-Qualitaetspruefungsseiten ist das akzeptabel, sollte aber dokumentiert werden.
- Touch-Targets: Filter-Buttons und Toggle-Buttons haben `size="sm"` (ca. 32px Hoehe). Fuer Admin-interne Tools tolerierbar, aber unterhalb der 44px-Pflichthoehe fuer interaktive Elemente.

## Offene Punkte

1. **`ProtectedRoute` fuer `/admin/lambacher-preview` fehlt** — die Route ist aktuell ohne Rollencheck erreichbar. Muss mit `<ProtectedRoute allowedRoles={['admin']}>` abgesichert werden, bevor die App in Produktion geht.

2. **`LoadingPulse` statt einfachem `<p>`** — `LambacherPreview` zeigt beim Laden nur "Lade Aufgaben …" als Plaintext. Laut CLAUDE.md muss `LoadingPulse` verwendet werden.

3. **`EmptyState` fuer leere Filterergebnisse** — das "Keine Aufgaben gefunden"-State ist eine einfache Card mit Text. Laut CLAUDE.md muss die `EmptyState`-Komponente verwendet werden.

4. **Button-Touch-Targets in der Preview-Seite** — Filter- und Toggle-Buttons haben `size="sm"`. Fuer eine ausschliesslich desktop-seitige Admin-Seite pragmatisch, aber nicht CLAUDE.md-konform (min 44px).

5. **Supabase Storage Bucket "task-assets"** — Migration 009 empfiehlt einen Public-Bucket fuer Asset-URLs, dieser Bucket muss noch in Supabase angelegt und RLS-Policies muessen gesetzt werden. Auto-Upload durch den Importer ist ebenfalls noch nicht implementiert.

6. **Validierung des `assets`-JSONB-Formats auf DB-Ebene** — aktuell wird das Format nur auf TypeScript-Seite validiert. Ein Postgres CHECK-Constraint oder JSON Schema Validation waere robuster gegen direkten DB-Zugriff oder Importer-Bugs.

7. **Tests fuer `getTasksBySource`** — neue Lib-Funktion in `src/lib/supabase/tasks.ts` hat kein Test-Skelett. Sollte als Integrations- oder Mock-Test abgedeckt werden.
