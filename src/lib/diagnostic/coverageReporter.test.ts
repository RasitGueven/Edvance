import { describe, it, expect } from 'vitest'
import { buildCoverageReport, formatCoverageReport } from './coverageReporter'
import type { GenerateResult } from './generator'
import type { DiagnosticTest } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTest(overrides: Partial<DiagnosticTest> = {}): DiagnosticTest {
  return {
    student_id: 'student-1',
    subject: 'Mathematik',
    grade: 8,
    generated_at: '2026-05-18T10:00:00Z',
    estimated_total_minutes: 18,
    tasks: [
      {
        sequence: 1,
        task_id: 'task-a',
        topic_id: 'M8.ZR.01',
        topic_label: 'Zahlenraum',
        input_type: 'MC',
        competency_level: 2,
        estimated_minutes: 6,
        coach_hint: '',
        typical_errors: [],
      },
      {
        sequence: 2,
        task_id: 'task-b',
        topic_id: 'M8.BR.01',
        topic_label: 'Bruchrechnung',
        input_type: 'STEPS',
        competency_level: 2,
        estimated_minutes: 6,
        coach_hint: '',
        typical_errors: [],
      },
      {
        sequence: 3,
        task_id: 'task-c',
        topic_id: 'M8.GE.01',
        topic_label: 'Geometrie',
        input_type: 'MATCHING',
        competency_level: 2,
        estimated_minutes: 6,
        coach_hint: '',
        typical_errors: [],
      },
    ],
    coverage: [
      { topic_id: 'M8.ZR.01', topic_label: 'Zahlenraum', task_id: 'task-a' },
      { topic_id: 'M8.BR.01', topic_label: 'Bruchrechnung', task_id: 'task-b' },
      { topic_id: 'M8.GE.01', topic_label: 'Geometrie', task_id: 'task-c' },
    ],
    ...overrides,
  }
}

function makeResult(
  testOverrides: Partial<DiagnosticTest> = {},
  resultOverrides: Partial<Omit<GenerateResult, 'test'>> = {},
): GenerateResult {
  return {
    test: makeTest(testOverrides),
    uncovered: [],
    warnings: [],
    ...resultOverrides,
  }
}

const expectedClusters = [
  { id: 'cluster-zr', name: 'Zahlenraum' },
  { id: 'cluster-br', name: 'Bruchrechnung' },
  { id: 'cluster-ge', name: 'Geometrie' },
]

// ── buildCoverageReport ────────────────────────────────────────────────────────

