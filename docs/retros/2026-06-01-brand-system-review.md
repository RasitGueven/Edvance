# Review 2026-06-01 — Brand-System + Level-Up Farbsystem (PR #18)

Branch: `feature/levelup-tuerkis` (von `dev`) — gemergt via PR #18.

## Zusammenfassung

PR #18 liefert zwei unabhängige, aber thematisch verwandte Säulen: das echte Edvance-Markenlogo (SVG-Komponente aus dem Design-Handoff, Space Grotesk, Favicon-Update) und ein durchdachtes emotionales Farbsystem für Gamification-Momente (Level-Up-Türkis, Streak-Repair-Lila, vereinheitlichtes XP-Gold). Alle Änderungen sind rein visueller/designsystemischer Natur — keine Geschäftslogik, keine Datenbankoperationen, kein Auth-Eingriff.

---

## Was gebaut wurde

### Brand-Komponenten (Logo & Favicon)

**Commit `9051995` + `3cf2c29`**

Neue Datei `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` (249 Zeilen) mit drei exportierten Komponenten:

- `EdvanceSymbol` — die J-Kurve allein (Hairline + Dot + Gold-Pfeil), konfigurierbar via `size`, `color`, `accentColor`, `filled`.
- `EdvanceLogo` — Symbol + Wordmark „edvance" nebeneinander (Space Grotesk), Größe via `size` (Wordmark-Px), `symbolRight` für gespiegelte Anordnung.
- `EdvanceAppIcon` — gerundetes Quadrat als App-Icon/Avatar, Hintergrundfarbe und Radius konfigurierbar, `filled`-Modus für Siegel-Variante.

SVG-Pfad-Konstanten sind in einem `PATHS`-Objekt zentralisiert (spine, arrow, calligraphic). Farbkonstanten stehen in einem lokalen `COLORS`-Objekt innerhalb der Datei.

Statische Assets unter `public/brand/`:
- `edvance-symbol.svg` — reine J-Kurve (Silhouette-Fill)
- `edvance-favicon.svg` — 32×32, Rounded-Square
- `edvance-app-icon.svg` — 1024×1024, App-Store-Format
- `edvance-logo-light.svg` + `edvance-logo-dark.svg` — horizontales Wordmark-Logo

`public/favicon.svg` wurde von einem Platzhalter-`E`-Buchstaben auf das echte `edvance-favicon.svg` aktualisiert.

**Verwendung in Consumers:**

- `EdvanceNavbar.tsx`: Vorher ein `<div>` mit hartem `E`-Text + `bg-gradient-brand`. Jetzt `<EdvanceLogo size={20} />` (Symbol + Wordmark) direkt im Nav-Block, ohne separaten App-Icon-Container.
- `Login.tsx`: Vorher `<div>` mit `E`-Text + `bg-gradient-brand`. Jetzt `<EdvanceAppIcon size={64} className="relative shadow-premium-md" />`.

**Space Grotesk Font:** In `index.html` via Google Fonts Preconnect + Stylesheet-Link geladen (Weights 400, 500, 700, `display=swap`). Entspricht dem Design-Handoff-README.

### Design-Token-System (Level-Up Türkis)

**Commit `bb7af96`**

Neue Token in `/home/user/Edvance/src/styles/tokens.css`:

| Token | Wert | Verwendungszweck |
|---|---|---|
| `--color-levelup` | `#0E9E96` | Ruhige UI/Badge-Variante (auf weißem BG) |
| `--color-moment-levelup` | `#19C9BC` | Leuchtend auf Navy-Bühne |
| `--color-levelup-on` | `#04302D` | Text-On-Color auf Türkis (WCAG-Kontrast) |
| `--color-moment-repair` | `#8B5CF6` | Streak-Repair Lila |
| `--color-moment-repair-on` | `#FFFFFF` | Text-On-Color auf Lila |
| `--color-accent-light` | `#FBEAD0` | Badge-Hintergrund für XP/Accent-Badges |
| `--gradient-levelup` | `linear-gradient(135deg, #1FD3C6 0%, #0B8B85 100%)` | Level-Up-Gradient |
| `--gradient-repair` | `linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)` | Streak-Repair-Gradient |
| `--shadow-glow-levelup` | `0 0 44px rgba(25, 201, 188, 0.36)` | Türkis-Glow-Shadow |

