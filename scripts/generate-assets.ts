// Asset-Generator: erstellt SVG-Illustrationen pro Task via Claude (Anthropic-API),
// laedt sie in den 'task-assets' Storage-Bucket und schreibt den Eintrag in
// tasks.assets.
//
// Modes:
//   npm run generate:assets                              # Dry-Run, Default-Source
//   npm run generate:assets -- --write                   # Tatsaechlich generieren + ablegen
//   npm run generate:assets -- --task-id <uuid>          # Nur eine konkrete Aufgabe
//   npm run generate:assets -- --source <name>           # Andere Quelle (default: lambacher)
//   npm run generate:assets -- --force                   # Auch wenn assets bereits da sind
//   npm run generate:assets -- --limit 3                 # Max N Tasks pro Run (Schutz, default 10)
//
// Voraussetzungen (in .env):
//   ANTHROPIC_API_KEY=sk-ant-...
//   SUPABASE_URL (oder VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY (nur fuer --write)
//
// Output:
//   Pro Run ein JSON-Log unter scripts/generate-assets/runs/<ts>.json
//   mit allen Task-Results (status, message, uploaded_url, alt).

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_SOURCE = 'mathebuch_lambacher_8_nrw'
const RUNS_DIR = 'scripts/generate-assets/runs'
const BUCKET = 'task-assets'
const MODEL = 'claude-opus-4-7'

type TaskRow = {
  id: string
  source: string
  source_ref: string | null
  title: string | null
  question: string | null
  class_level: number | null
  cognitive_type: string | null
  assets: { url: string; alt: string; caption?: string }[]
}

type Args = {
  source: string
  taskId: string | null
  force: boolean
  write: boolean
  limit: number
}

type TaskResult = {
  task_id: string
  source_ref: string | null
  status: 'ok' | 'skip' | 'error' | 'dry'
  message: string
  uploaded_url?: string
  alt?: string
  svg_chars?: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    source: DEFAULT_SOURCE,
    taskId: null,
    force: false,
    write: false,
    limit: 10,
  }
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i]
    if (v === '--source') args.source = argv[++i] ?? args.source
    else if (v === '--task-id') args.taskId = argv[++i] ?? null
    else if (v === '--force') args.force = true
    else if (v === '--write') args.write = true
    else if (v === '--limit') args.limit = Number(argv[++i] ?? args.limit)
  }
  return args
}

const SYSTEM_PROMPT = `Du bist Illustrator fuer ein Mathe-Lehrbuch von Edvance (deutsche Hybrid-Lernakademie, Klasse 5-13).

Deine Aufgabe: Generiere fuer eine konkrete Schueler-Aufgabe eine saubere, didaktisch sinnvolle SVG-Illustration, die das Kernkonzept der Aufgabe visualisiert. Schueler:innen sollen sofort erkennen, worum es in der Aufgabe geht.

ANFORDERUNGEN AN DAS SVG:
- viewBox="0 0 600 400" (Querformat) oder "0 0 400 400" (quadratisch wenn passender)
- Nutze AUSSCHLIESSLICH diese Farben (Edvance-Design-System):
  - #1B2A3E (brand-navy) fuer Konturlinien, dunkle Akzente
  - #2D6A9F (primary) fuer Highlights, Markierungen
  - #98C0D8 (primary-light) fuer mittlere Flaechen
  - #EBF4FA (primary-pale) fuer Hintergruende, helle Flaechen
  - #FFFFFF (weiss)
  - Sparsam: #D97706 (warning) nur fuer eine besonders wichtige Hervorhebung
- Stil: Flat-Design / Line-Art, NICHT photorealistisch. Aesthetik wie Duolingo/Linear: klar, freundlich, ohne Verspieltheit.
- Strichstaerke 2-3px, abgerundete Linienenden (stroke-linecap="round", stroke-linejoin="round")
- Beschriftungen IN DEUTSCH, font-family="sans-serif", font-size mindestens 14
- Fokus auf das Schluesselkonzept (ein Hauptobjekt + max 2-3 unterstuetzende Elemente)
- KEINE externen Resources (kein <image>, <link>, <use href=...>)
- KEINE Scripte (<script>) und KEINE Event-Handler (onclick, onload usw.)
- Komplettes, eigenstaendiges <svg>-Element mit korrekt geschlossenen Tags

ANTWORTFORMAT:
Antworte EXAKT in diesem Format, ohne Markdown-Code-Block, ohne Vor- oder Nachtext.
Die Antwort startet direkt mit <alt> und endet mit </svg>:

<alt>Kurze deutsche Beschreibung der Illustration (max 80 Zeichen)</alt>
<svg ...> ... </svg>`

function buildUserPrompt(task: TaskRow): string {
  const cls = task.class_level ?? '?'
  const title = task.title ?? '(kein Titel)'
  const cog = task.cognitive_type ?? '?'
  const q = (task.question ?? '').slice(0, 1200)
  return `KLASSE ${cls} · ${cog}\n\nTITEL: ${title}\n\nAUFGABE:\n${q}`
}

function extractAltAndSvg(content: string): { alt: string; svg: string } | null {
  const altMatch = content.match(/<alt>([\s\S]*?)<\/alt>/i)
  const svgStart = content.indexOf('<svg')
  const svgEnd = content.lastIndexOf('</svg>')
  if (svgStart === -1 || svgEnd === -1) return null
  const svg = content.slice(svgStart, svgEnd + '</svg>'.length).trim()
  const alt = (altMatch?.[1] ?? '').trim() || 'Generierte Illustration'
  return { alt, svg }
}

const FORBIDDEN_SVG = /<script|<foreignObject|on(?:click|load|error|mouseover|submit|focus|blur)\s*=|javascript:/i

