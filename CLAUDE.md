# Edvance — Claude Code Master Context

Dieses Dokument ist das zentrale Steuerungsgehirn für alle Claude Code Sessions. Es wird bei jeder Session vollständig geladen. Halte dich zu 100% an alle Regeln.

## 1. Plattform & Mission

- Produkt: Edvance – hybride Lernakademie für Schüler:innen Klasse 5–13
- Modell: Präsenz-Kleingruppen max. 5, individueller Tablet-Lernpfad, Coach-Begleitung
- Standort: Köln – Pre-Launch Phase
- Team: Rasit (Entwicklung, Reporting), Ashkan (Leads), Tolunay (Verträge, Planung)
- Tech Stack:
  - Frontend: Vite + React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui
  - Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
  - Routing: React Router v6
  - Eigene Komponenten: src/components/edvance/
- Ziel: Messbarer Lernerfolg durch datengetriebene Pädagogik + operative Effizienz

## 2. Kontext-Dateien

Lies vor jeder Aufgabe die relevanten Dateien in docs/:
- docs/PRODUCT.md – Produkt, Personas, Team
- docs/PROCESSES.md – Abläufe, Verantwortlichkeiten
- docs/SCHEMA.md – Datenbankstruktur, Rollen
- docs/ROADMAP.md – aktueller Stand, nächste Schritte

## 3. Team & Ownership Matrix

| Zone | Verantwortlich | Pflicht-Workflow |
|---|---|---|
| src/pages/** | Rasit | npx tsc --noEmit nach jeder Änderung |
| src/components/** | Rasit | /showcase prüfen nach neuen Komponenten |
| src/lib/** | Rasit | Kein direkter Supabase-Aufruf in Komponenten |
| src/context/** | Rasit | Auth- und ThemeContext nie ohne Freigabe ändern |
| supabase/migrations/** | Rasit | SQL immer in schema.sql dokumentieren |
| .env | Rasit | Niemals committen – immer in .gitignore prüfen |

## 4. Execution Hard-Limits (Der Harness)

- Bug Fixes: max 50 Zeilen pro Session. Ein Fix = Ein Commit.
- Neue Features: max 300 Zeilen pro Session. Bei Überschreitung aufteilen.
- Dateigröße: max 400 Zeilen pro Datei. Bei Überschreitung Logik auslagern.
- Fertigmeldung: Niemals "fertig" ohne npx tsc --noEmit ausgeführt und Ausgabe gezeigt.
- Auth/RLS Änderungen: Nur mit expliziter Bestätigung von Rasit.
- Keine Inline-Styles: Ausnahmslos Tailwind-Klassen oder CSS-Variablen.
- Keine hardcodierten Farben: Immer CSS-Variablen aus src/index.css.

## 5. Entwicklungs-Workflow

- Pflicht-Reihenfolge: Ändern → TypeScript prüfen → Browser testen → Committen → Pushen
- Commit-Format: feat:, fix:, refactor:, docs:, chore: als Prefix
- Vor jedem großen Feature: git add . && git commit -m "checkpoint: vor [Feature]"
- Niemals direkt auf main: Feature-Branch erstellen: git checkout -b feature/[name]

## 6. Behavior-Tracking & Diagnosedaten

- Rohdaten sind append-only: BehaviorSnapshots werden niemals überschrieben oder gelöscht
- Kind-seitig: Niemals visuelles Feedback ob Antwort richtig/falsch
- Analyse-Logik: Ausschließlich in src/lib/behaviorAnalysis.ts
- Timestamps: Immer als Millisekunden speichern, nie als formatierte Strings
- Mock vs. Real: Mock-Daten in src/lib/mockData.ts – immer klar kennzeichnen

## 7. Sicherheit & Umgebungsvariablen

- .env darf gelesen aber nie in Output oder Commits ausgegeben werden
- Vor jedem Commit prüfen ob .env in .gitignore steht
- Jede neue Tabelle braucht sofort RLS + Policies
- Auth-geschützte Routen immer via ProtectedRoute – nie manueller Rollen-Check in Pages
- Nur den anon-Key im Frontend – niemals den service_role Key

## 8. Subagent-Orchestrierung (Hub & Spoke)

- Hub (Opus): Architekturentscheidungen, Planung, strukturelle Überarbeitungen
- Spokes (Sonnet):
  - Grep-Agent: Codebase nach Pattern durchsuchen, 5-Punkte-Zusammenfassung
  - Test-Agent: TypeScript-Tests für Funktionen in [Dateipfad] schreiben
  - Review-Agent: Diff auf Bugs, TypeScript-Fehler und Design-Regelverstöße prüfen
- Consensus-Trigger: Bei Auth- oder DB-Schema-Änderungen zweite unabhängige Instanz befragen

## 9. Memory, Kontinuität & Retros

- Session-Start: Immer das neueste Dokument in docs/retros/ laden
- Nach jeder nicht-trivialen Session: docs/retros/YYYY-MM-DD-[thema].md erstellen
  - Inhalt: Was wurde gebaut, welche Entscheidungen, welche offenen Punkte
- Nach jedem abgeschlossenen Feature: docs/ROADMAP.md aktualisieren

## 10. Datenbank & Supabase-Regeln

- Timestamps: UTC in Supabase, Anzeige in Europe/Berlin
- Formatierung: new Date().toISOString() für Inserts
- BehaviorSnapshots: Append-only – kein Update, kein Delete
- Rollen-Hierarchie: admin > coach > parent > student
- Supabase-Aufrufe: Ausschließlich in src/lib/ – nie direkt in Komponenten oder Pages
- Error Handling: Jeder Supabase-Aufruf hat try/catch mit aussagekräftiger Fehlermeldung
- Schema-Änderungen: Erst in schema.sql dokumentieren, dann im Supabase SQL Editor ausführen

## 11. Design Rules – Nicht verhandelbar

Keine Inline-Styles. Keine hardcodierten Farben. Keine leeren States ohne EmptyState-Komponente. Keine Ladezustände ohne LoadingPulse. Immer EdvanceCard statt roher div für Cards. Touch-Targets min 44px Höhe. Ein primärer CTA pro Screen.

Farben ausschließlich über CSS-Variablen:
- --primary: #2D6A9F
- --primary-light: #98C0D8
- --primary-dark: #1B2A3E
- --success: #0F6E56
- --warning: #D97706
- --destructive: #DC2626
- --background: #F7F9FC
- --surface: #FFFFFF

Typografie-Hierarchie:
- Screen-Titel: text-2xl font-bold
- Section-Header: text-xs font-semibold uppercase tracking-widest text-muted
- Card-Titel: text-base font-semibold
- Body: text-sm leading-relaxed
- Metriken/KPIs: text-3xl font-bold mit Farbe je Kontext

Duolingo-Prinzipien die wir übernehmen:
- Jeden Erfolg feiern: XP, Badges, Animationen
- Fortschritt immer sichtbar: Balken, Level, Streaks
- Ein klarer primärer CTA pro Screen
- Farbe hat Bedeutung – nie nur Dekoration
- Leere Zustände sind einladend – nie nur "Keine Daten"

Komponenten-Entscheidungsbaum:
- Metriken → StatCard
- Liste von Objekten → EdvanceCard pro Item
- Status → EdvanceBadge
- Fortschritt → MasteryBar oder XPBar
- Ladezeit → LoadingPulse
- Nichts vorhanden → EmptyState
- Erfolgsmeldung → ToastBanner

Verbotene Patterns:
- Tabellen mit mehr als 4 Spalten
- Mehr als 2 CTAs pro Card
- Text-Links als primäre Aktionen
- Disabled Buttons ohne Tooltip
