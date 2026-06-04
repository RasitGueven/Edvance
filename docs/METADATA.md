# Edvance – Aufgaben-Metadaten (Konzept)

> **Status:** Konzept / Proposal — **noch nicht migriert.**
> Diese Datei beschreibt das Zielbild für erweiterte Aufgaben-Metadaten
> (Haupt-/Nebenkompetenz + weitere sinnvolle Felder) über **beide** Aufgaben-
> Modelle hinweg. Der reale DB-Stand steht weiterhin in `SCHEMA.md` /
> `schema_content.sql`. Migrationen (037+) und TypeScript-Typen entstehen
> **erst nach Freigabe** (Schema-Änderung, vgl. CLAUDE.md §10).
>
> **Stand:** 2026-06-04 · **Owner:** Rasit
>
> **Getroffene Entscheidungen (2026-06-04):**
> 1. Reichweite: **beide** Modelle (`tasks` + `screening_items`).
> 2. Kompetenz-Modellierung: **Referenztabelle `competencies`** (keine losen Strings).
> 3. Vorgehen: erst dieses Konzept, dann Code.

---

## 1. Motivation

Heute existieren **zwei getrennte Aufgaben-Modelle** mit unterschiedlichem
Vokabular:

| Modell | Tabelle | Kompetenz-Verortung heute |
|---|---|---|
| Lern-Aufgaben | `tasks` (`schema_content.sql`) | `microskill_id` + `cluster_id`, `difficulty` (1–5), `cognitive_type` |
| Diagnose / VERA-8 | `screening_items` (Migration 022/029) | `topic`/Leitidee, `skill_code`, `kompetenzfelder[]`, `afb` (I/II/III) |

Daraus drei Lücken:

1. **Keine prozessbezogenen Kompetenzen.** Die KMK-Bildungsstandards Mathe
   kennen zwei Achsen: *inhaltsbezogen* = Leitideen **L1–L5** (habt ihr via
   `topic`/`kompetenzfelder`) und *prozessbezogen* = allgemeine Kompetenzen
   **K1–K6** (fehlt komplett). IQB kodiert jede VERA-Aufgabe mit beiden.
2. **Keine Haupt-/Nebenkompetenz.** Eine Aufgabe verweist heute auf genau
   *einen* Skill/Cluster. Eine dominante Kompetenz + mehrere beteiligte
   (mit Gewichtung) ist nicht abbildbar.
3. **Kein gemeinsames Vokabular.** `tasks` und `screening_items` driften
   auseinander — Filter, Reporting und adaptive Logik müssen je Tabelle
   anders gebaut werden.

---

## 2. Zielbild

Ein gemeinsames, **fachfähiges** Metadaten-Vokabular über beide Modelle:

- Eine Referenztabelle **`competencies`** (fachspezifisch; vereint *prozess*-
  und *inhalts*bezogene Kompetenzen).
- **Haupt-/Nebenkompetenz** als rollenmarkierte Verknüpfung pro Aufgabe.
- Zusätzliche skalare Metadatenfelder (Didaktik, Format, Empirie, Lifecycle) —
  wo sinnvoll auf beide Tabellen gespiegelt.

---

## 3. Referenztabelle `competencies`

Vereint **inhaltsbezogene** (Leitideen) und **prozessbezogene** (K)
Kompetenzen in einer Tabelle — **fachspezifisch**, weil Deutsch und Englisch
andere Kompetenzmodelle haben als Mathe.

```sql
create table competencies (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  kind        text not null check (kind in ('prozess','inhalt')),
  code        text not null,             -- 'K1'..'K6', 'L1'..'L5'
  name_key    text not null,             -- i18n-Key, NICHT der deutsche Text (§12)
  description text,
  sort_order  integer default 0,
  active      boolean not null default true,
  created_at  timestamptz default now(),
  unique (subject_id, code)
);
create index competencies_subject_kind_idx on competencies (subject_id, kind);
```

