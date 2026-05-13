// Importer: Lambacher Schweizer Klasse 8 NRW → Supabase tasks.
//
// Pipeline:
//   1. Liest alle JSON-Dateien aus scripts/import/raw/lambacher-8-nrw/**/*.json
//   2. Normalisiert die Roh-JSONs (best-effort, Plugin-Output kann variieren)
//   3. Upsert nach tasks via (source, source_ref) Unique-Constraint
//
// Idempotent: Doppelaufruf erzeugt nur ein UPDATE statt ein INSERT, sofern
// die source_ref stabil bleibt.
//
// Modes:
//   npm run import:lambacher                # Dry-Run (Default)
//   npm run import:lambacher -- --write     # tatsaechlich in DB schreiben
//
// Voraussetzungen:
//   - Migration 006 + 007 im Supabase Studio ausgefuehrt
//   - .env mit SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SOURCE = 'mathebuch_lambacher_8_nrw'
const RAW_DIR = 'scripts/import/raw/lambacher-8-nrw'
const RUNS_DIR = 'scripts/import/runs'

type RawTask = Record<string, unknown>

type Stats = {
  filesRead: number
  parsed: number
  parseErrors: number
  upserted: number
  upsertErrors: number
  skipped: number
}

type RunLog = {
  startedAt: string
  finishedAt: string
  dryRun: boolean
  stats: Stats
  errors: { file: string; message: string }[]
}

// Roh-JSONs rekursiv einsammeln.
function collectJsonFiles(root: string): string[] {
  if (!existsSync(root)) return []
  const out: string[] = []
  for (const entry of readdirSync(root)) {
    const full = join(root, entry)
    if (statSync(full).isDirectory()) out.push(...collectJsonFiles(full))
    else if (entry.endsWith('.json')) out.push(full)
  }
  return out
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

// source_ref aus chapter/page/task_number generieren. Stabil + lesbar.
function buildSourceRef(raw: RawTask): string | null {
  const ch = asString(raw.chapter) ?? asNumber(raw.chapter)?.toString()
  const pg = asString(raw.page) ?? asNumber(raw.page)?.toString()
  const nr = asString(raw.task_number) ?? asNumber(raw.task_number)?.toString()
  if (!nr && !pg && !ch) return null
  return [ch ? `kap${ch}` : null, pg ? `s${pg}` : null, nr ? `nr${nr}` : null]
    .filter(Boolean)
    .join('.')
}

// Mapping Roh → DB. Question ist Pflicht – Aufgaben ohne Frage werden geskippt.
function toDbTask(raw: RawTask): Record<string, unknown> | null {
  const question = asString(raw.question)
  if (!question) return null
  return {
    source: SOURCE,
    source_ref: buildSourceRef(raw),
    content_type: asString(raw.content_type) ?? 'exercise',
    title: asString(raw.title),
    question,
    solution: asString(raw.solution),
    hint: asString(raw.hint),
    difficulty: asNumber(raw.difficulty),
    estimated_minutes: asNumber(raw.estimated_minutes) ?? 3,
    class_level: asNumber(raw.class_level) ?? 8,
    is_active: true,
    curriculum_ref: asString(raw.curriculum_ref) ?? asString(raw.competence),
  }
}

async function upsertOne(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
  stats: Stats,
  errors: RunLog['errors'],
  file: string,
): Promise<void> {
  if (!row.source_ref) {
    // Ohne source_ref keine Idempotenz – als Fehler markieren, nicht inserten.
    stats.skipped += 1
    errors.push({ file, message: 'source_ref konnte nicht gebildet werden (chapter/page/task_number fehlen)' })
    return
  }
  const { error } = await supabase
    .from('tasks')
    .upsert(row, { onConflict: 'source,source_ref' })
  if (error) {
    stats.upsertErrors += 1
    errors.push({ file, message: error.message })
    return
  }
  stats.upserted += 1
}

async function main(): Promise<void> {
  const dryRun = !process.argv.includes('--write')
  const stats: Stats = {
    filesRead: 0,
    parsed: 0,
    parseErrors: 0,
    upserted: 0,
    upsertErrors: 0,
    skipped: 0,
  }
  const errors: RunLog['errors'] = []
  const startedAt = new Date().toISOString()

  const files = collectJsonFiles(RAW_DIR)
  stats.filesRead = files.length
  console.log(`▶ ${files.length} Datei(en) gefunden in ${RAW_DIR}`)
  if (files.length === 0) {
    console.log('  Nichts zu importieren. Lege Roh-JSONs unter scripts/import/raw/lambacher-8-nrw/ ab.')
    return
  }

  let supabase: SupabaseClient | null = null
  if (!dryRun) {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      console.error('Fehlende ENV: SUPABASE_URL (oder VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY')
      process.exit(1)
    }
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }

  for (const file of files) {
    let raw: RawTask | RawTask[]
    try {
      raw = JSON.parse(readFileSync(file, 'utf8'))
    } catch (err) {
      stats.parseErrors += 1
      errors.push({ file, message: err instanceof Error ? err.message : 'parse-error' })
      continue
    }
    const items = Array.isArray(raw) ? raw : [raw]
    for (const item of items) {
      const row = toDbTask(item)
      if (!row) {
        stats.skipped += 1
        errors.push({ file, message: 'kein "question"-Feld' })
        continue
      }
      stats.parsed += 1
      if (dryRun) {
        console.log(`  [dry] ${row.source_ref ?? '(kein source_ref)'} — ${(row.question as string).slice(0, 60)}…`)
        continue
      }
      if (supabase) await upsertOne(supabase, row, stats, errors, file)
    }
  }

  const finishedAt = new Date().toISOString()
  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log(`  IMPORT ${dryRun ? 'DRY-RUN' : 'WRITE'} FERTIG`)
  console.log('═══════════════════════════════════════════')
  console.log(`  Dateien gelesen   : ${stats.filesRead}`)
  console.log(`  Aufgaben geparst  : ${stats.parsed}`)
  console.log(`  Upserts ok        : ${stats.upserted}`)
  console.log(`  Skipped           : ${stats.skipped}`)
  console.log(`  Parse-Fehler      : ${stats.parseErrors}`)
  console.log(`  Upsert-Fehler     : ${stats.upsertErrors}`)
  console.log('═══════════════════════════════════════════')

  // Run-Log immer schreiben, auch im Dry-Run.
  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true })
  const logPath = join(RUNS_DIR, `${startedAt.replace(/[:.]/g, '-')}.json`)
  const log: RunLog = { startedAt, finishedAt, dryRun, stats, errors }
  writeFileSync(logPath, JSON.stringify(log, null, 2))
  console.log(`  Log: ${logPath}`)
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
