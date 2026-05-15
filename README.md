# Edvance

**Hybride Lernakademie für Schüler:innen der Klassen 5–13** — Präsenzlernen in Kleingruppen (max. 5), individueller Lernpfad am Tablet, KI-gestütztes Coaching.

> Stand: Mai 2026 · Standort: Köln · Launch geplant: **Januar 2027**

---

## Was Edvance ist

Schüler lernen in Kleingruppen individuell am Tablet — geführt von einem digitalen Lernpfad, begleitet von einem Coach der interveniert und motiviert. Kein Frontalunterricht, kein klassisches LMS.

**Versprechen:** Pädagogische Qualität · Operative Effizienz · Messbarer Lernerfolg

---

## Aktueller Stand

### Technische Plattform — läuft

| Bereich | Status |
|---|---|
| Auth + Rollen (student / coach / parent / admin) | ✓ |
| Aufgaben-Datenbank (Supabase Postgres) | ✓ |
| Lambacher Schweizer 8 NRW importiert | ✓ |
| Schüler-Interface: Aufgabe lesen, antworten, nächste | ✓ |
| Eingabe-Widgets: MC, Zuordnung, Schritte, Freitext, Zeichnen | ✓ |
| Behavior-Tracking (Tipp-Verhalten, Hints, Zeit) | ✓ |
| Asset-System: Bilder zu Aufgaben (Upload + KI-generiert) | ✓ |
| Admin-Vorschau aller importierten Aufgaben | ✓ |
| Coach-Dashboard (Basis) | ✓ |
| Gamification: XP, Badges, Mastery-Bar | ✓ |

### Didaktische Schicht — fängt bei 0 an

> **Klartext:** Die technischen Bausteine existieren. Die pädagogische Logik, die darüber liegt, ist noch nicht implementiert — und was auf Papier definiert wurde, gilt als verworfen. Wir bauen die Didaktik jetzt neu auf, evidenzbasiert und pragmatisch.

Was fehlt und neu konzipiert werden muss:

| Bereich | Status |
|---|---|
| Lernpfad-Generierung (welche Aufgabe kommt wann) | ✗ nicht implementiert |
| Mastery-Algorithmus (wie wird Kompetenz gemessen) | ✗ nicht implementiert |
| Hint-System (3-stufig, ohne Lösung) | ✗ nicht implementiert |
| Adaptive Schwierigkeit je Schüler | ✗ nicht implementiert |
| Home-Quests (automatisch post-session) | ✗ nicht implementiert |
| Session-Cases (A–E: KA-Vorbereitung, Lückenschluss, …) | ✗ nicht implementiert |
| Eddy (KI-Studybuddy) | ✗ nicht implementiert |
| Eltern-Reporting | ✗ nicht implementiert |
| Diagnose → Lernpfad-Einstieg | ⚡ Prototyp vorhanden, nicht produktionsreif |

---

## Team

| Person | Rolle |
|---|---|
| **Rasit** | Entwicklung, Strategie, pädagogische QS |
| **Ashkan** | Leads, Marketing |
| **Tolunay** | Verträge, Admin, Finanzen |

Pädagogische Begleitung: Sonderpädagogin (15 J. Erfahrung) + Pool von Lehramtsstudierenden als Coaches.

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS v4 |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) |
| Routing | React Router v6 |
| KI (Assets + Eddy später) | Anthropic Claude API |
| Deployment | — (noch nicht aufgesetzt) |

```
src/
├── components/edvance/   Eigene UI-Primitives (Card, Badge, …)
│   └── tasks/            Aufgaben-spezifische Widgets
├── pages/
│   ├── student/          Schüler-Interface (Dashboard, TaskPlayer, …)
│   ├── coach/            Coach-Dashboard
│   ├── admin/            Admin + Lambacher-Preview
│   └── parent/           Eltern-Interface (Basis)
├── lib/
│   ├── supabase/         Alle DB-Calls (nie direkt in Komponenten)
│   └── render/           MathContent, AssetList, Parser
├── types/                TypeScript-Typen inkl. Payload-Schema
└── hooks/                useAuth, useBehaviorTracker, …
```

---

## Aufgaben-Datenbank

| Quelle | Tag | Stand |
|---|---|---|
| Lambacher Schweizer 8 NRW | `mathebuch_lambacher_8_nrw` | ✓ importiert |
| KI-generiert | `ki_generiert` | — in Planung |
| Manuell | `manuell` | — |

Aufgaben haben `input_type` (MC / FREE_INPUT / STEPS / MATCHING / DRAW) und `question_payload` (strukturierte Daten für MC-Optionen, Zuordnungspaare, Schritte). Die importierten Lambacher-Tasks haben noch kein `question_payload` — das ist der nächste Schritt.

---

## Lokale Entwicklung

```bash
cp .env.example .env        # Supabase-Keys + Anthropic-Key eintragen
npm install
npm run dev                  # http://localhost:5173
```

Demo ohne Login: `http://localhost:5173/demo/widgets`

Scripts:
```bash
npm run import:lambacher     # Mathebuch-Aufgaben importieren
npm run generate:assets      # SVG-Illustrationen via Claude generieren (dry-run)
npm run generate:assets -- --write --limit 5   # tatsächlich schreiben
```

---

## Offene Punkte (priorisiert)

### Sofort
- [ ] `question_payload` für Lambacher-Tasks befüllen (MC, STEPS, MATCHING)
- [ ] Didaktisches Konzept: Lernpfad-Grundlogik definieren (womit fangen wir an?)
- [ ] Mastery: wie messen wir Kompetenz — welche Signale zählen?

### Nächste Wochen
- [ ] Hint-System implementieren (3 Stufen, nie die Lösung)
- [ ] Session-Flow: was passiert von Login bis Aufgabe?
- [ ] Coach-Dashboard: was braucht ein Coach live in der Session?

### Mittelfristig
- [ ] Diagnose-Einstieg produktionsreif machen
- [ ] Eltern-Report (einfache Version)
- [ ] Home-Quests

---

## Branch-Strategie

- `main` — nur via PR aus `dev`, Milestones
- `dev` — Standard-Arbeitsbranch
- `feature/[name]` — größere Features (>1 Session)

---

## Lizenz / Rechtliches

- Lambacher Schweizer: Lizenz mit Klett zu klären vor öffentlichem Betrieb
- DSGVO: AVV + Datenschutzerklärung (inkl. KI-Einwilligung Minderjährige) steht aus