**i18n (CLAUDE.md §12):** `name_key` ist ein i18n-Key (z.B.
`competency.math.K2`), **nicht** der deutsche Klartext. Code-Konstanten
(`K1`, `L3`) bleiben unübersetzt und werden beim Anzeigen über `t()` gemappt —
analog zum bestehenden `t('inputType.STEPS_FINAL')`-Muster.

### Seed – Mathematik · prozessbezogen (`kind='prozess'`)

| code | name_key | de (Anzeige) |
|---|---|---|
| K1 | `competency.math.K1` | Mathematisch argumentieren |
| K2 | `competency.math.K2` | Probleme mathematisch lösen |
| K3 | `competency.math.K3` | Mathematisch modellieren |
| K4 | `competency.math.K4` | Mathematische Darstellungen verwenden |
| K5 | `competency.math.K5` | Mit symbolischen/formalen/technischen Elementen umgehen |
| K6 | `competency.math.K6` | Mathematisch kommunizieren |

### Seed – Mathematik · inhaltsbezogen (`kind='inhalt'`, Leitideen)

Spiegelt `LEITIDEE_BY_CODE` aus `scripts/seed_vera8.ts`:

| code | name_key | de (Anzeige) |
|---|---|---|
| L1 | `competency.math.L1` | Zahl |
| L2 | `competency.math.L2` | Messen |
| L3 | `competency.math.L3` | Raum und Form |
| L4 | `competency.math.L4` | Funktionaler Zusammenhang |
| L5 | `competency.math.L5` | Daten und Zufall |

> Deutsch (Sprechen/Zuhören, Schreiben, Lesen, Sprache untersuchen) und
> Englisch (kommunikativ, interkulturell, methodisch) werden bei Fach-Launch
> ergänzt — die Tabellenstruktur trägt sie bereits.

**RLS:** Lesen für alle authentifizierten User, Schreiben nur Admin
(wie `subjects` / `skill_clusters`).

---

## 4. Haupt-/Nebenkompetenz-Verknüpfung

Eine **rollenmarkierte Join-Tabelle pro Modell**. Bildet *Haupt* (genau eine)
+ *Neben* (0..n) ab — und zugleich mehrere Leitideen, falls eine Aufgabe
mehrere Inhaltsbereiche berührt. `kind` wird denormalisiert mitgeführt, damit
der „≤ 1 Hauptkompetenz pro Achse"-Constraint als einfacher Partial-Index
funktioniert.

```sql
create table task_competencies (
  task_id       uuid not null references tasks(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  kind          text not null check (kind in ('prozess','inhalt')), -- == competencies.kind
  rolle         text not null check (rolle in ('haupt','neben')),
  primary key (task_id, competency_id)
);
-- Maximal EINE Hauptkompetenz je Aufgabe und Achse (prozess/inhalt):
create unique index task_competencies_one_haupt
  on task_competencies (task_id, kind) where rolle = 'haupt';

-- analog für Diagnose/VERA:
create table screening_item_competencies (
  screening_item_id uuid not null references screening_items(id) on delete cascade,
  competency_id     uuid not null references competencies(id) on delete cascade,
  kind              text not null check (kind in ('prozess','inhalt')),
  rolle             text not null check (rolle in ('haupt','neben')),
  primary key (screening_item_id, competency_id)
);
create unique index screening_item_competencies_one_haupt
  on screening_item_competencies (screening_item_id, kind) where rolle = 'haupt';
```

- **Hauptkompetenz** = `rolle='haupt'` (je Achse genau eine; per Index erzwungen).
- **Nebenkompetenzen** = `rolle='neben'` (beliebig viele).
- `kind` muss zu `competencies.kind` passen — abgesichert per Trigger oder
  in der Schreib-Schicht (`src/lib/`).

**RLS:** Lesen für alle authentifizierten User; Schreiben nur Admin.

