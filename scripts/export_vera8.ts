// Liest echte VERA-8 Items aus screening_items und schreibt sie als JSON im
// Import-Format (Vera8Item) raus — als Vorlage fuer die QS. Nur tatsaechlich
// befuellte Felder werden exportiert ("vorselektiert"), leere/NULL-Felder
// fallen weg, damit die QS sofort sieht, was schon vorhanden ist und was fehlt.
//
// Gegenstueck zu scripts/seed_vera8.ts (Reverse-Mapping DB-Spalten -> Vera8Item).
// Das Ergebnis kann unveraendert wieder via `npm run seed:vera8` importiert werden
// (iqb_titel ist UNIQUE => idempotent).
//
// Voraussetzung (lokal, NICHT in der Cloud-Session):
//   ENV in .env: VITE_SUPABASE_URL (oder SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
//   Mit service_role werden auch inaktive (active=false) Items gelesen — wichtig,
//   weil VERA-Items vor der QS-Freigabe inaktiv sind. Faellt nur der ANON_KEY
//   vorhanden, sind per RLS nur active=true Items sichtbar (Warnung wird ausgegeben).
//
// Nutzung:
//   npm run export:vera8
//   npm run export:vera8 -- --limit 0            (0 = alle Items)
//   npm run export:vera8 -- --source VERA8_IQB   (Default; --all-sources hebt Filter auf)
//   npm run export:vera8 -- --active all|true|false   (Default: all)
//   npm run export:vera8 -- --out scripts/examples/vera8_export.json

import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function getArg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : fallback
}

function afbToKi(afb: string | null): 1 | 2 | 3 | null {
  if (afb === 'I') return 1
  if (afb === 'II') return 2
  if (afb === 'III') return 3
  return null
}

// Entfernt null/undefined/leere Arrays/leere Strings, damit nur befuellte
// Infos im Export landen (vorselektiert).
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue
    out[k] = v
  }
  return out as Partial<T>
}

type Row = Record<string, any>

// DB-Zeile -> Vera8Item-Importform. id + active bleiben als QS-Kontext erhalten
// (werden vom Seed-Script ignoriert, schaden also beim Re-Import nicht).
function toImportShape(r: Row): Record<string, unknown> {
  const meta = (r.meta ?? {}) as Record<string, any>
  const acceptedFromCanonical = Array.isArray(r.canonical?.accepted)
    ? (r.canonical.accepted as string[])
    : null
  return compact({
    id: r.id,
    iqb_titel: r.iqb_titel,
    klasse: r.class_level,
    quelle: r.quelle ?? r.source,
    aktiv: r.active,
    fix_anker: r.fix_anker || undefined,
    leitidee_raw: r.topic,
    kompetenzfeld_ki: r.skill_code ?? meta.kompetenzfeld_ki ?? null,
    kompetenzfelder: r.kompetenzfelder,
    afb_ki: meta.afb_ki_raw ?? afbToKi(r.afb),
    aufgabe_typ: r.aufgabe_typ,
    kontext: r.kontext,
    aufgabe_text_clean: r.prompt,
    aufgabe_text_roh: meta.aufgabe_text_roh ?? null,
    teilaufgaben: r.teilaufgaben,
    akzeptierte_antworten: r.akzeptierte_antworten ?? acceptedFromCanonical,
    loesung_pro_ta: r.loesung_pro_ta,
    kodierung: r.kodierung,
    kommentar_highlights: r.kommentar_highlights,
    urls: r.urls,
    datei_ext: r.datei_ext,
    meta: compact(meta),
  })
}

// QS-Luecken-Check: welche zentralen Felder fehlen noch?
const QS_CHECKS: Array<[string, (i: Record<string, unknown>) => boolean]> = [
  ['prompt', (i) => !!i.aufgabe_text_clean],
  ['leitidee', (i) => !!i.leitidee_raw],
  ['afb', (i) => i.afb_ki != null],
  ['antworten', (i) =>
    Array.isArray(i.akzeptierte_antworten) ||
    (Array.isArray(i.teilaufgaben) &&
      (i.teilaufgaben as any[]).some((t) => Array.isArray(t?.accepted) && t.accepted.length))],
  ['kodierung', (i) => !!i.kodierung],
  ['hinweise', (i) => !!i.kommentar_highlights],
]

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const key = serviceKey ?? anonKey
  if (!url || !key) {
    console.error('Fehlende ENV: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (in .env).')
    process.exit(1)
  }
  if (!serviceKey) {
    console.warn('! Kein SUPABASE_SERVICE_ROLE_KEY — nutze ANON_KEY. Per RLS sind nur active=true Items sichtbar.')
  }

  const out = getArg('--out', 'scripts/examples/vera8_export.json')!
  const limit = Number(getArg('--limit', '10'))
  const source = getArg('--source', 'VERA8_IQB')!
  const allSources = process.argv.includes('--all-sources')
  const activeArg = getArg('--active', 'all')! // all | true | false

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let q = supabase.from('screening_items').select('*').order('iqb_titel', { ascending: true })
  if (!allSources) q = q.eq('source', source)
  if (activeArg === 'true') q = q.eq('active', true)
  if (activeArg === 'false') q = q.eq('active', false)
  if (limit > 0) q = q.limit(limit)

  const { data, error } = await q
  if (error) {
    console.error('Lese-Fehler:', error.message)
    process.exit(1)
  }
  const rows = (data ?? []) as Row[]
  if (!rows.length) {
    console.warn(`Keine Items gefunden (source=${allSources ? '*' : source}, active=${activeArg}).`)
    console.warn('Tipp: zuerst `npm run seed:vera8` ausfuehren oder --all-sources / --source pruefen.')
    process.exit(0)
  }

  const items = rows.map(toImportShape)
  writeFileSync(out, JSON.stringify(items, null, 2) + '\n', 'utf-8')

  // Zusammenfassung + QS-Luecken-Uebersicht
  console.log(`Exportiert: ${items.length} Items -> ${out}`)
  const byLeitidee = items.reduce<Record<string, number>>((m, i) => {
    const k = String(i.kompetenzfeld_ki ?? i.leitidee_raw ?? '?')
    m[k] = (m[k] ?? 0) + 1
    return m
  }, {})
  console.log('Leitideen:', JSON.stringify(byLeitidee))
  const activeCount = rows.filter((r) => r.active).length
  console.log(`Status: ${activeCount} aktiv, ${rows.length - activeCount} inaktiv (QS offen)`)
  console.log('\nQS-Luecken (fehlende Felder pro Item):')
  for (const i of items) {
    const missing = QS_CHECKS.filter(([, ok]) => !ok(i)).map(([n]) => n)
    const flag = missing.length ? `FEHLT: ${missing.join(', ')}` : 'vollstaendig'
    console.log(`  - ${String(i.iqb_titel)}: ${flag}`)
  }
}

main().catch((err) => {
  console.error('Unerwarteter Fehler:', err)
  process.exit(1)
})
