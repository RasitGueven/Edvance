// Ordnet die importierten Lambacher-Aufgaben den richtigen Skill-Clustern zu
// und befüllt input_type + question_payload pro Aufgabe.
//
// Usage:
//   npm run map:lambacher              # Dry-Run (default)
//   npm run map:lambacher -- --write   # Tatsächlich schreiben
//
// Voraussetzungen: Cluster müssen via seed:clusters vorhanden sein.

import { createClient } from '@supabase/supabase-js'

const DRY = !process.argv.includes('--write')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ─── Payload-Definitionen ────────────────────────────────────────────────────

type TaskPatch = {
  sourceRef: string
  clusterName: string
  inputType: 'MC' | 'MATCHING' | 'STEPS' | 'FREE_INPUT'
  difficulty: number
  payload: object | null
}

const PATCHES: TaskPatch[] = [
  {
    sourceRef: 'kap1.s10.nr1',
    clusterName: 'Daten & Zufall',
    inputType: 'MATCHING',
    difficulty: 2,
    payload: {
      type: 'matching',
      pairs: [
        { left: 'Versuch A – fairer Würfel', right: 'Alle Augenzahlen etwa gleich häufig (~33 von 200)' },
        { left: 'Versuch B – Gewicht auf Seite 1', right: 'Augenzahl 1 deutlich häufiger (~55 von 200)' },
        { left: 'Versuch C – Gewicht auf Seite 6', right: 'Augenzahl 6 deutlich häufiger (~55 von 200)' },
        { left: 'Versuch D – zweimal fairer Würfel', right: 'Sehr gleichmäßig, kleine Schwankungen' },
      ],
    },
  },
  {
    sourceRef: 'kap1.s10.nr2',
    clusterName: 'Daten & Zufall',
    inputType: 'FREE_INPUT',
    difficulty: 2,
    payload: null,
  },
  {
    sourceRef: 'kap1.s10.nr3',
    clusterName: 'Daten & Zufall',
    inputType: 'STEPS',
    difficulty: 2,
    payload: {
      type: 'steps',
      steps: [
        {
          prompt: 'Sandro würfelt 50-mal mit dem dünnen Zylinder: 28× Wappen (W), 18× Zahl (Z), 4× Rand (R). Berechne die relative Häufigkeit für "Wappen".',
          placeholder: 'h(W) = …',
        },
        {
          prompt: 'Sabine würfelt ebenfalls 50-mal: 22× W, 24× Z, 4× R. Berechne h(Wappen) für Sabines Versuch.',
          placeholder: 'h(W) = …',
        },
        {
          prompt: 'Welche Schätzung für P(Wappen) hältst du für zuverlässiger? Begründe kurz.',
          placeholder: 'P(W) ≈ … weil …',
        },
      ],
    },
  },
  {
    sourceRef: 'kap1.s10.nr4',
    clusterName: 'Daten & Zufall',
    inputType: 'STEPS',
    difficulty: 2,
    payload: {
      type: 'steps',
      steps: [
        {
          prompt: 'Heiko wirft 50-mal: 33× schwarz oben (S), 14× weiß oben (W), 3× auf Gewinde (G). Berechne h(S).',
          placeholder: 'h(S) = …',
        },
        {
          prompt: 'Simon wirft 200-mal: 131× S, 57× W, 12× G. Berechne h(S) für Simons Versuch.',
          placeholder: 'h(S) = …',
        },
        {
          prompt: 'Schätze P(schwarz oben). Wessen Versuch liefert die verlässlichere Schätzung — und warum?',
          placeholder: 'P(S) ≈ … weil …',
        },
      ],
    },
  },
  {
    sourceRef: 'kap1.s11.nr5',
    clusterName: 'Daten & Zufall',
    inputType: 'MC',
    difficulty: 3,
    payload: {
      type: 'mc',
      options: [
        'Ja – Mario sollte annehmen. P(mindestens eine 6) > 50 %, also ist die Wette für ihn vorteilhaft.',
        'Nein – Mario sollte ablehnen. P(mindestens eine 6) < 50 %, also ist die Wette leicht gegen ihn.',
        'Ja – Mario sollte annehmen. Drei Versuche sind viel, eine 6 fällt fast immer.',
        'Es ist egal – die Wette ist für beide exakt gleich fair.',
      ],
      correct_index: 1,
    },
  },
  {
    sourceRef: 'kap1.s11.nr6',
    clusterName: 'Daten & Zufall',
    inputType: 'STEPS',
    difficulty: 3,
    payload: {
      type: 'steps',
      steps: [
        {
          prompt: 'Berechne den Flächeninhalt jedes der drei Seitenpaare des Quaders mit a = 1,3 cm, b = 2 cm, c = 2,3 cm.',
          placeholder: 'A₁ = … cm², A₂ = … cm², A₃ = … cm²',
        },
        {
          prompt: 'Berechne die Gesamtoberfläche O des Quaders.',
          placeholder: 'O = … cm²',
        },
        {
          prompt: 'Berechne für jedes Seitenpaar den Anteil an der Gesamtoberfläche. Entspricht dieser Anteil der Wahrscheinlichkeit, auf dieser Seite zu landen?',
          placeholder: 'Anteile: … %; Antwort: …',
        },
      ],
    },
  },
  {
    sourceRef: 'kap1.s11.nr7',
    clusterName: 'Daten & Zufall',
    inputType: 'MC',
    difficulty: 1,
    payload: {
      type: 'mc',
      options: [
        'Jans Schätzung (750 Würfe) ist am zuverlässigsten – mehr Würfe bedeuten stabilere Häufigkeiten.',
        'Helenas Schätzung (250 Würfe) ist am besten – sie hat weniger Zufallsfehler gemacht.',
        'Alle drei Schätzungen sind gleichwertig, weil sie alle ~68 % ergeben haben.',
        'Susannes Schätzung (500 Würfe) ist am besten, weil 500 ein schöner runder Wert ist.',
      ],
      correct_index: 0,
    },
  },
  {
    sourceRef: 'kap1.s11.nr8',
    clusterName: 'Daten & Zufall',
    inputType: 'STEPS',
    difficulty: 3,
    payload: {
      type: 'steps',
      steps: [
        {
          prompt: 'Stelle alle 8 möglichen Ergebnisse für drei Münzen systematisch auf (W = Wappen, Z = Zahl).',
          placeholder: 'WWW, WWZ, …',
        },
        {
          prompt: 'Wie viele Ergebnisse zeigen genau 0 Wappen? Berechne P(0 Wappen).',
          placeholder: 'P(0 W) = …/8 = …',
        },
        {
          prompt: 'Wie viele Ergebnisse zeigen genau 2 Wappen? Berechne P(2 Wappen).',
          placeholder: 'P(2 W) = …/8 = …',
        },
        {
          prompt: 'Hat Heiko Recht, dass man P(0 W), P(1 W), P(2 W), P(3 W) durch einfaches Abzählen bestimmen kann? Stimmen alle vier Wahrscheinlichkeiten?',
          placeholder: 'Ja/Nein: …',
        },
      ],
    },
  },
  {
    sourceRef: 'kap1.s11.nr9',
    clusterName: 'Daten & Zufall',
    inputType: 'FREE_INPUT',
    difficulty: 3,
    payload: null,
  },
  {
    sourceRef: 'kap1.s11.nr10',
    clusterName: 'Algebra & Funktionen',
    inputType: 'STEPS',
    difficulty: 1,
    payload: {
      type: 'steps',
      steps: [
        { prompt: 'Schreibe einen Term für den Vorgänger von x.', placeholder: 'T₁ = …' },
        { prompt: 'Schreibe einen Term für das Doppelte von x.', placeholder: 'T₂ = …' },
        { prompt: 'Schreibe einen Term für das Doppelte des Vorgängers von x.', placeholder: 'T₃ = …' },
        {
          prompt: 'Überprüfe alle drei Terme für x = 3 und x = –2.',
          placeholder: 'x=3: T₁=… T₂=… T₃=…  |  x=–2: T₁=… T₂=… T₃=…',
        },
      ],
    },
  },
]

