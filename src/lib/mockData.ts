// Mock-Daten für die Pre-Launch-Phase. Klar gekennzeichnet als MOCK_*.
// Wird durch Supabase-Echtdaten ersetzt sobald die Schüler-CRUD-Flows live sind.

import type { MockSession } from '@/types'

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: 's1',
    time: '13:00',
    status: 'done',
    room: 'Raum A1',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u1', name: 'Lena Fischer', classLevel: 7, subjects: ['Mathematik', 'Deutsch'], attendance: 'present' },
      { id: 'u2', name: 'Kemal Yildiz', classLevel: 8, subjects: ['Englisch'], attendance: 'present' },
      { id: 'u3', name: 'Sophie Braun', classLevel: 7, subjects: ['Mathematik'], attendance: 'absent' },
      { id: 'u4', name: 'Jonas Müller', classLevel: 9, subjects: ['Deutsch', 'Englisch'], attendance: 'present' },
    ],
  },
  {
    id: 's2',
    time: '15:00',
    status: 'active',
    room: 'Raum B2',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u5', name: 'Mia Schmidt', classLevel: 6, subjects: ['Mathematik'], attendance: 'present' },
      { id: 'u6', name: 'Noah Wagner', classLevel: 10, subjects: ['Englisch', 'Mathematik'], attendance: 'present' },
      { id: 'u7', name: 'Emre Demir', classLevel: 8, subjects: ['Deutsch'], attendance: 'present' },
      { id: 'u8', name: 'Hanna Richter', classLevel: 11, subjects: ['Mathematik'], attendance: 'unknown' },
      { id: 'u9', name: 'Tim Becker', classLevel: 9, subjects: ['Englisch'], attendance: 'present' },
    ],
  },
  {
    id: 's3',
    time: '17:00',
    status: 'upcoming',
    room: 'Raum C3',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u10', name: 'Laura Hofmann', classLevel: 5, subjects: ['Deutsch', 'Mathematik'], attendance: 'unknown' },
      { id: 'u11', name: 'Ben Schulze', classLevel: 12, subjects: ['Mathematik'], attendance: 'unknown' },
      { id: 'u12', name: 'Zeynep Arslan', classLevel: 6, subjects: ['Englisch'], attendance: 'unknown' },
    ],
  },
]
