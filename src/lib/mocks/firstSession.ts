/**
 * Mock-Daten für /mock/first-session — Schüler erste Session End-to-End.
 * Konvention wie screeningMock.ts: statische Exports, keine API-Aufrufe.
 * Strings hier sind Mock-Inhalte (Aufgabentexte, Cluster-Namen) — also
 * Daten, nicht UI-Strings. UI-Labels laufen über i18n (siehe student.json).
 */

import type { MasteryStage } from '@/lib/mastery'

export type MockMood = 'happy' | 'neutral' | 'low'

export interface MockTeacherTopic {
  id: string
  name: string
}

export interface MockTask {
  id: string
  clusterId: string
  clusterName: string
  question: string
  options: string[]
  correctIndex: number
  xp: number
  difficulty: 'I' | 'II' | 'III'
  durationMin: number
  /** Lehrer-Themen, denen diese Aufgabe zugeordnet ist (für Plan-Filterung). */
  topicIds: string[]
}

export interface MockClusterProgress {
  clusterId: string
  clusterName: string
  before: MasteryStage
  after: MasteryStage
  beforeScore: number
  afterScore: number
}

export interface MockHomeQuestTask {
  id: string
  title: string
  clusterName: string
  difficulty: 'I' | 'II' | 'III'
  durationMin: number
}

export const MOCK_STUDENT_FIRST_SESSION = {
  displayName: 'Lina',
  classLevel: 8,
  /** Fach kommt aus dem Schüler-Profil — wird nicht im Check-In abgefragt. */
  subject: 'Mathe',
  /** Pre-Session aus dem Screening abgeleitet (Mock). */
  startXp: 0,
  startLevel: 1,
}

export const MOCK_TEACHER_TOPICS: MockTeacherTopic[] = [
  { id: 'topic-bruch', name: 'Bruchrechnung' },
  { id: 'topic-prozent', name: 'Prozentrechnung' },
  { id: 'topic-linear', name: 'Lineare Funktionen' },
  { id: 'topic-geometrie', name: 'Geometrie & Winkel' },
  { id: 'topic-gleichung', name: 'Gleichungen lösen' },
]

export const MOCK_TODAY_TASKS: MockTask[] = [
  {
    id: 'mock-task-1',
    clusterId: 'mock-cluster-zahl',
    clusterName: 'Zahl & Rechnen',
    question: 'Was ist 3/4 + 1/8?',
    options: ['4/12', '5/8', '7/8', '4/8'],
    correctIndex: 2,
    xp: 20,
    difficulty: 'II',
    durationMin: 5,
    topicIds: ['topic-bruch'],
  },
  {
    id: 'mock-task-2',
    clusterId: 'mock-cluster-funktion',
    clusterName: 'Funktionaler Zusammenhang',
    question:
      'Eine lineare Funktion hat die Steigung 2 und schneidet die y-Achse bei 3. Welcher Punkt liegt auf der Geraden?',
    options: ['(1; 5)', '(2; 3)', '(0; 2)', '(3; 0)'],
    correctIndex: 0,
    xp: 30,
    difficulty: 'II',
    durationMin: 6,
    topicIds: ['topic-linear', 'topic-gleichung'],
  },
  {
    id: 'mock-task-3',
    clusterId: 'mock-cluster-zahl',
    clusterName: 'Zahl & Rechnen',
    question: 'Wie viel sind 15 % von 80?',
    options: ['8', '12', '15', '20'],
    correctIndex: 1,
    xp: 20,
    difficulty: 'I',
    durationMin: 4,
    topicIds: ['topic-prozent'],
  },
  {
    id: 'mock-task-4',
    clusterId: 'mock-cluster-raum',
    clusterName: 'Raum & Form',
    question:
      'In einem Dreieck sind zwei Winkel 45° und 65°. Wie groß ist der dritte Winkel?',
    options: ['60°', '70°', '80°', '90°'],
    correctIndex: 1,
    xp: 20,
    difficulty: 'I',
    durationMin: 4,
    topicIds: ['topic-geometrie'],
  },
  {
    id: 'mock-task-5',
    clusterId: 'mock-cluster-funktion',
    clusterName: 'Funktionaler Zusammenhang',
    question: 'Löse die Gleichung 3x + 7 = 22.',
    options: ['x = 3', 'x = 5', 'x = 7', 'x = 15'],
    correctIndex: 1,
    xp: 25,
    difficulty: 'II',
    durationMin: 5,
    topicIds: ['topic-gleichung'],
  },
]

/**
 * Filtert die Tagesaufgaben nach gewählten Lehrer-Themen.
 * Leere Auswahl → alle Aufgaben. Max 3 Aufgaben pro Session.
 */
export function selectTasksForSession(topicIds: string[]): MockTask[] {
  if (topicIds.length === 0) return MOCK_TODAY_TASKS.slice(0, 3)
  const matched = MOCK_TODAY_TASKS.filter((t) =>
    t.topicIds.some((id) => topicIds.includes(id)),
  )
  // Fallback wenn nichts matcht (z.B. nur Freitext eingegeben): erste 3 Aufgaben.
  const pool = matched.length > 0 ? matched : MOCK_TODAY_TASKS
  return pool.slice(0, 3)
}

export const MOCK_CLUSTER_PROGRESS: MockClusterProgress[] = [
  {
    clusterId: 'mock-cluster-zahl',
    clusterName: 'Zahl & Rechnen',
    before: 'developing',
    after: 'progressing',
    beforeScore: 48,
    afterScore: 64,
  },
  {
    clusterId: 'mock-cluster-funktion',
    clusterName: 'Funktionaler Zusammenhang',
    before: 'introduced',
    after: 'developing',
    beforeScore: 30,
    afterScore: 46,
  },
]

export const MOCK_HOME_QUEST: MockHomeQuestTask[] = [
  {
    id: 'mock-home-1',
    title: 'Bruchrechnung üben',
    clusterName: 'Zahl & Rechnen',
    difficulty: 'I',
    durationMin: 8,
  },
  {
    id: 'mock-home-2',
    title: 'Lineare Funktionen zeichnen',
    clusterName: 'Funktionaler Zusammenhang',
    difficulty: 'II',
    durationMin: 10,
  },
]

/** Geschätzte Session-Dauer in Minuten, abhängig von ausgewählten Aufgaben. */
export function sessionMinutes(tasks: MockTask[]): number {
  return tasks.reduce((sum, t) => sum + t.durationMin, 0)
}
