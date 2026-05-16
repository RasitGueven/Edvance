// Baut die echte Screening-/Diagnose-Aufgabenliste: ruft den realen
// Generator (liest tasks mit is_diagnostic=true) und reichert jeden
// Treffer mit dem echten Aufgaben-Content an. Ersetzt mockDiagnosisTasks.

import { generateDiagnosticTest } from '@/lib/diagnostic/generator'
import { getTaskById } from '@/lib/supabase/tasks'
import type { OnboardingData, RunTask } from '@/types'

export type BuildRunArgs = {
  grade: number
  subject: OnboardingData['subject']
}

export async function buildRunTasks(
  args: BuildRunArgs,
): Promise<{ tasks: RunTask[]; warnings: string[] }> {
  const onboarding: OnboardingData = {
    student_id: 'screening-temp',
    grade: args.grade,
    school_type: 'GYMNASIUM',
    subject: args.subject,
    goal: 'GENERAL',
  }
  try {
    const { test, warnings } = await generateDiagnosticTest(onboarding)
    const tasks: RunTask[] = []
    for (const dt of test.tasks) {
      const { data: task } = await getTaskById(dt.task_id)
      tasks.push({
        id: dt.task_id,
        skill_id: dt.topic_id,
        skill_cluster: dt.topic_label,
        question: task?.question ?? '(Aufgabentext fehlt)',
        solution: task?.solution ?? '',
        common_errors: task?.common_errors ?? dt.typical_errors.join('\n'),
        coach_hint: dt.coach_hint,
        estimated_minutes: dt.estimated_minutes,
      })
    }
    return { tasks, warnings }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Diagnosetest konnte nicht erzeugt werden'
    return { tasks: [], warnings: [msg] }
  }
}
