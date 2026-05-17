import { describe, it, expect } from 'vitest'
import { buildCoverageReport, formatCoverageReport } from './coverageReporter'
import type { GenerateResult } from './generator'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<GenerateResult> = {}): GenerateResult {
  return {
    test: {
      student_id: 'student-1',
      subject: 'MATH',
      grade: 8,
      generated_at: '2026-05-17T12:00:00Z',
      estimated_total_minutes: 18,
      coverage: [
        { topic_id: 'MATH.ALG.1', topic_label: 'Algebra Basics', task_id: 'task-1' },
      ],
      tasks: [
        {
          sequence: 1,
          task_id: 'task-1',
          topic_id: 'MATH.ALG.1',
          topic_label: 'Algebra Basics',
          input_type: 'MC',
          competency_level: 2,
          estimated_minutes: 6,
          coach_hint: 'Achte auf Vorzeichen.',
          typical_errors: [],
        },
        {
          sequence: 2,
          task_id: 'task-2',
          topic_id: 'MATH.GEO.1',
          topic_label: 'Geometrie',
          input_type: 'STEPS',
          competency_level: 2,
          estimated_minutes: 6,
          coach_hint: 'Pythagoras beachten.',
          typical_errors: [],
        },
        {
          sequence: 3,
          task_id: 'task-3',
          topic_id: 'MATH.STAT.1',
          topic_label: 'Statistik',
          input_type: 'MATCHING',
          competency_level: 1,
          estimated_minutes: 6,
          coach_hint: '',
          typical_errors: [],
        },
      ],
    },
    uncovered: [],
    warnings: [],
    ...overrides,
  }
}

const threeExpectedClusters = [
  { id: 'cluster-1', name: 'Algebra' },
  { id: 'cluster-2', name: 'Geometrie' },
  { id: 'cluster-3', name: 'Analysis' },
]

// ── buildCoverageReport ───────────────────────────────────────────────────────

describe('buildCoverageReport – coverage percentage', () => {
  it('reports 100% when all clusters are covered (none in uncovered list)', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    expect(report.clusters_covered).toBe(3)
    expect(report.coverage_pct).toBe(100)
    expect(report.total_clusters_expected).toBe(3)
  })

  it('reports 50% when half the clusters are in the uncovered list', () => {
    const result = makeResult({
      uncovered: [
        { topic_id: 'cluster-2', topic_label: 'Geometrie', reason: 'Keine Aufgabe gefunden' },
      ],
    })
    const clusters = [
      { id: 'cluster-1', name: 'Algebra' },
      { id: 'cluster-2', name: 'Geometrie' },
    ]
    const report = buildCoverageReport(result, clusters)
    expect(report.clusters_covered).toBe(1)
    expect(report.coverage_pct).toBe(50)
  })

  it('reports 0% when expected clusters list is empty', () => {
    const report = buildCoverageReport(makeResult(), [])
    expect(report.coverage_pct).toBe(0)
  })

  it('marks all clusters as uncovered when coverage list is empty', () => {
    const resultNoTasks = makeResult({
      test: {
        ...makeResult().test,
        coverage: [],
        tasks: [],
        estimated_total_minutes: 0,
      },
    })
    const report = buildCoverageReport(resultNoTasks, threeExpectedClusters)
    expect(report.clusters_covered).toBe(0)
    expect(report.coverage_pct).toBe(0)
  })
})

describe('buildCoverageReport – per_cluster details', () => {
  it('marks cluster as covered when not in uncovered list', () => {
    const report = buildCoverageReport(makeResult(), [{ id: 'cluster-1', name: 'Algebra' }])
    expect(report.per_cluster[0]?.covered).toBe(true)
    expect(report.per_cluster[0]?.topic_label).toBe('Algebra')
  })

  it('marks cluster as uncovered with reason when in uncovered list', () => {
    const result = makeResult({
      uncovered: [
        { topic_id: 'cluster-2', topic_label: 'Geometrie', reason: 'Kein Mikroskill' },
      ],
    })
    const report = buildCoverageReport(result, [{ id: 'cluster-2', name: 'Geometrie' }])
    expect(report.per_cluster[0]?.covered).toBe(false)
    expect(report.per_cluster[0]?.reason).toBe('Kein Mikroskill')
  })
})

