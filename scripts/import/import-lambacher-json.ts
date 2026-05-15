// Importiert Aufgaben aus einer Lambacher-JSON-Datei in die tasks-Tabelle.
//
// Usage:
//   npm run import:lambacher:json                            # Dry-run
//   npm run import:lambacher:json -- --write                 # Schreiben
//   npm run import:lambacher:json -- --write --force         # Bestehende überschreiben
//   npm run import:lambacher:json -- --file <pfad>           # Anderer Dateipfad

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ─── Typen ───────────────────────────────────────────────────────────────────

type JsonTask = {
  chapter: number
  page: number
  task_number: string | number
  title?: string
  question: string
  solution?: string
  hint?: string
  difficulty: number
  competence: string
  class_level: number
  estimated_minutes?: number
}

type MicroskillRow = {
  id: string
  code: string
  cluster_id: string
  cognitive_type: 'FACT' | 'TRANSFER' | 'ANALYSIS'
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2)
  let file = resolve(process.env.HOME ?? 'C:/Users/rasit', 'Downloads/kap01_wahrscheinlichkeiten.json')
  let write = false, force = false
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--write') write = true
    else if (argv[i] === '--force') force = true
    else if (argv[i] === '--file') file = resolve(argv[++i] ?? file)
  }
  return { file, write, force }
}

// "1" → "nr1", "CI-1" → "ci-1", "WVV-3" → "wvv-3", "T1-1" → "t1-1"
function taskToRef(n: string | number): string {
  const s = String(n)
  return /^\d+$/.test(s) ? `nr${s}` : s.toLowerCase()
}

function buildSourceRef(t: JsonTask): string {
  return `kap${t.chapter}.s${t.page}.${taskToRef(t.task_number)}`
}

function cognitiveFromDifficulty(d: number): 'FACT' | 'TRANSFER' | 'ANALYSIS' {
  if (d <= 2) return 'FACT'
  if (d <= 3) return 'TRANSFER'
  return 'ANALYSIS'
}

function contentType(_n: string | number): 'exercise' {
  return 'exercise'
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Fehlende ENV: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // JSON laden
  let raw: JsonTask[]
  try {
    raw = JSON.parse(readFileSync(args.file, 'utf-8')) as JsonTask[]
  } catch (e) {
    console.error(`Datei nicht lesbar: ${args.file}`, e)
    process.exit(1)
  }

  console.log(`\n${'═'.repeat(54)}`)
  console.log(`  LAMBACHER JSON-IMPORT (${args.write ? 'WRITE' : 'DRY-RUN'})`)
  console.log(`${'═'.repeat(54)}`)
  console.log(`  Datei  : ${args.file}`)
  console.log(`  Tasks  : ${raw.length}`)
  console.log(`  Force  : ${args.force}`)
  console.log(`${'─'.repeat(54)}`)

  // Microskills laden (code → row)
  const { data: microskills } = await db.from('microskills').select('id, code, cluster_id, cognitive_type')
  const msMap = new Map<string, MicroskillRow>(
    (microskills ?? []).map((m) => [m.code as string, m as MicroskillRow]),
  )
  console.log(`  Microskills geladen: ${msMap.size}`)

  // Bereits vorhandene source_refs laden
  const { data: existing } = await db
    .from('tasks')
    .select('source_ref')
    .eq('source', 'mathebuch_lambacher_8_nrw')
  const existingRefs = new Set((existing ?? []).map((t) => t.source_ref as string))
  console.log(`  Bereits in DB: ${existingRefs.size} Tasks`)
  console.log(`${'─'.repeat(54)}\n`)

  let inserted = 0, skipped = 0, noMs = 0, errors = 0

  for (const t of raw) {
    const sourceRef = buildSourceRef(t)
    const ms = msMap.get(t.competence)

    const tag = sourceRef.padEnd(22)

    if (!args.force && existingRefs.has(sourceRef)) {
      console.log(`  ${tag} → bereits vorhanden, skip`)
      skipped++
      continue
    }

    if (!ms) {
      console.log(`  ${tag} ⚠ Microskill "${t.competence}" nicht gefunden — importiere ohne Zuordnung`)
      noMs++
    }

    const row = {
      source: 'mathebuch_lambacher_8_nrw',
      source_ref: sourceRef,
      content_type: contentType(t.task_number),
      title: t.title ?? null,
      question: t.question,
      solution: t.solution ?? null,
      hint: t.hint ?? null,
      difficulty: t.difficulty,
      class_level: t.class_level,
      estimated_minutes: t.estimated_minutes ?? 5,
      is_active: true,
      is_diagnostic: false,
      cognitive_type: ms?.cognitive_type ?? cognitiveFromDifficulty(t.difficulty),
      input_type: 'FREE_INPUT',
      microskill_id: ms?.id ?? null,
      cluster_id: ms?.cluster_id ?? null,
      assets: [],
    }

    if (!args.write) {
      console.log(`  ${tag} · dry → ${ms ? ms.code : '?'} | diff ${t.difficulty} | ${row.cognitive_type}`)
      inserted++
      continue
    }

    const { error } = await db.from('tasks').upsert(row, { onConflict: 'source,source_ref' })
    if (error) {
      console.log(`  ${tag} ✗ ${error.message}`)
      errors++
    } else {
      console.log(`  ${tag} ✓ → ${ms?.code ?? 'kein MS'} | ${row.cognitive_type}`)
      inserted++
    }
  }

  console.log(`\n${'─'.repeat(54)}`)
  console.log(`  Neu/Updated : ${inserted}`)
  console.log(`  Übersprungen: ${skipped}`)
  console.log(`  Ohne MS     : ${noMs}`)
  console.log(`  Fehler      : ${errors}`)
  console.log(`${'═'.repeat(54)}\n`)

  if (!args.write) {
    console.log('  → Mit --write tatsächlich schreiben.\n')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