> **Alternative (verworfen):** skalare Spalten `haupt_kompetenz_id uuid` +
> `neben_kompetenz_ids uuid[]`. Schneller migriert, aber keine referenzielle
> Integrität auf dem Array und keine saubere Mehrfach-Auswertung. Da
> „Referenztabelle" gewählt wurde, ist die Join-Tabelle konsequent.

---

## 5. Weitere sinnvolle Metadaten

✅ = existiert bereits · ➕ = neu vorgeschlagen · Modell: `tasks` / `items` / **beide**

| Gruppe | Feld | Typ | Modell | Status | Zweck |
|---|---|---|---|---|---|
| **Kompetenz** | Haupt-/Nebenkompetenz | Join (§4) | beide | ➕ | prozess + inhalt, gewichtet |
| | Leitidee / Inhaltsbereich | – | items | ✅ | `topic` / `kompetenzfelder` |
| | AFB I/II/III | – | items | ✅ | `afb` |
| **Empirie** | `p_wert` | numeric | beide | ➕ | reale Lösungsquote (Item-Schwierigkeit) |
| | `trennschaerfe` | numeric | beide | ➕ | Diskrimination stark/schwach |
| | `irt_b` / `irt_a` | numeric | items | ➕ | Item-Parameter für `adaptive.ts` |
| | `avg_duration_ms` | integer | beide | ➕ | reale vs. geschätzte Zeit |
| | `n_attempts` | integer | beide | ➕ | Stichprobengröße (Vertrauen in Empirie) |
| **Didaktik** | `misconception_codes` | text[] | beide | ➕ | strukturierte Fehlvorstellungen → Intervention |
| | `voraussetzungen` | text[] (skill_code) | beide | ➕ | Prerequisite je Aufgabe (heute nur `microskills`) |
| | `loesungsstrategie` | text | beide | ➕ | didaktischer Lösungsweg |
| | typische Fehler / Hinweise | – | beide | ✅ | `typical_errors`, `hint`, `coach_note`, `explanation`, `kodierung` |
| **Format** | `rechner_erlaubt` | boolean | beide | ➕ | Taschenrechner — VERA-Pflichtmetadatum |
| | `sprachniveau` | text | beide | ➕ | DaZ/Lesbarkeit (Zielgruppe Köln) |
| | Input-/Content-Typ, Zeit, Assets | – | beide | ✅ | `input_type`, `content_type`, `estimated_minutes`, `assets`, `teilaufgaben` |
| **Lifecycle** | `qs_status` | text | beide | ➕ | `draft`→`review`→`approved` (statt nur `active`) |
| | `lizenz` | text | beide | ➕ | **wichtig** bei IQB/VERA — Nutzungsrechte |
| | `version` | integer | beide | ➕ | Änderungsstand |
| | `autor_id` / `reviewed_by` | uuid → profiles | beide | ➕ | Verantwortung / QS-Trail |
| | `tags` | text[] | beide | ➕ | freie, querschnittliche Verschlagwortung |
| | Quelle / Aktiv | – | beide | ✅ | `source`/`source_ref`/`quelle`, `is_active`/`active`, `iqb_titel` |

---

## 6. Empirische Item-Statistik (Detail)

`p_wert`, `trennschaerfe`, `avg_duration_ms`, `n_attempts` sind **abgeleitet**
aus `screening_item_results` bzw. `student_task_progress` — sie gehören nicht
in den Schreibpfad der Antworten.

**Empfehlung:** eine View `screening_item_stats` (on-the-fly korrekt) plus
optionale nächtliche Materialisierung in Statistik-Spalten, damit die adaptive
Engine zur Laufzeit schnell liest, ohne live zu aggregieren. Höchster Hebel
für `src/lib/screening/adaptive.ts` und das Edvance-Ziel „messbarer
Lernerfolg".

---

## 7. Delta pro Tabelle (geplante Spalten)

