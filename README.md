# Edvance

**Hybride Lernakademie für Schüler:innen der Klassen 5–13** — Präsenzlernen in Kleingruppen, individueller Lernpfad am Tablet, KI-gestütztes Coaching.

> Stand: Mai 2026 · Launch geplant: **Januar 2027** in Köln

---

## Vision

Edvance kombiniert pädagogische Qualität mit operativer Effizienz und messbarem Lernerfolg. Statt klassischer Nachhilfe lernen Schüler:innen in Kleingruppen (max. 5 pro Raum) individuell am Tablet — geführt von einem KI-generierten Lernpfad und begleitet von einem Coach, der interveniert, strukturiert und motiviert. Kein Frontalunterricht.

**Kern-Versprechen:** Pädagogische Qualität · Operative Effizienz · Messbarer Lernerfolg

---

## Team & Setup

### Gründerteam (ab Mai 2026)

| Person | Rolle / Schwerpunkt | Präsenz |
| --- | --- | --- |
| **Rasit** | Strategie, Plattform, Reporting & Elternkommunikation, pädagogische QS | täglich vor Ort |
| **Ashkan** | Leadgewinnung, Erstkontakt, Marketing | 4×/Woche |
| **Tolunay** | Vertrag & Zahlung, Admin, Finanzen | 3×/Woche |

Standort ist ausschließlich **Köln**. Das Team trifft sich 3×/Woche physisch.

### Pädagogische Qualitätssicherung

- **Sonderpädagogin** (15 Jahre Erfahrung) übernimmt pädagogische QS
- **Pool von 5–6 Lehramtsstudierenden** als Coaches — werden intern auf das Edvance-Modell geschult (nicht klassische Nachhilfe-Logik)

---

## Produkt-Konzept

### Lernsession (Präsenz)

- Kleingruppen mit max. 5 Lernenden pro Raum
- Individueller Lernpfad je Session (Cases A–E, z. B. Klassenarbeitsvorbereitung, Lückenschluss, HA-Vertiefung)
- Aufgaben mit **3-stufigen Hints** — niemals die Lösung
- Hausaufgaben-Upload mit OCR-Analyse
- Coach mit Echtzeit-Dashboard, Interventions-Flags und Mastery-Bestätigung

### Home-Quests (Post-Session)

Nach jeder Präsenz-Session generiert das System automatisch 1–3 Home-Quests:

| Quest-Typ | Trigger | Ziel |
| --- | --- | --- |
| Klassenarbeit-Quest | KA im Kalender | KA-relevante Aufgaben wiederholen |
| Hausaufgaben-Quest | HA in Session eingebunden | HA-Verständnis vertiefen |
| Lücken-Quest | Schwacher Mikro-Skill | Lücke mit 2–3 Aufgaben schließen |

### Eddy — KI-Studybuddy (Lite im MVP)

Reaktiver KI-Assistent im Schüler-Interface. Wird nur aktiv, wenn das Kind ihn anspricht.

**Was Eddy kann:**
- Fragen beantworten und auf passende Aufgaben verweisen
- Home-Quests vorschlagen
- Auf das Lexikon (gefilterte Aufgaben-DB nach Thema/Level) verlinken

**Hard Rules:**
- Nennt nie direkte Lösungen
- Ändert nie das Mastery-Level (bleibt beim Coach)
- Fach-Isolation: keine fachübergreifenden Antworten

**Kompetenz-adaptive Kommunikation** je Mastery-Level (1–10) — von führend/ermutigend (Anfänger) bis peer-level/herausfordernd (fortgeschritten).

---

## Technologie-Stack

| Bereich | Entscheidung | Begründung |
| --- | --- | --- |
| Backend / DB / Auth | **Supabase** (Postgres + Auth + Realtime + Storage + Edge Functions) | Deckt alle Anforderungen ab — kein LMS-Overhead, deutlich schnellere Time-to-Launch als ein LMS-basiertes Setup |
| Frontend | **Komplett custom** (React o. ä.) | Volle Kontrolle über UX und Lernpfad-Logik |
| Aufgaben-Datenbank | **Lehrbuch-Import (Lambacher Schweizer NRW) + KI-generiert + manuell** | Daten liegen in Supabase Postgres |
| KI / Eddy | **Eine API-Lizenz** (z. B. Anthropic Claude) | Pro-Nachricht-Abrechnung, kein Pro-Kind-Modell |
| Hint-Anreicherung | **KI-Pipeline** über importierte Aufgaben | Team & QS prüfen und geben frei |
| Echtzeit (Coach-Dashboard) | **Supabase Realtime** | Live-Sync der Schüler-Aktivität ins Coach-Dashboard ohne separate Infrastruktur |