In `/home/user/Edvance/src/styles/globals.css`:

Legacy-Aliase auf Single Source umgebogen (keine eigenen Hex-Werte mehr):
- `--xp-gold` → `var(--color-accent)`
- `--xp-gold-light` → `var(--color-accent-light)`
- `--level-purple` → `var(--color-moment-repair)`

Neue `@theme inline`-Mappings für die Türkis/Repair-Token sowie neue Utility-Klassen:
- `.bg-gradient-levelup`
- `.bg-gradient-repair`
- `.shadow-glow-levelup`

### Consumer-Komponenten

**Commit `4c921ec`**

`EdvanceBadge` (`/home/user/Edvance/src/components/edvance/index.tsx`):
- Neue Variante `levelup`: `bg-[var(--color-levelup)] text-[var(--color-levelup-on)] border border-[var(--color-levelup)] font-bold`
- Neue Variante `repair`: `bg-[var(--color-moment-repair)] text-[var(--color-moment-repair-on)] border border-[var(--color-moment-repair)] font-bold`

`ToastBanner` (`/home/user/Edvance/src/components/edvance/index.tsx`):
- Neuer Typ `levelup` im `type`-Union und in `TOAST_CLASS`/`TOAST_ICON`-Maps. CSS-Klasse `.toast-levelup` (Türkis-Gradient) in `globals.css` definiert.

`ScenarioCelebration` (`/home/user/Edvance/src/pages/demo/ScenarioCelebration.tsx`):
- Level-Badge: Vorher `--color-moment-gold` als Hintergrund (flaches Gold-Fill). Jetzt `background: 'var(--gradient-levelup)'`, `color: 'var(--color-levelup-on)'`, `boxShadow: 'var(--shadow-glow-levelup)'` — ergibt Premium-Türkis mit Tiefe und Glow-Effekt.
- `XPBar` profitiert automatisch vom vereinheitlichten Gold (kein Codeeingriff nötig).

### DesignShowcase-Erweiterungen

**Commit `401ad6c`**

In `/home/user/Edvance/src/pages/DesignShowcase.tsx`: neue Swatch-Gruppe „Emotionale Momente" mit sechs Token-Swatches:
- Level-Up (`--color-levelup`)
- Level-Up Moment (`--color-moment-levelup`)
- Repair Lila (`--color-moment-repair`)
- Erfolg/Boss (`--color-moment-green`)
- Streak-Verlust (`--color-moment-red`)
- Moment-Bühne (`--color-moment-bg`)

Die Gamification-Gruppe zeigt jetzt das vereinheitlichte Gold korrekt mit Alias-Label „XP Gold (=Accent)" und trennt `--level-purple` heraus (da dieser Token jetzt in `Emotionale Momente` liegt).

---

## TypeScript-Check

```
npx tsc --noEmit
(keine Ausgabe — 0 Fehler, 0 Warnungen)
```

Der Check ist sauber. Alle neuen Exporte aus `EdvanceLogo.tsx`, alle neuen Badge-/Toast-Varianten sowie die überarbeitete `ToastBannerProps`-Typdefinition kompilieren fehlerfrei.

---

## Code-Qualität

### Positivbefunde

- Keine direkten Supabase-Aufrufe in Komponenten oder Pages — Regel eingehalten.
- Keine `BehaviorSnapshot`-Mutationen in den geänderten Dateien.
- `.env` steht in `.gitignore` (Zeile 7–8) und wurde nicht gestaged.
- Kein Auth/RLS-Eingriff — Rasit-Eskalation nicht erforderlich.
- Token-Zentralisierung (Single Source in `tokens.css`) ist ein strukturell solider Ansatz: Legacy-Aliase in `globals.css` zeigen nur noch auf Variablen, keine eigenen Hex-Werte mehr.
- SVG-Assets korrekt unter `public/brand/` abgelegt, nicht inline im JS-Bundle.
- Accessibility: SVG-Elemente tragen `aria-label="edvance"` und `role="img"`, innere SVGs sind `aria-hidden="true"`.