describe('buildCoverageReport()', () => {
  it('reports 100% coverage when nothing is uncovered', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.clusters_covered).toBe(3)
    expect(report.coverage_pct).toBe(100)
    expect(report.total_clusters_expected).toBe(3)
  })

  it('marks uncovered clusters correctly via uncovered list', () => {
    const result = makeResult(
      {},
      {
        uncovered: [{ topic_id: 'cluster-br', topic_label: 'Bruchrechnung', reason: 'Keine Aufgabe verfügbar' }],
      },
    )
    const report = buildCoverageReport(result, expectedClusters)
    const brCluster = report.per_cluster.find((c) => c.topic_id === 'cluster-br')
    expect(brCluster?.covered).toBe(false)
    expect(brCluster?.reason).toBe('Keine Aufgabe verfügbar')
  })

  it('calculates coverage_pct correctly for partial coverage', () => {
    const result = makeResult(
      {},
      {
        uncovered: [{ topic_id: 'cluster-ge', topic_label: 'Geometrie', reason: 'Budget exceeded' }],
      },
    )
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.clusters_covered).toBe(2)
    expect(report.coverage_pct).toBe(67) // Math.round(2/3 * 100)
  })

  it('returns coverage_pct 0 for zero expected clusters', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, [])
    expect(report.coverage_pct).toBe(0)
    expect(report.clusters_covered).toBe(0)
  })

  it('reports in_target_range true for 16-22 minutes', () => {
    const result = makeResult({ estimated_total_minutes: 19 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.in_target_range).toBe(true)
  })

  it('reports in_target_range true at exact boundary of 16', () => {
    const result = makeResult({ estimated_total_minutes: 16 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.in_target_range).toBe(true)
  })

  it('reports in_target_range true at exact boundary of 22', () => {
    const result = makeResult({ estimated_total_minutes: 22 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.in_target_range).toBe(true)
  })

  it('reports in_target_range false for under 16 minutes', () => {
    const result = makeResult({ estimated_total_minutes: 14 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.in_target_range).toBe(false)
  })

  it('reports in_target_range false for over 22 minutes', () => {
    const result = makeResult({ estimated_total_minutes: 25 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.in_target_range).toBe(false)
  })

  it('detects missing input types', () => {
    const result = makeResult({
      tasks: [
        {
          sequence: 1,
          task_id: 'task-a',
          topic_id: 'M8.ZR.01',
          topic_label: 'Zahlenraum',
          input_type: 'MC',
          competency_level: 2,
          estimated_minutes: 18,
          coach_hint: '',
          typical_errors: [],
        },
      ],
    })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.missing_input_types).toContain('STEPS')
    expect(report.missing_input_types).toContain('MATCHING')
    expect(report.missing_input_types).not.toContain('MC')
  })

  it('has no missing input types when all three present', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.missing_input_types).toHaveLength(0)
  })

  it('passes through warnings from generate result', () => {
    const result = makeResult({}, { warnings: ['Cluster X has only 1 task'] })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.warnings).toContain('Cluster X has only 1 task')
  })

  it('includes correct subject and grade from test', () => {
    const result = makeResult({ subject: 'Physik', grade: 9 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.subject).toBe('Physik')
    expect(report.grade).toBe(9)
  })

  it('includes total_minutes from test', () => {
    const result = makeResult({ estimated_total_minutes: 20 })
    const report = buildCoverageReport(result, expectedClusters)
    expect(report.total_minutes).toBe(20)
  })
})

// ── formatCoverageReport ──────────────────────────────────────────────────────

describe('formatCoverageReport()', () => {
  it('contains subject and grade in output', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('Mathematik')
    expect(text).toContain('8')
  })

  it('shows cluster count fraction', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('3/3')
  })

  it('shows ✓ for in-target-range time', () => {
    const result = makeResult({ estimated_total_minutes: 18 })
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('✓ Zielkorridor 16-22')
  })

  it('shows ⚠ for out-of-target-range time', () => {
    const result = makeResult({ estimated_total_minutes: 25 })
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('⚠ ausserhalb 16-22')
  })

  it('shows ✓ for covered clusters and ✗ for uncovered', () => {
    const result = makeResult(
      {},
      {
        uncovered: [{ topic_id: 'cluster-ge', topic_label: 'Geometrie', reason: 'Kein Budget' }],
      },
    )
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('✓ Zahlenraum')
    expect(text).toContain('✗ Geometrie')
  })

  it('shows missing input types when present', () => {
    const result = makeResult({
      tasks: [
        {
          sequence: 1,
          task_id: 'task-a',
          topic_id: 'M8.ZR.01',
          topic_label: 'Zahlenraum',
          input_type: 'MC',
          competency_level: 2,
          estimated_minutes: 18,
          coach_hint: '',
          typical_errors: [],
        },
      ],
    })
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('STEPS')
  })

  it('shows warnings section when warnings exist', () => {
    const result = makeResult({}, { warnings: ['Test-Warnung'] })
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).toContain('Test-Warnung')
  })

  it('returns a string enclosed in separator lines', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text.startsWith('═')).toBe(true)
    expect(text.endsWith('═══════════════════════════════════════════')).toBe(true)
  })

  it('omits missing-input-types line when none are missing', () => {
    const result = makeResult()
    const report = buildCoverageReport(result, expectedClusters)
    const text = formatCoverageReport(report)
    expect(text).not.toContain('Fehlende Inputtypen')
  })
})
