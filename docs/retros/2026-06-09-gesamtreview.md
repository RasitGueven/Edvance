# Retro 2026-06-09 — Gesamt-Review PR #18 (Brand-System + Farbsystem-Feinschliff)

Review-Session: `claude/sweet-ramanujan-9xc75e`  
Merge-Commit: `9b4388f` | Branch: `feature/levelup-tuerkis` | Gemergt: 2026-05-17  
Stand dieser Review: 2026-06-09

---

## Was gebaut wurde

### Logo-System (Commits `9051995` + `3cf2c29`)

**Neue Komponente `src/components/brand/EdvanceLogo.tsx` (249 Zeilen)**  
Drei exportierte Komponenten:
- `EdvanceSymbol` — SVG-J-Kurve (Hairline + Punkt + Gold-Pfeil), für Navbar und Cards
- `EdvanceLogo` — Symbol + Wordmark nebeneinander, Space Grotesk Font
- `EdvanceAppIcon` — gerundetes Quadrat mit eingebettetem Symbol, für App-Icon und Login

**Neue Assets unter `public/brand/`:**
- `edvance-app-icon.svg`
- `edvance-favicon.svg`
- `edvance-logo-dark.svg`
- `edvance-logo-light.svg`
- `edvance-symbol.svg`
- `public/favicon.svg` aktualisiert

**Integration:**  
`EdvanceNavbar.tsx` und `Login.tsx` auf neue Komponenten umgestellt.  
Space Grotesk Webfont via `index.html` geladen.

---

### Farbsystem (Commits `bb7af96` + `4c921ec` + `401ad6c`)