describe('buildCoverageReport – time target range', () => {
  it('is in target range for 18 minutes', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    expect(report.total_minutes).toBe(18)
    expect(report.in_target_range).toBe(true)
  })

  it('is in target range at the lower bound (16 min)', () => {
    const result = makeResult({
      test: { ...makeResult().test, estimated_total_minutes: 16 },
    })
    expect(buildCoverageReport(result, threeExpectedClusters).in_target_range).toBe(true)
  })

  it('is in target range at the upper bound (22 min)', () => {
    const result = makeResult({
      test: { ...makeResult().test, estimated_total_minutes: 22 },
    })
    expect(buildCoverageReport(result, threeExpectedClusters).in_target_range).toBe(true)
  })

  it('is outside target range when below 16 minutes', () => {
    const result = makeResult({
      test: { ...makeResult().test, estimated_total_minutes: 14 },
    })
    expect(buildCoverageReport(result, threeExpectedClusters).in_target_range).toBe(false)
  })

  it('is outside target range when above 22 minutes', () => {
    const result = makeResult({
      test: { ...makeResult().test, estimated_total_minutes: 25 },
    })
    expect(buildCoverageReport(result, threeExpectedClusters).in_target_range).toBe(false)
  })
})

describe('buildCoverageReport – missing input types', () => {
  it('reports no missing types when MC, STEPS, and MATCHING are all present', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    expect(report.missing_input_types).toHaveLength(0)
  })

  it('reports all required types as missing when only FREE_INPUT is present', () => {
    const result = makeResult({
      test: {
        ...makeResult().test,
        tasks: [
          {
            sequence: 1,
            task_id: 'task-x',
            topic_id: 'MATH.ALG.1',
            topic_label: 'Algebra',
            input_type: 'FREE_INPUT',
            competency_level: 2,
            estimated_minutes: 5,
            coach_hint: '',
            typical_errors: [],
          },
        ],
      },
    })
    const report = buildCoverageReport(result, threeExpectedClusters)
    expect(report.missing_input_types).toContain('MC')
    expect(report.missing_input_types).toContain('STEPS')
    expect(report.missing_input_types).toContain('MATCHING')
  })

  it('reports only missing types when some are present', () => {
    const result = makeResult({
      test: {
        ...makeResult().test,
        tasks: [
          {
            sequence: 1,
            task_id: 'task-mc',
            topic_id: 'MATH.ALG.1',
            topic_label: 'Algebra',
            input_type: 'MC',
            competency_level: 2,
            estimated_minutes: 5,
            coach_hint: '',
            typical_errors: [],
          },
        ],
      },
    })
    const report = buildCoverageReport(result, threeExpectedClusters)
    expect(report.missing_input_types).not.toContain('MC')
    expect(report.missing_input_types).toContain('STEPS')
    expect(report.missing_input_types).toContain('MATCHING')
  })
})

describe('buildCoverageReport – warnings passthrough', () => {
  it('passes through warnings from the generator result', () => {
    const result = makeResult({ warnings: ['Zeitbudget überschritten', 'DRAW nicht verfügbar'] })
    const report = buildCoverageReport(result, threeExpectedClusters)
    expect(report.warnings).toEqual(['Zeitbudget überschritten', 'DRAW nicht verfügbar'])
  })

  it('returns empty warnings array when generator has none', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    expect(report.warnings).toEqual([])
  })
})

describe('buildCoverageReport – metadata', () => {
  it('carries subject and grade from the test', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    expect(report.subject).toBe('MATH')
    expect(report.grade).toBe(8)
  })
})

// ── formatCoverageReport ──────────────────────────────────────────────────────

describe('formatCoverageReport', () => {
  it('contains the subject and grade in the header', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('MATH')
    expect(text).toContain('8')
  })

  it('shows cluster count and percentage', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('3/3')
    expect(text).toContain('100%')
  })

  it('shows total minutes with target range indicator for in-range', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('18 Min')
    expect(text).toContain('16-22')
  })

  it('shows ⚠ indicator when outside time target range', () => {
    const result = makeResult({
      test: { ...makeResult().test, estimated_total_minutes: 30 },
    })
    const report = buildCoverageReport(result, threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('ausserhalb')
  })

  it('marks covered clusters with ✓ and uncovered with ✗', () => {
    const result = makeResult({
      uncovered: [
        { topic_id: 'cluster-2', topic_label: 'Geometrie', reason: 'Kein Task' },
      ],
    })
    const clusters = [
      { id: 'cluster-1', name: 'Algebra' },
      { id: 'cluster-2', name: 'Geometrie' },
    ]
    const report = buildCoverageReport(result, clusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('✓ Algebra')
    expect(text).toContain('✗ Geometrie')
    expect(text).toContain('Kein Task')
  })

  it('shows missing input types when present', () => {
    const result = makeResult({
      test: {
        ...makeResult().test,
        tasks: [],
        coverage: [],
        estimated_total_minutes: 0,
      },
    })
    const report = buildCoverageReport(result, threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('MC')
  })

  it('shows warnings section when warnings are present', () => {
    const result = makeResult({ warnings: ['Zeitbudget überschritten'] })
    const report = buildCoverageReport(result, threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('Warnungen')
    expect(text).toContain('Zeitbudget überschritten')
  })

  it('omits warnings section when no warnings', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).not.toContain('Warnungen')
  })

  it('returns a string with separator lines', () => {
    const report = buildCoverageReport(makeResult(), threeExpectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('═══')
  })
})