// ─── Haupt-Logik ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`  LAMBACHER CLUSTER-MAPPING (${DRY ? 'DRY-RUN' : 'WRITE'})`)
  console.log(`${'═'.repeat(50)}`)

  // Mathematik-Subject laden
  const { data: subjects } = await supabase.from('subjects').select('id, name').eq('name', 'Mathematik').limit(1)
  const mathId = subjects?.[0]?.id
  if (!mathId) { console.error('❌ Fach "Mathematik" nicht gefunden — seed:taxonomy zuerst ausführen'); process.exit(1) }

  // Alle Cluster laden
  const { data: clusters } = await supabase.from('skill_clusters').select('id, name').eq('subject_id', mathId)
  if (!clusters?.length) { console.error('❌ Keine Cluster — seed:clusters zuerst ausführen'); process.exit(1) }
  const clusterByName = Object.fromEntries(clusters.map((c) => [c.name, c.id]))

  console.log(`  Cluster geladen: ${clusters.map((c) => c.name).join(', ')}\n`)

  let ok = 0, skip = 0, err = 0

  for (const patch of PATCHES) {
    const clusterId = clusterByName[patch.clusterName]
    if (!clusterId) {
      console.log(`  ${patch.sourceRef.padEnd(20)} ✗ Cluster "${patch.clusterName}" nicht gefunden`)
      err++
      continue
    }

    if (DRY) {
      console.log(`  ${patch.sourceRef.padEnd(20)} · dry → cluster=${patch.clusterName}, type=${patch.inputType}, diff=${patch.difficulty}`)
      ok++
      continue
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        cluster_id: clusterId,
        input_type: patch.inputType,
        difficulty: patch.difficulty,
        question_payload: patch.payload,
      })
      .eq('source', 'mathebuch_lambacher_8_nrw')
      .eq('source_ref', patch.sourceRef)

    if (error) {
      console.log(`  ${patch.sourceRef.padEnd(20)} ✗ ${error.message}`)
      err++
    } else {
      console.log(`  ${patch.sourceRef.padEnd(20)} ✓ → ${patch.clusterName} · ${patch.inputType}`)
      ok++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  OK: ${ok}  Skip: ${skip}  Fehler: ${err}`)
  console.log(`${'═'.repeat(50)}\n`)
  if (DRY) console.log('  → Mit --write ausführen um tatsächlich zu schreiben.\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