### Warnungen

**Hardcodierte Hex-Farben in EdvanceLogo.tsx (Zeilen 19–22):**

Das lokale `COLORS`-Objekt in `/home/user/Edvance/src/components/brand/EdvanceLogo.tsx` definiert vier Hex-Werte direkt im Komponentencode:

```
midnight: '#334D7A'
white: '#F7F7F5'
black: '#1A1A18'
gold: '#E8A020'
```

Diese werden als Default-Props verwendet (`color = COLORS.midnight`, `accentColor = COLORS.gold`). Laut CLAUDE.md-Regel sind hardcodierte Farben außerhalb von `src/index.css` (bzw. `src/styles/globals.css`) verboten. Das ist ein Grenzfall mit nachvollziehbarem Grund (die Komponente ist ein SVG-Renderer, der CSS-Variablen nicht direkt als SVG-`stroke`/`fill`-Attributwerte verwenden kann), aber es schafft eine zweite Quelle für Markenwerte, die bei einer künftigen Theme-Anpassung vergessen werden könnte.

Empfehlung: Die Defaults über `getComputedStyle` zur Laufzeit aus den CSS-Variablen lesen oder die Komponente mit einem Wrapper-Ansatz absichern, der CSS-Variablen-Werte injiziert. Alternativ: im Kommentar explizit dokumentieren, dass diese Werte spiegelbildlich zu den Token-Definitionen in `tokens.css` sind und bei Theme-Änderungen synchron angepasst werden müssen.

**Inline-Styles in EdvanceLogo.tsx (strukturell begründet):**

Die Wrapper-`<div>`-Elemente in `EdvanceLogo` und `EdvanceAppIcon` nutzen `style={{ display: 'inline-flex', gap, borderRadius, width, height, ... }}`. Die dynamisch berechneten Werte (`gap = Math.round(size * 0.55)`, `borderRadius = Math.round(size * 0.22)`) sind echte Laufzeitwerte und fallen damit unter die erlaubte Ausnahme in CLAUDE.md. Die statischen Layout-Werte (`display: 'inline-flex'`, `alignItems: 'center'`, `flexShrink: 0`) könnten theoretisch in Tailwind-Klassen überführt werden — praktisch ist der Mehraufwand gering und der Kontext (skalierbare Logo-Komponente) macht die Inline-Lösung vertretbar.

**Inline-Styles in ScenarioCelebration.tsx (Zeilen 40–43):**

`background: 'var(--gradient-levelup)'` und `boxShadow: 'var(--shadow-glow-levelup)'` als Inline-Styles statt der neu eingeführten Utility-Klassen `.bg-gradient-levelup` und `.shadow-glow-levelup`. Beide Utility-Klassen existieren seit Commit `bb7af96` in `globals.css`. Die Inline-Variante ist kein Regelverstoß (sie nutzt CSS-Variablen, keine Hex-Werte), aber die Utility-Klassen sind genau dafür eingeführt worden — Konsistenz wäre wünschenswert.

Empfehlung: Zeilen 39–43 in `ScenarioCelebration.tsx` auf Tailwind-Utility-Klassen umstellen:
```
className="... bg-gradient-levelup shadow-glow-levelup"
style={{ color: 'var(--color-levelup-on)' }}
```
(Die `color`-Eigenschaft hat keine Utility-Klasse, daher bleibt das eine legitime Inline-Ausnahme.)

**ToastConfig-Typ in DesignShowcase.tsx nicht synchron (Zeile 16):**

`ToastConfig.type` in `/home/user/Edvance/src/pages/DesignShowcase.tsx` ist noch `'success' | 'xp' | 'warning' | 'error'` — der neue Wert `'levelup'` fehlt. Der TypeScript-Check ist trotzdem grün, weil `ToastConfig` nur ein lokaler Typ für den internen State ist und nicht direkt den `ToastBanner`-Prop-Typ ableitet. In der Praxis kann ein Showcase-Nutzer keinen `levelup`-Toast über den UI-Button auslösen — obwohl die Komponente ihn unterstützt.

