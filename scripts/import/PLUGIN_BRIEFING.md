# Briefing fuer Plugin-Claude (Chrome) — Lambacher Schweizer 8 NRW

Du arbeitest in Chrome auf einer Buchseite von Lambacher Schweizer 8. Klasse NRW.
Aufgabe: Aufgaben extrahieren und als JSON-Datei speichern, damit der
Edvance-Importer (`scripts/import/lambacher.ts`) sie in Supabase laden kann.

## Output-Format (locker, der Importer ist tolerant)

Pro Datei kannst du **ein einzelnes Objekt** oder ein **Array** schreiben.
Der Importer akzeptiert beides.

### Pflichtfeld
- `question` (string) — Aufgabenstellung als Markdown.
  - Inline-Math: `$...$`
  - Display-Math: `$$...$$`

### Stark empfohlen (sonst geht Idempotenz verloren)
Liefert mindestens 2 der 3 fuer einen stabilen Referenz-Schluessel:
- `chapter` (string oder number) — Kapitel/Lektion
- `page` (string oder number) — Buchseite
- `task_number` (string oder number) — Aufgabennummer (z.B. "5b" oder 12)

Der Importer baut daraus `source_ref` z.B. `kap3.s42.nr5b`.

### Optional
- `title` (string) — Aufgabenueberschrift falls vorhanden
- `solution` (string) — Loesung/Loesungsweg, Markdown+LaTeX wie question
- `hint` (string) — Tipp/Hilfestellung
- `difficulty` (number 1..5)
- `competence` (string) — **Topic-Code** aus der NRW-Klasse-8-Taxonomie
  (siehe Tabelle unten). Wenn gesetzt, uebernimmt der Importer
  `estimated_minutes`, `cognitive_type` und `curriculum_ref` automatisch.
- `estimated_minutes` (number) — **nur setzen, wenn die Aufgabe deutlich
  vom Topic-Default abweicht** (z.B. mehrstufige Pythagoras-Konstruktion).
  Sonst leer lassen → Wert kommt aus der Taxonomie.
- `class_level` (number) — Default 8
- `content_type` — `exercise` (Default), `exercise_group`, `article`, `course`
- `assets` (array) — Bilder/Abbildungen die zur Aufgabe gehoeren.
  Format pro Eintrag: `{ "url": "...", "alt": "...", "caption": "..." }`.
  `url` + `alt` Pflicht, `caption` optional. Eintraege ohne url/alt werden
  vom Importer stillschweigend verworfen.

  **Speicher-Empfehlung:** Public Storage-Bucket `task-assets` in Supabase
  (im Studio: Storage → New Bucket → Name `task-assets`, Public ✓).
  Datei hochladen, Public-URL kopieren, in `url` setzen.

  **Wichtig:** Klett-CDN-URLs (z.B. Bilder hinter Login) funktionieren in
  unserer App nicht — bitte selbst nachzeichnen/scannen und in den eigenen
  Bucket laden, oder das Asset weglassen und im `alt` beschreiben.

  Beispiel:
  ```json
  "assets": [
    {
      "url": "https://<projekt>.supabase.co/storage/v1/object/public/task-assets/kap01/wuerfel-ventilkappe.png",
      "alt": "Wuerfel mit schwerem Metallgewinde auf Seite 1",
      "caption": "Abb. 1"
    }
  ]
  ```

Zusatzfelder werden vom Importer aktuell ignoriert (aber nicht abgelehnt).
Wenn du regelmaessig Felder mitlieferst, die wir auswerten sollten, sag Bescheid.

## Topic-Codes (Klasse 8 NRW)

| Code | Topic | Default-Minuten |
|---|---|---|
| `M8.ZR.01` | Bruchrechnung sicher anwenden | 3 |
| `M8.ZR.02` | Prozentwert, Grundwert, Prozentsatz | 4 |
| `M8.ZR.03` | Zinsrechnung mit Zeitanteilen | 5 |
| `M8.ZR.04` | Rationale Zahlen: Vorzeichenregeln | 3 |
| `M8.AF.01` | Terme aufstellen und vereinfachen | 3 |
| `M8.AF.02` | Lineare Gleichungen loesen | 4 |
| `M8.AF.03` | Lineare Funktionen interpretieren | 4 |
| `M8.AF.04` | Textaufgabe in lineare Gleichung uebersetzen | 5 |
| `M8.GM.01` | Flaecheninhalte ebener Figuren | 3 |
| `M8.GM.02` | Volumen und Oberflaeche von Prisma und Zylinder | 4 |
| `M8.GM.03` | Satz des Pythagoras anwenden | 5 |
| `M8.DZ.01` | Daten in Diagrammen darstellen und ablesen | 3 |
| `M8.DZ.02` | Mittelwert, Median und Spannweite berechnen | 3 |
| `M8.DZ.03` | Wahrscheinlichkeit einstufiger Zufallsexperimente | 4 |
| `M8.SM.01` | Dreisatz bei direkter Proportionalitaet | 3 |
| `M8.SM.02` | Tarif- und Kostenmodelle vergleichen | 5 |
| `M8.SM.03` | Mehrschrittige Anwendungsaufgaben | 5 |

Wenn keine Zuordnung passt: `competence` weglassen. Der Importer warnt
nicht — aber `estimated_minutes` fallen auf Default 3 zurueck und die
Aufgabe ist nicht via Topic auffindbar.

## Speicherort

```
scripts/import/raw/lambacher-8-nrw/
  kap03_terme/
    s42-nr5.json
    s42-nr6.json
  kap04_gleichungen/
    s58-nr1.json
```

Pfade sind nur fuer Menschen lesbar — der Importer crawled rekursiv und
nutzt nur die JSON-Inhalte, nicht die Verzeichnisnamen.

## Beispiel — ein einzelner Eintrag

```json
{
  "chapter": 3,
  "page": 42,
  "task_number": "5b",
  "title": "Terme vereinfachen",
  "question": "Vereinfache: $3x + 2(x - 4) - 5$",
  "solution": "$3x + 2x - 8 - 5 = 5x - 13$",
  "hint": "Klammer aufloesen, dann gleichartige Terme zusammenfassen.",
  "difficulty": 2,
  "competence": "M8.AF.01"
}
```

## Beispiel — mehrere Aufgaben in einer Datei

```json
[
  { "chapter": 3, "page": 42, "task_number": "1", "question": "$a + b = ?$" },
  { "chapter": 3, "page": 42, "task_number": "2", "question": "$a - b = ?$" }
]
```

## Was NICHT mitschicken
- Keine ganzen Buchseiten als JSON-Blob — bitte einzelne Aufgaben.
- Keine Bild-URLs, die hinter Klett-Login liegen (die laden in unserer App
  nicht). Falls Bilder noetig: spaeter eigene Loesung.
- Kein HTML — nur Markdown + LaTeX.

## Wie der Importer laeuft

```
# Dry-Run (validiert, schreibt nichts)
npx tsx --env-file=.env scripts/import/lambacher.ts

# Tatsaechlich schreiben
npx tsx --env-file=.env scripts/import/lambacher.ts --write
```

Jeder Lauf legt ein Log unter `scripts/import/runs/<timestamp>.json` ab.
