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
- `estimated_minutes` (number)
- `class_level` (number) — Default 8
- `competence` (string) — KMK-Kompetenzbereich-Name (z.B. "Algebra & Funktionen")
  oder Mikroskill-Code aus `src/lib/taxonomy/nrw_math_klasse8.json`
- `content_type` — `exercise` (Default), `exercise_group`, `article`, `course`

Zusatzfelder werden vom Importer aktuell ignoriert (aber nicht abgelehnt).
Wenn du regelmaessig Felder mitlieferst, die wir auswerten sollten, sag Bescheid.

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
  "estimated_minutes": 3,
  "competence": "Algebra & Funktionen"
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