Empfehlung: `ToastConfig.type` in `DesignShowcase.tsx` auf `'success' | 'xp' | 'levelup' | 'warning' | 'error'` erweitern und einen Demo-Button hinzufügen.

**Dateigröße edvance/index.tsx:**

`/home/user/Edvance/src/components/edvance/index.tsx` ist auf 559 Zeilen angewachsen — deutlich über dem 400-Zeilen-Limit aus CLAUDE.md. Dies ist kein direktes Ergebnis dieses PRs (die +19 Zeilen für `levelup`/`repair` sind marginal), sondern ein akkumuliertes Problem. Eine Aufteilung in thematische Sub-Dateien (z.B. `EdvanceBadge.tsx`, `ToastBanner.tsx`, `XPBar.tsx`) ist beim nächsten Refactor-Pass zu empfehlen.

**DesignShowcase.tsx Dateigröße:**

478 Zeilen — knapp unter 400-Zeilen-Limit ist verletzt. Hier wäre ebenfalls eine Aufteilung in Sections oder eine Auslagerung der Token-Swatch-Daten in eine separate Konfigurationsdatei sinnvoll.

---

## Offene Punkte

1. **WCAG-AA-Prüfung Türkis/Repair:** Die Werte `--color-levelup #0E9E96` und `--color-moment-repair #8B5CF6` sind kalibrierte Vorschläge, noch nicht final gegen WCAG-AA-Kontrastverhältnisse gemessen. Prüfung über `/showcase` und `/demo/design` ausstehend. Bei Nachjustierung genügt eine Änderung in `tokens.css`.
2. **XP-Gold-Verschiebung:** `--xp-gold` wurde von `#F59E0B` auf `#E8A020` verschoben (via Alias auf `--color-accent`). Absichtlich für Konsistenz, aber visuell zu validieren — bestehende Screens mit `--xp-gold` sehen minimal wärmer/satter aus.
3. **Streak-Repair- und Boss-Gradient-Flows:** Nur token-, badge- und toast-seitig vorbereitet. Die eigentlichen UI-Flows (Streak-Repair-Modal, Boss-Challenge-Screen) sind separater Entwicklungsschritt.
4. **`EdvanceLogo`-Komponente nicht in `src/components/edvance/index.tsx` re-exportiert:** Die Komponente liegt bewusst unter `src/components/brand/` (nicht im `edvance`-Barrel), was korrekt ist. Jedoch sollte geprüft werden, ob ein Re-Export in einem zukünftigen `src/components/brand/index.ts`-Barrel sinnvoll ist, damit Imports konsistent bleiben.
5. **Space Grotesk nur via Google Fonts CDN:** Keine Self-Hosting-Option vorhanden. Bei Offline-Nutzung oder DSGVO-Bedenken wäre ein Font-Download in `public/fonts/` zu diskutieren.

---

## Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Level-Up bekommt Türkis, nicht Gold | Gold = Alltags-XP; Level-Up ist Meilenstein → eigene Identität nötig, um semantische Überladung zu vermeiden |
| `COLORS`-Objekt in `EdvanceLogo.tsx` statt CSS-Variablen | SVG-Attribute `stroke`/`fill` akzeptieren keine CSS-Custom-Properties direkt; Prop-Defaults müssen als echte Farbwerte übergeben werden |
| Neue Komponente unter `src/components/brand/`, nicht `src/components/edvance/` | Trennung von Markenidentität (Logo) und UI-System (Interaktionskomponenten); folgt der Ownership-Matrix in CLAUDE.md |
| Legacy-Aliase zeigen auf Single Source, statt Hex doppelt zu definieren | Reduziert Drift zwischen `globals.css` und `tokens.css`; alle Gamification-Farbwerte sind jetzt an einer Stelle wartbar |
| Gradients und Glows als Utilities in `globals.css`, nicht als Tailwind-Plugins | Tailwind v4-kompatibler Ansatz; Utilities folgen dem bestehenden Muster der anderen `.bg-gradient-*`-Klassen im Projekt |