> **Hinweis:** Eine frühere Variante mit **Moodle (headless)** als Backend wurde verworfen. Edvance braucht kein klassisches LMS — Supabase deckt Auth, Rollen, Datenbank und Realtime in einem Stack ab.

---

## MVP-Scope (Launch Januar 2027)

### Im MVP

**Schüler-Interface**
- Individueller Lernpfad je Session (Cases A–E)
- Aufgaben mit 3-stufigen Hints
- Hausaufgaben-Upload mit OCR
- Gamification: XP, Badges, Quests
- Eddy Lite (reaktiver KI-Studybuddy)
- Home-Quests nach jeder Präsenz-Session

**Coach-Dashboard**
- Echtzeit-Übersicht aller Schüler in der Session
- Interventions-Flags (Stimmung, Frust, Abbrüche)
- Mastery-Level-Bestätigung
- Coach-Einschätzung für Eltern-Report

**Eltern-Interface**
- Lernfortschritt-Dashboard
- Eltern-Report (rhythmusabhängig je Tarif)
- Hausaufgaben-Status
- Kommunikation mit Coach

**Admin**
- Rollen & Rechte
- Vertrags- und Zahlungsverwaltung
- Schüler-Stammdaten

**Fächer:** Mathematik, Deutsch, Englisch · **Lehrplan:** NRW (Köln)

### Post-MVP

- Vollständige Eddy-Konversations-KI (freies Gespräch, Gap-Identification, Lernstil-Profil)
- Weitere Bundesländer
- Vollständig KI-generierte Aufgaben
- Avatar-Customization
- ML-basierte Lernstil-Erkennung
- Weitere Fächer
- Premium-Reports (wöchentlich)

---

## Aufgaben-Datenbank

### Quellen

| Quelle | Tag | Lizenz |
| --- | --- | --- |
| Lambacher Schweizer (Klett) Kl. 8 NRW | `mathebuch_lambacher_8_nrw` | Lizenz mit Klett zu klären |
| KI-generiert | `ki_generiert` | Qualitätsprüfung vor Freigabe |
| Manuell (Team / QS) | `manuell` | Höchste Qualitätsstufe |

### Aufgabentypen (MVP)

- Freitext / Rechenweg
- Multiple Choice mit Begründungspflicht (kein reines Anklicken)
- Lückentext
- Reflection (Schüler beschreibt eigenen Denkweg)
- Bild-Upload (Hausaufgaben, OCR)

### Pflichtfelder je Aufgabe

```
id, fach, klasse, thema, mikro_skill, level (1–3),
aufgaben_typ, aufgaben_text,
hinweis_1, hinweis_2, hinweis_3,
musterloesung (nur Coach),
quelle, tags[], freigegeben (boolean)
```

### Hard Rules

- Musterlösung erscheint **nie** auf dem Schüler-Screen
- Hint 3 ist der letzte Impuls — löst nie vollständig auf
- Nur freigegebene Aufgaben werden dem Schüler angezeigt

---

## XP & Gamification

### XP-Vergabe

| Aktion | XP |
| --- | --- |
| Aufgabe korrekt (1. Versuch) | 30 |
| Aufgabe korrekt (nach Hint 1) | 20 |
| Aufgabe korrekt (nach Hint 2/3) | 10 |
| Reflection abgeschlossen (Coach-bestätigt) | 25 |
| Session vollständig abgeschlossen | 50 |
| Hausaufgabe hochgeladen | 20 |
| Klassenarbeitsvorbereitung (Case A) abgeschlossen | 75 |
| 3er-Streak | +25 Bonus |
| 7er-Streak | +75 Bonus |

### XP-Level

| Level | Name | XP |
| --- | --- | --- |
| 1 | Entdecker | 0 |
| 2 | Lernender | 250 |
| 3 | Denker | 750 |
| 4 | Stratege | 1.500 |
| 5 | Meister | 3.000 |
| 6+ | Experte / Legende … | +2.000 je Level |

> XP = motivational. **Mastery** (Level 1–10) = pädagogisch. Beide Systeme laufen parallel, nie gegeneinander.

### MVP-Badges (10 Stück)

Erster Schritt · Aufgewärmt · Dranbleiber · Maschine · Hausaufgaben-Held · Klassenarbeit-Krieger · Durchdenker · Hartnäckig · Level 5 erreicht · Meister des [Themas]

### MVP-Quests

| Quest | Typ | Dauer | Belohnung |
| --- | --- | --- | --- |
| Woche der Stärke | Haupt-Quest | 7 Tage | 150 XP + Dranbleiber-Badge |
| Klassenarbeit-Blitz | Neben-Quest | bis KA-Datum | 100 XP + KA-Krieger-Badge |
| Denk-Detektiv | Neben-Quest | 14 Tage | 75 XP + Durchdenker-Badge |

---

## Eltern-Reporting

### Rhythmus nach Tarif