**P1 — Neue Token-Definitionen in `src/styles/tokens.css`:**
- `--color-levelup: #0E9E96` (Türkis, Badge/UI)
- `--color-moment-levelup: #19C9BC` (leuchtend auf Navy)
- `--color-levelup-on: #04302D` (Text-On, WCAG)
- `--color-moment-repair: #8B5CF6` (Lila „Power-up")
- `--color-moment-repair-on: #FFFFFF`
- `--color-accent-light: #FBEAD0` (Badge-BG für XP)
- `--gradient-levelup`, `--gradient-repair`, `--shadow-glow-levelup`

Legacy-Aliase in `globals.css` auf Token-Variablen umgebogen:  
`--xp-gold` → `var(--color-accent)`, `--level-purple` → `var(--color-moment-repair)`

**P2 — Consumer-Updates:**
- `EdvanceBadge` (in `index.tsx`): Varianten `levelup` (Türkis) + `repair` (Lila)
- `ToastBanner`: Typ `levelup` mit `.toast-levelup` Türkis-Gradient
- `ScenarioCelebration`: Level-Badge mit `--gradient-levelup` + `--shadow-glow-levelup` auf Navy

**P3 — Sichtbarkeit/Doku:**
- `DesignShowcase.tsx`: neue Gruppe „Emotionale Momente"
- `docs/retros/2026-05-17-farbsystem-feinschliff.md` erstellt

---

## Code-Qualität

**TypeScript:** `npx tsc --noEmit` — **0 Fehler** ✅

**Supabase-Kapselung:** Kein direkter Zugriff in Komponenten oder Pages — ✅

**Auth/RLS:** Keine Auth- oder RLS-Änderungen in diesem PR ✅

**Dateigrössen (CLAUDE.md §4 Limit: 400 Zeilen):**
| Datei | Zeilen | Anteil aus PR |
|---|---|---|
| `src/components/edvance/index.tsx` | 559 | +19 |
| `src/pages/DesignShowcase.tsx` | 478 | +17 |

---

## Design-Rule-Verstöße (CLAUDE.md §4, §11)

### 🔴 BLOCKER — Hardcodierte Hex-Strings in `EdvanceLogo.tsx`

`src/components/brand/EdvanceLogo.tsx` Z. 18–23:
```ts
const COLORS = {
  midnight: '#334D7A',
  white: '#F7F7F5',
  black: '#1A1A18',
  gold: '#E8A020',
};
```
Diese Werte werden direkt als SVG-Attribute (`stroke=`, `fill=`) und als `background` eingesetzt.  
CLAUDE.md: **„Keine hardcodierten Farben — Immer CSS-Variablen"**  
Bei Token-Änderung in `tokens.css` werden SVG-Farben nicht mitgezogen.

**Fix:** SVG auf `stroke="currentColor"` / `fill="currentColor"` umstellen,  
Farbe via `style={{ color: 'var(--color-primary)' }}` auf das SVG-Wurzelelement legen.

---

### 🟡 Warnung — Inline `boxShadow` in `ScenarioCelebration.tsx`

`src/pages/demo/ScenarioCelebration.tsx` Z. 40–42:
```tsx
style={{
  background: 'var(--gradient-levelup)',
  boxShadow: 'var(--shadow-glow-levelup)',
}}
```
Die Utility-Klasse `.shadow-glow-levelup` existiert bereits in `globals.css`.  
CLAUDE.md: **„Statische boxShadow in Inline-Styles — die shadow-* Utilities nutzen"**  
Fix: `className="bg-gradient-levelup shadow-glow-levelup"`

---

### 🟡 Warnung — Statische Inline-Styles in `EdvanceLogo.tsx`

Z. 137–148: `fontFamily`, `letterSpacing`, `userSelect` sind statisch → Tailwind-Klassen.  
Dynamische Werte (`size`, `borderRadius`) sind korrekt als Inline-Style.

---

## 🔴 Kritischer Widerspruch: tokens.css vs. Design-System v2

> **Dies ist der wichtigste Befund.**

Die Notion-Design-System-Seite (aktualisiert 2026-05-27 — 10 Tage nach dem Merge) hat die  
Türkis-Level-Up-Identität explizit **gestrichen** und ersetzt durch:  
**Navy-BG + Champagner-Krone + Altgold-XP**

| Token | Im Code (tokens.css) | Design-System v2 |
|---|---|---|
| `--color-levelup` | `#0E9E96` (Türkis) | **gestrichen** |
| `--color-moment-levelup` | `#19C9BC` | **gestrichen** |
| `--gradient-levelup` | `linear-gradient` Türkis | **gestrichen** |
| `--color-moment-repair` | `#8B5CF6` | `#7B5EA7` (präzisiert) |
| `--gradient-repair` | `linear-gradient` Lila | **gestrichen** |

**Betroffene Stellen:**
1. `src/styles/tokens.css` Z. 54–56, 72–73, 85
2. `src/styles/globals.css` Z. 115–117, 158, 165–166 (Utility-Klassen)
3. `src/components/edvance/index.tsx` Z. 97–98 (Badge-Variante `levelup`)
4. `src/pages/demo/ScenarioCelebration.tsx` Z. 29, 40–42
5. `src/pages/DesignShowcase.tsx` Z. 143–144 (Swatch-Gruppe)

> ⚠️ Dies ist kein Fehler des PR — Design-System v2 wurde erst nach dem Merge publiziert.  
> Der Zustand muss aber aufgelöst werden **vor** produktivem Einsatz der levelup-Türkis-Farben.

---

## Betroffene Dateien (vollständige Liste)

**Neu:**
- `src/components/brand/EdvanceLogo.tsx`
- `public/brand/edvance-app-icon.svg`
- `public/brand/edvance-favicon.svg`
- `public/brand/edvance-logo-dark.svg`
- `public/brand/edvance-logo-light.svg`
- `public/brand/edvance-symbol.svg`
- `docs/retros/2026-05-17-farbsystem-feinschliff.md`

**Modifiziert:**
- `src/styles/tokens.css` (+16 Zeilen)
- `src/styles/globals.css` (+23 Zeilen)
- `src/components/edvance/index.tsx` (+19 Zeilen)
- `src/components/edvance/EdvanceNavbar.tsx` (Logo-Swap)
- `src/pages/Login.tsx` (Logo-Swap)
- `src/pages/demo/ScenarioCelebration.tsx` (+11 Zeilen)
- `src/pages/DesignShowcase.tsx` (+17 Zeilen)
- `public/favicon.svg` (aktualisiert)
- `index.html` (Space-Grotesk-Fontlink)

---

## Offene Punkte (priorisiert)

### P0 — Blocker (vor Design-System-v2-Migration)

| # | Problem | Datei | Fix |
|---|---|---|---|
| B1 | Türkis-Tokens vs. v2-Spec | `tokens.css`, `globals.css` | Feature-Branch `feature/levelup-v2` |
| B2 | Hardcodierte Hex in COLORS-Objekt | `EdvanceLogo.tsx` Z. 18–23 | `currentColor` + CSS-Var |

### P1 — Vor nächstem Feature-Branch

| # | Problem | Datei |
|---|---|---|
| P1a | `boxShadow`-Inline-Style | `ScenarioCelebration.tsx` Z. 42 |
| P1b | Statische Inline-Styles | `EdvanceLogo.tsx` Z. 137–148 |
| P1c | `index.tsx` auf 559 Zeilen → splitten | `src/components/edvance/index.tsx` |

### P2 — Mit v2-Migration zusammen

| # | Problem |
|---|---|
| P2a | `--color-moment-repair` Hex-Wert: `#8B5CF6` → `#7B5EA7` |
| P2b | Alle Stellen die `--color-levelup` (Türkis) referenzieren ersetzen |

---

## Entscheidungspunkte für Rasit

1. **Design-System-v2-Migration starten?**  
   `CLAUDE_CODE_MIGRATION_PROMPT.md` liegt lokal vor (966 Zeilen, 10 Phasen).  
   Löst B1, P2a, P2b automatisch.

2. **`EdvanceLogo.tsx` COLORS-Objekt** (B2): Inline-Fix oder mit v2-Migration zusammen?

3. **`index.tsx` splitten** (P1c): Jetzt oder mit dem nächsten großen Refactor-Durchlauf?