Neue **skalare** Felder (Kompetenzen laufen über die Join-Tabellen aus §4):

**`tasks`** (`schema_content.sql`)
`misconception_codes text[]`, `voraussetzungen text[]`, `loesungsstrategie text`,
`rechner_erlaubt boolean`, `sprachniveau text`, `qs_status text`, `lizenz text`,
`version integer default 1`, `autor_id uuid`, `reviewed_by uuid`, `tags text[]`,
`p_wert numeric`, `trennschaerfe numeric`, `avg_duration_ms integer`, `n_attempts integer`.

**`screening_items`** (Migration 029 erweitern)
identische Felder wie oben **plus** `irt_a numeric`, `irt_b numeric`.

> `cognitive_type`, `difficulty`, `afb`, `level`, `curriculum_ref` bleiben wie
> sie sind. `qs_status` ergänzt das bestehende `active`-Boolean (Übergang:
> `active = (qs_status = 'approved')`).

---

## 8. TypeScript-Typen (Vorschau, nicht final)

```ts
// src/types/content.ts
export type CompetencyKind = 'prozess' | 'inhalt'
export type CompetencyRole = 'haupt' | 'neben'

export type Competency = {
  id: string
  subject_id: string
  kind: CompetencyKind
  code: string        // 'K1'..'K6' | 'L1'..'L5'
  name_key: string    // i18n-Key
  description: string | null
  sort_order: number
  active: boolean
}

export type TaskCompetency = {
  competency_id: string
  kind: CompetencyKind
  rolle: CompetencyRole
}

// Task / ScreeningItem erhalten optional:
//   competencies?: TaskCompetency[]
//   + die skalaren Felder aus §7
```

Anzeige immer über i18n: `t(competency.name_key)` bzw.
`t('competency.role.haupt')`. Enum-Werte (`prozess`, `haupt`, `qs_status`,
`lizenz`) werden **nie** als deutscher Text gespeichert, sondern beim Rendern
gemappt (§12).

---

## 9. Migrationsplan (nach Freigabe)

| Nr | Inhalt | Idempotenz |
|---|---|---|
| 037 | `competencies` + RLS + Seed (Mathe K1–K6, L1–L5) | `unique(subject_id, code)`, Upsert |
| 038 | `task_competencies` + `screening_item_competencies` + RLS + Partial-Index | `create table if not exists` |
| 039 | skalare Metadatenfelder auf `tasks` + `screening_items` | `add column if not exists` |
| 040 | View/Materialisierung `screening_item_stats` + Backfill Empirie | idempotente View |

**Backfill bestehender VERA-Items:** `topic`/Leitidee → `inhalt`-Hauptkompetenz;
`kompetenzfelder[]` → ggf. `inhalt`-Nebenkompetenzen. Prozesskompetenzen
(K1–K6) müssen kodiert werden (Coach/Admin oder KI-Vorschlag).

**Dokumentationspflicht (§10):** nach jeder Migration `schema_content.sql`
bzw. `schema.sql` + `SCHEMA.md` nachziehen.

---

## 10. Offene Entscheidungen (vor Migration zu klären)

1. **„≤ 1 Haupt pro Achse"** via denormalisiertem `kind` + Partial-Index
   (vorgeschlagen) oder via Trigger?
2. **Empirie** materialisiert (Spalten, nächtlich) oder reine View?
3. **`lizenz`** Pflichtfeld für `source='VERA8_IQB'`? IQB-Nutzungsrechte mit
   Tolunay (Verträge) klären, bevor VERA-Material breiter genutzt wird.
4. **`qs_status`** ersetzt `active` oder bleibt additiv (Übergangsphase)?
5. **Deutsch/Englisch** Kompetenzmodelle jetzt schon seeden oder erst bei
   Fach-Launch?
6. **i18n-Namespace** für Kompetenz-Namen: bestehendes `common` oder neues
   `content`-Namespace?