| Tarif | Rhythmus | Format |
| --- | --- | --- |
| Basic | alle 4 Wochen | In-App |
| Standard | alle 2 Wochen | In-App + PDF |
| Premium | wöchentlich | In-App + PDF + Push |

### Report-Inhalt (5 Sektionen)

1. **Zusammenfassung** — Sessions, Anwesenheit, Gesamtstimmung
2. **Mastery-Fortschritt** — je Fach: Themen, Level vorher/nachher
3. **Coach-Einschätzung** — KI-Entwurf, Coach reviewed & gibt frei
4. **Auffälligkeiten** — nur wenn vorhanden (Stimmung, Lücken, KA)
5. **Nächste Periode** — geplante Themen, empfohlene Eltern-Aktion

### Generierungsprozess

1. System generiert KI-Entwurf 48 h vor Reporting-Termin
2. Coach reviewed, ergänzt Einschätzung, gibt frei
3. System stellt an Eltern zu (Push + In-App)
4. Eltern können optional Rückmeldung an Coach geben

---

## Roadmap

| Phase | Zeitraum | Was |
| --- | --- | --- |
| Spezifikation abschließen | Mai 2026 | Alle offenen Blöcke entschieden, PRDs freigegeben |
| Entwickler-Start | Juni 2026 | 2 Vollzeit-Entwickler (Supabase / React) |
| Entwicklung MVP | Juni – Oktober 2026 | ~5 Monate, 2 Entwickler parallel |
| Interner Test | Oktober 2026 | Team + Coaches testen, Bugs fixen |
| Beta-Phase | Nov – Dez 2026 | 5–10 Schüler, 4–8 Wochen, Feedback-Loop |
| Iteration | Dezember 2026 | Kritische Punkte aus Beta einbauen |
| **Launch** | **Januar 2027** | Erster regulärer Betrieb in Köln |

---

## Bereits fertig / definiert

- Businessplan bei IHK eingereicht
- Onboarding & Lernstandsanalyse Mathe (v3)
- Lernpfad-Generierung PRD (v1.1, entwicklerfertig)
- Lernsession E2E (inkl. Fallbeispiel)
- 7 End-to-End-Prozesse definiert
- Mastery-Skala (Level 1–10) mit pädagogischer Begründung
- Aufgaben-Schema (alle Felder definiert)
- XP-System & Badges (MVP-Liste)
- Eltern-Reporting Spec (Inhalt, Prozess, Tarif-Differenzierung)
- Eddy Lite Spec (reaktiv, kompetenzadaptiv, Lexikon-Verweis)
- Home-Schooling Quests (3 Typen, automatisch post-session)
- Technologie-Stack-Entscheidung (Supabase + custom React-Frontend)
- Timeline bis Launch Januar 2027

---

## Offene Punkte

### Produkt
- Weitere Aufgabentypen für MVP? (Zuordnung, Sortierung)
- Sollen höhere Level-Aufgaben mehr XP geben?
- Lexikon eigenständig oder nur über Eddy?
- Quests automatisch starten oder aktiv annehmen?
- Sehen Eltern den XP-Stand?
- Schüler-Version des eigenen Reports?
- Basic-Tarif ohne PDF — als Upsell-Hebel akzeptabel?
- Eskalation, wenn Coach Report nicht rechtzeitig freigibt?

### Technologie
- Datenmodell in Supabase finalisieren (Aufgaben, Mastery, Sessions, Reports) — beim Entwickler-Onboarding
- Edge Functions vs. separater Backend-Service für Edvance-spezifische Logik (Case-Routing, Mastery-Engine, Eltern-Report-Generierung)
- Finale Wahl der KI-API für Eddy (Anthropic Claude empfohlen)

### Operatives
- Teilnahmevertrag + AGB (Anwalt, Owner: Tolunay)
- DSGVO: AVV mit Entwicklern, Datenschutzerklärung (inkl. KI-Einwilligung Minderjährige)
- Standort Köln: Raumsuche
- Erste Kunden-Akquise Köln (Owner: Ashkan) — **jetzt, nicht erst zum Launch**
- Coaches aus Pool auswählen & Schulungskonzept (Owner: Rasit + QS)
- Fördermittel prüfen: EXIST, NRW-Förderung, IHK (Owner: Rasit)

---

## Repository-Struktur (Drive)

```
Edvance/
├── 01_Organisation/        Notion-Stand, Team-Docs
├── 02_Finanzen/
├── 03_Marketing/
├── 04_Didaktik & IT/       Lernplattform, Curricula, Prozesse, Tests
├── 05_Standorte/
├── 06_Investoren & Banken/
├── 07_Business & Strategie/  Businessplan (IHK)
├── edvance_lernsession.html  E2E-Lernsession-Beispiel
└── Logo.png
```
