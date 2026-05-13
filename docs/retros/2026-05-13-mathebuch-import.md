# Retro: Mathebuch-Import-Pipeline (Lambacher 8 NRW)
Datum: 13.05.2026

## Was wurde gebaut

### Pipeline-Skelett
- `scripts/import/lambacher.ts` — Importer fuer Lambacher Schweizer 8 NRW
  - Liest rekursiv alle `*.json` unter `scripts/import/raw/lambacher-8-nrw/`
  - Normalisiert Roh-JSONs (locker, tolerant gegenueber Plugin-Output-Drift)
  - Upsert nach `tasks` via `(source, source_ref)` Unique-Constraint → idempotent
  - Modi: Default Dry-Run, `--write` schreibt tatsaechlich nach Supabase
  - Run-Log pro Lauf in `scripts/import/runs/<timestamp>.json`
- `scripts/import/PLUGIN_BRIEFING.md` — Briefing fuer Chrome-Plugin-Claude
  - Output-Format (single object oder array), Pflichtfeld `question`, Empfehlung chapter+page+task_number fuer stabilen `source_ref`
  - Topic-Code-Tabelle (17 Microskills aus NRW Klasse 8) fuer automatische Anreicherung von `estimated_minutes`, `cognitive_type`, `curriculum_ref`

### Microskill-Lookup
- Importer laedt `src/lib/taxonomy/nrw_math_klasse8.json` und mappt `competence`-Code → TopicInfo
- Wenn `competence` gesetzt aber nicht in Taxonomie → wird in `unknownCompetences` gesammelt und am Ende geloggt
- Werte aus Roh-JSON haben Vorrang vor Taxonomie-Defaults

### Datenbank-Migrationen (manuell im Supabase Studio ausgefuehrt)
- 005 `diagnostic_fields.sql`: `tasks.cognitive_type`, `input_type`, `is_diagnostic`, `curriculum_ref`, `question_payload`, `typical_errors`; `microskills.cognitive_type`, `estimated_minutes`, `curriculum_ref`; zwei Diagnostic-Indizes
- 006 `remove_serlo.sql`: alle `serlo_*`-Spalten weg, Serlo-Tasks geloescht (Tasks-Tabelle danach leer)
- 007 `task_source.sql`: `tasks.source` (NOT NULL default `'unbekannt'`), `tasks.source_ref`; UNIQUE-Index `(source, source_ref)` (partial WHERE source_ref IS NOT NULL); Filter-Index `tasks_source_idx`

### Repo-Sync
- `schema_content.sql` auf den realen DB-Stand gebracht: neue Spalten in `tasks` + `microskills`, vier neue Indizes, Kopfkommentar markiert „Stand: Migration 007 inklusive"

## Entscheidungen

- **`source` mit Default `'unbekannt'` statt NULL:** Auch wenn Migration 006 die Tabelle leer gemacht hat, macht der Default `ALTER ADD NOT NULL` sauber und kostet bei zukuenftigen manuellen Inserts ohne `source` keine Fehler — der Wert ist offensichtlich falsch und faellt im Filter sofort auf.
- **`source_ref` als Partial-Unique-Index, nicht NOT NULL:** Manuell angelegte Aufgaben ohne klare Buchreferenz sollen erlaubt bleiben. Idempotenz greift nur fuer Quellen, die ein `source_ref` mitliefern.
- **PLUGIN_BRIEFING.md im Repo, nicht in docs/:** Das Briefing ist Teil der Import-Pipeline-Doku, nicht der Produkt-Doku — daher direkt neben dem Importer-Code.
- **`schema_content.sql` als kumulativer Snapshot statt Migrations-Ersatz:** Migrationen 005–007 bleiben als Audit-Trail in `migrations/`, `schema_content.sql` spiegelt den realen Stand fuer Greenfield + Lese-Referenz.

## Validierung
- `npx tsc --noEmit` → Exit 0
- `npm run import:lambacher` → "17 Microskill(s) aus Taxonomie geladen", "0 Datei(en) gefunden in scripts/import/raw/lambacher-8-nrw" (erwartet — `raw/` ist leer)
- DB-Verifikation im Supabase Studio durch Rasit ausgefuehrt (Migrations 005–007 idempotent angewandt)

## Offene Punkte
- **Erster Lambacher-Content-Drop steht aus.** Owner + Kapitel-Auswahl + Deadline noch nicht definiert. Mein Vorschlag: 1 Kapitel × 15–25 Aufgaben als ersten End-to-End-Test.
- **`schema_content.sql` und `schema.sql` doppeln `subjects`-Definition.** Der Kommentar warnt, aber die Konsolidierung steht noch aus.
- **ROADMAP.md behauptet "Fertig: EdvanceCard, MasteryBar, XPBar, StatCard, Badges, EmptyState, LoadingPulse"** — die Komponenten existieren nicht in `src/components/edvance/`. Diskrepanz ist im 2026-05-08-Retro geflaggt, aber weiter offen. Spaetestens vor dem Schueler-Tablet-View entscheiden.
- **Vier zombie `feature/*`-Branches lokal** (content-schema, diagnosis-engine, diagnostic-engine, student-learning-path) — alle bereits in `dev` integriert (0 unmerged commits), nur Pointer-Cleanup noetig.
