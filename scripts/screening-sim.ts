// Deterministische Simulation des adaptiven Screening-Controllers
// (P4-Verifikation, da kein Test-Runner im Projekt). Baut synthetische
// Pools, spielt Antwortmuster durch und prüft die im Plan geforderten
// Eigenschaften per node:assert. Lauf: npm run sim:screening
//
// Geprüft: Warm-up-Sweep (1×L1 je Cluster), Fokus-Start L2, Treppe
// L2→L3 (richtig) / L2→L1 (falsch), harter Themen-Ausschluss, Gewichtung
// (mehr Tiefe), Budget-Stopp, graceful bei fehlender Stufe, leerer Pool.

import assert from 'node:assert/strict'
import type { ScreeningItem, ScreeningLevel } from '@/types'
import {
  createAdaptiveSession,
  isComplete,
  nextItem,
  submitAnswer,
  summarize,
  summarizeLogs,
} from '@/lib/screening/adaptive'

// Deterministischer RNG (mulberry32).
function rngFactory(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let seq = 0
function mk(
  clusterId: string,
  topic: string,
  level: ScreeningLevel,
  value: number,
): ScreeningItem {
  seq += 1
  return {
    id: `${clusterId}-${topic}-L${level}-${seq}`,
    created_at: '2026-01-01T00:00:00Z',
    cluster_id: clusterId,
    class_level: 8,
    topic,
    skill_code: `${topic}_skill`,
    skill_label: `${topic} Skill`,
    level,
    curriculum_seq: 1,
    input_type: 'NUMERIC',
    prompt: `Wert ${value}?`,
    payload: null,
    canonical: { value },
    check_type: 'numeric',
    tolerance: 0,
    typical_errors: [],
    explanation: null,
    source: 'sim',
    active: true,
  }
}

function poolFor(clusterId: string, topic: string, perLevel = 4): ScreeningItem[] {
  const out: ScreeningItem[] = []
  for (const lvl of [1, 2, 3] as ScreeningLevel[]) {
    for (let i = 0; i < perLevel; i += 1) out.push(mk(clusterId, topic, lvl, lvl * 10 + i))
  }
  return out
}

function answerFor(item: ScreeningItem, correct: boolean): { value: number } {
  const v = (item.canonical as { value: number }).value
  return { value: correct ? v : v + 7 }
}

// ── 1) Warm-up-Sweep + Treppe + summarize ────────────────────────────────────
{
  const pool = [
    ...poolFor('cA', 'tA'),
    ...poolFor('cB', 'tB'),
    ...poolFor('cC', 'tC'),
  ]
  const s = createAdaptiveSession(pool, { rng: rngFactory(1) })

  const warm: ScreeningItem[] = []
  for (let i = 0; i < 3; i += 1) {
    const it = nextItem(s)
    assert.ok(it, 'Warm-up: Item erwartet')
    assert.equal(it.level, 1, 'Warm-up muss Stufe 1 sein')
    warm.push(it)
    submitAnswer(s, answerFor(it, true), 1000)
  }
  assert.equal(
    new Set(warm.map((w) => w.cluster_id)).size,
    3,
    'Warm-up-Sweep: je Cluster genau einmal',
  )

  // Erstes Fokus-Item: Start auf Stufe 2.
  const f1 = nextItem(s)
  assert.ok(f1, 'Fokus-Item erwartet')
  assert.equal(f1.level, 2, 'Fokus-Start muss Stufe 2 sein')
  const fc = f1.cluster_id
  submitAnswer(s, answerFor(f1, true), 1000) // richtig → hoch

  // Nächstes Item desselben Clusters muss Stufe 3 sein.
  let f2: ScreeningItem | null = null
  for (let g = 0; g < 20; g += 1) {
    const it = nextItem(s)
    if (!it) break
    if (it.cluster_id === fc) {
      f2 = it
      break
    }
    submitAnswer(s, answerFor(it, true), 1000)
  }
  assert.ok(f2, 'Folge-Fokus-Item erwartet')
  assert.equal(f2.level, 3, 'Richtig auf L2 → L3')
  submitAnswer(s, answerFor(f2, false), 1000) // falsch → runter

  let f3: ScreeningItem | null = null
  for (let g = 0; g < 20; g += 1) {
    const it = nextItem(s)
    if (!it) break
    if (it.cluster_id === fc) {
      f3 = it
      break
    }
    submitAnswer(s, answerFor(it, true), 1000)
  }
  if (f3) assert.equal(f3.level, 2, 'Falsch auf L3 → L2')

  // Test zu Ende spielen, dann auswerten.
  for (let g = 0; g < 200 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    submitAnswer(s, answerFor(it, true), 1000)
  }
  const sum = summarize(s)
  assert.equal(sum.length, 3, 'summarize: 3 Cluster')
  for (const c of sum) {
    assert.ok(c.answered > 0, 'jeder Cluster beantwortet')
    assert.ok(c.mastery >= 0 && c.mastery <= 1, 'mastery in [0,1]')
  }
}

// ── 2) Harter Themen-Ausschluss ──────────────────────────────────────────────
{
  const pool = [...poolFor('cA', 'tA'), ...poolFor('cX', 'tX')]
  const s = createAdaptiveSession(pool, {
    excludedTopics: ['tX'],
    rng: rngFactory(2),
  })
  for (let g = 0; g < 200 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    assert.notEqual(it.topic, 'tX', 'ausgeschlossenes Thema darf nie erscheinen')
    submitAnswer(s, answerFor(it, true), 1000)
  }
  assert.equal(
    summarize(s).find((c) => c.clusterId === 'cX'),
    undefined,
    'ausgeschlossener Cluster nicht in Auswertung',
  )
}

// ── 3) Gewichtung → mehr Tiefe ───────────────────────────────────────────────
{
  const pool = [...poolFor('cA', 'tA', 6), ...poolFor('cB', 'tB', 6)]
  const s = createAdaptiveSession(pool, {
    weightedTopics: ['tA'],
    rng: rngFactory(3),
  })
  for (let g = 0; g < 200 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    submitAnswer(s, answerFor(it, true), 1000)
  }
  const sum = summarize(s)
  const a = sum.find((c) => c.clusterId === 'cA')
  const b = sum.find((c) => c.clusterId === 'cB')
  assert.ok(a && b, 'beide Cluster vorhanden')
  assert.ok(
    a.answered > b.answered,
    `gewichteter Cluster tiefer geprüft (A=${a.answered} > B=${b.answered})`,
  )
}

// ── 4) Budget-Stopp ──────────────────────────────────────────────────────────
{
  const pool = [...poolFor('cA', 'tA'), ...poolFor('cB', 'tB')]
  const s = createAdaptiveSession(pool, { budgetMs: 2500, rng: rngFactory(4) })
  let asked = 0
  for (let g = 0; g < 200 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    asked += 1
    submitAnswer(s, answerFor(it, true), 1000) // 1s je Antwort
  }
  assert.ok(asked <= 4, `Budget stoppt früh (gestellt: ${asked})`)
  assert.ok(isComplete(s), 'nach Budget ist der Test fertig')
}

// ── 5) Graceful: Cluster nur mit Stufe 2 ─────────────────────────────────────
{
  const onlyL2 = [0, 1, 2, 3].map((i) => mk('cA', 'tA', 2, 100 + i))
  const s = createAdaptiveSession(onlyL2, { rng: rngFactory(5) })
  let count = 0
  for (let g = 0; g < 50 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    assert.equal(it.level, 2, 'nur Stufe 2 verfügbar → diese wird genutzt')
    count += 1
    submitAnswer(s, answerFor(it, true), 1000)
  }
  assert.ok(count > 0, 'fehlende Stufen → kein Crash, Test läuft')
}

// ── 6) Leerer Pool ───────────────────────────────────────────────────────────
{
  const s = createAdaptiveSession([], { rng: rngFactory(6) })
  assert.equal(nextItem(s), null, 'leerer Pool → kein Item')
  assert.ok(isComplete(s), 'leerer Pool → sofort fertig')
  assert.deepEqual(summarize(s), [], 'leerer Pool → leere Auswertung')
}

// ── 7) Dynamischer Startpunkt: falsches Warm-up → Focus-Start L1 ─────────────
{
  const pool = poolFor('cA', 'tA')
  const s = createAdaptiveSession(pool, { rng: rngFactory(7) })
  const warm = nextItem(s)
  assert.ok(warm && warm.level === 1, 'Warm-up L1')
  submitAnswer(s, answerFor(warm, false), 1000) // Warm-up FALSCH
  const f1 = nextItem(s)
  assert.ok(f1, 'Fokus-Item nach falschem Warm-up')
  assert.equal(f1.level, 1, 'falsches Warm-up → Focus-Start L1')
}

// ── 8) Bestätigung an AFB III: Glückstreffer ohne 2. Treffer ≠ Level 3 ───────
{
  const pool = poolFor('cA', 'tA', 4)
  const s = createAdaptiveSession(pool, { rng: rngFactory(8) })
  // Warm-up richtig → Focus startet auf L2
  const warm = nextItem(s)!
  submitAnswer(s, answerFor(warm, true), 1000)
  // L2 richtig → L3
  const l2 = nextItem(s)!
  assert.equal(l2.level, 2)
  submitAnswer(s, answerFor(l2, true), 1000)
  // L3 richtig (Glückstreffer) → aber dann L3 falsch
  const l3a = nextItem(s)!
  assert.equal(l3a.level, 3)
  submitAnswer(s, answerFor(l3a, true), 1000)
  // Cap erhöht sich (needsConfirm) → noch ein L3-Item
  const l3b = nextItem(s)
  if (l3b && l3b.cluster_id === 'cA') {
    assert.equal(l3b.level, 3, 'AFB III braucht Bestätigung — weiteres L3-Item')
    submitAnswer(s, answerFor(l3b, false), 1000) // falsch → keine Bestätigung
  }
  // bis Ende durchspielen
  for (let g = 0; g < 50 && !isComplete(s); g += 1) {
    const it = nextItem(s)
    if (!it) break
    submitAnswer(s, answerFor(it, true), 1000)
  }
  const cA = summarize(s).find((c) => c.clusterId === 'cA')!
  assert.ok(
    cA.estimatedLevel < 3,
    `nur 1× richtig auf L3 → estimatedLevel < 3 (war ${cA.estimatedLevel})`,
  )
}

// ── 9) Schärfere Konvergenz: 2× richtig in Folge stoppt NICHT vorzeitig ──────
{
  const pool = poolFor('cA', 'tA', 4)
  const s = createAdaptiveSession(pool, { rng: rngFactory(9) })
  // Warm-up richtig
  submitAnswer(s, answerFor(nextItem(s)!, true), 1000)
  // L2 richtig
  const a = nextItem(s)!
  assert.equal(a.level, 2)
  submitAnswer(s, answerFor(a, true), 1000)
  // Nach 2× richtig in Folge (Warm-up L1 + L2) muss die Treppe weiterlaufen.
  const b = nextItem(s)
  assert.ok(b, 'nach 2× richtig nicht vorzeitig fertig')
  assert.equal(b!.level, 3, 'Treppe steigt weiter auf L3')
}

// ── 10) Mastery-Downgrade: 2× richtig + 3× falsch auf L2 → estimatedLevel 1 ──
{
  // summarizeLogs deckt die reine Auswertungslogik ab — ohne Treppe.
  const logs = [
    { itemId: 'i1', clusterId: 'cA', level: 1 as ScreeningLevel, correct: true, durationMs: 0 },
    { itemId: 'i2', clusterId: 'cA', level: 2 as ScreeningLevel, correct: true, durationMs: 0 },
    { itemId: 'i3', clusterId: 'cA', level: 2 as ScreeningLevel, correct: true, durationMs: 0 },
    { itemId: 'i4', clusterId: 'cA', level: 2 as ScreeningLevel, correct: false, durationMs: 0 },
    { itemId: 'i5', clusterId: 'cA', level: 2 as ScreeningLevel, correct: false, durationMs: 0 },
    { itemId: 'i6', clusterId: 'cA', level: 2 as ScreeningLevel, correct: false, durationMs: 0 },
  ]
  const [c] = summarizeLogs(logs)
  // L2-Mastery = 2/5 = 40 % < 50 % → Downgrade auf 1.
  assert.equal(c.estimatedLevel, 1, 'wackelige L2-Mastery → Downgrade auf L1')
  assert.equal(c.reachedAfb, 'I')
}

// ── 11) Konfidenz-Feld ───────────────────────────────────────────────────────
{
  // Sehr dünn beantwortet → low
  const thin = summarizeLogs([
    { itemId: 'x1', clusterId: 'cA', level: 1, correct: true, durationMs: 0 },
  ])
  assert.equal(thin[0].confidence, 'low', 'nur 1 Item → low')

  // Solide bestätigt → high
  const solid = summarizeLogs([
    { itemId: 'y1', clusterId: 'cB', level: 1, correct: true, durationMs: 0 },
    { itemId: 'y2', clusterId: 'cB', level: 2, correct: true, durationMs: 0 },
    { itemId: 'y3', clusterId: 'cB', level: 2, correct: true, durationMs: 0 },
    { itemId: 'y4', clusterId: 'cB', level: 3, correct: false, durationMs: 0 },
  ])
  assert.equal(solid[0].confidence, 'high', '4 entschiedene Items, Treffer auf L2 → high')

  // Mehrere offene → medium oder low (keine high)
  const pending = summarizeLogs([
    { itemId: 'z1', clusterId: 'cC', level: 1, correct: true, durationMs: 0 },
    { itemId: 'z2', clusterId: 'cC', level: 2, correct: null, durationMs: 0 },
    { itemId: 'z3', clusterId: 'cC', level: 2, correct: null, durationMs: 0 },
  ])
  assert.notEqual(pending[0].confidence, 'high', 'viele Pendings dürfen nicht high werden')
}

console.log('screening-sim: alle Checks bestanden ✓')