function validateSvg(svg: string): boolean {
  if (!svg.startsWith('<svg')) return false
  if (!svg.endsWith('</svg>')) return false
  if (FORBIDDEN_SVG.test(svg)) return false
  return true
}

async function generateForOne(
  task: TaskRow,
  anthropic: Anthropic,
  supabase: SupabaseClient | null,
  args: Args,
): Promise<TaskResult> {
  if (!args.force && task.assets.length > 0) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'skip',
      message: `hat bereits ${task.assets.length} Asset(s) — --force zum Regenerieren`,
    }
  }

  if (!task.question) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: 'kein question-Feld',
    }
  }

  let content = ''
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(task) }],
    })
    const block = resp.content[0]
    if (!block || block.type !== 'text') {
      return {
        task_id: task.id,
        source_ref: task.source_ref,
        status: 'error',
        message: 'Anthropic-Antwort nicht text-block',
      }
    }
    content = block.text
  } catch (err) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: `Claude-API: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  const extracted = extractAltAndSvg(content)
  if (!extracted) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: 'SVG/alt nicht parsebar (Format-Verstoss)',
    }
  }

  if (!validateSvg(extracted.svg)) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: 'SVG-Validierung fehlgeschlagen (kein <svg>, oder verbotene Tags)',
    }
  }

  if (!args.write || !supabase) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'dry',
      message: `dry: svg ${extracted.svg.length} Zeichen`,
      alt: extracted.alt,
      svg_chars: extracted.svg.length,
    }
  }

  const path = `tasks/${task.id}/generated-${Date.now()}.svg`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(extracted.svg, 'utf-8'), {
      contentType: 'image/svg+xml',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadError) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: `Storage-Upload: ${uploadError.message}`,
    }
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const newAssets = args.force
    ? [{ url: pub.publicUrl, alt: extracted.alt }]
    : [...task.assets, { url: pub.publicUrl, alt: extracted.alt }]

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ assets: newAssets })
    .eq('id', task.id)
  if (updateError) {
    return {
      task_id: task.id,
      source_ref: task.source_ref,
      status: 'error',
      message: `DB-Update: ${updateError.message}`,
    }
  }

  return {
    task_id: task.id,
    source_ref: task.source_ref,
    status: 'ok',
    message: 'asset hochgeladen + verlinkt',
    uploaded_url: pub.publicUrl,
    alt: extracted.alt,
    svg_chars: extracted.svg.length,
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!supabaseUrl) {
    console.error('Fehlende ENV: SUPABASE_URL (oder VITE_SUPABASE_URL)')
    process.exit(1)
  }
  if (!anthropicKey) {
    console.error('Fehlende ENV: ANTHROPIC_API_KEY')
    process.exit(1)
  }
  if (args.write && !serviceKey) {
    console.error('Fehlende ENV (fuer --write): SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const readKey = serviceKey ?? anonKey
  if (!readKey) {
    console.error('Fehlende ENV: SUPABASE_SERVICE_ROLE_KEY oder VITE_SUPABASE_ANON_KEY (fuer Read)')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, readKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let query = supabase
    .from('tasks')
    .select('id, source, source_ref, title, question, class_level, cognitive_type, assets')
    .eq('is_active', true)

  if (args.taskId) {
    query = query.eq('id', args.taskId)
  } else {
    query = query.eq('source', args.source).order('source_ref', { ascending: true })
  }

  const { data, error } = await query.limit(args.limit)
  if (error || !data) {
    console.error(`Tasks-Query fehlgeschlagen: ${error?.message ?? 'kein data'}`)
    process.exit(1)
  }
  const tasks = data as TaskRow[]

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log(`  ASSET-GENERATOR (${args.write ? 'WRITE' : 'DRY-RUN'})`)
  console.log('═══════════════════════════════════════════')
  console.log(`  Source     : ${args.source}`)
  if (args.taskId) console.log(`  Task-ID    : ${args.taskId}`)
  console.log(`  Force      : ${args.force}`)
  console.log(`  Limit      : ${args.limit}`)
  console.log(`  Tasks      : ${tasks.length}`)
  console.log(`  Modell     : ${MODEL}`)
  console.log('───────────────────────────────────────────')

  const startedAt = new Date().toISOString()
  const results: TaskResult[] = []
  const statusTag: Record<TaskResult['status'], string> = {
    ok: '✓',
    skip: '→',
    error: '✗',
    dry: '·',
  }

  for (const t of tasks) {
    const label = t.source_ref ?? t.id.slice(0, 8)
    process.stdout.write(`  ${label.padEnd(18)} `)
    const result = await generateForOne(t, anthropic, args.write ? supabase : null, args)
    results.push(result)
    console.log(`${statusTag[result.status]} ${result.status}: ${result.message}`)
  }

  const finishedAt = new Date().toISOString()
  const counts = {
    ok: results.filter((r) => r.status === 'ok').length,
    skip: results.filter((r) => r.status === 'skip').length,
    error: results.filter((r) => r.status === 'error').length,
    dry: results.filter((r) => r.status === 'dry').length,
  }

  console.log('───────────────────────────────────────────')
  console.log(`  Ok        : ${counts.ok}`)
  console.log(`  Skip      : ${counts.skip}`)
  console.log(`  Dry       : ${counts.dry}`)
  console.log(`  Fehler    : ${counts.error}`)
  console.log('═══════════════════════════════════════════')

  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true })
  const logPath = join(RUNS_DIR, `${startedAt.replace(/[:.]/g, '-')}.json`)
  writeFileSync(
    logPath,
    JSON.stringify({ startedAt, finishedAt, args, counts, results }, null, 2),
  )
  console.log(`  Log: ${logPath}`)
}

main().catch((err) => {
  console.error('Fataler Fehler:', err)
  process.exit(1)
})
