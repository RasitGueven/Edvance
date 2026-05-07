export type AttendanceStatus = 'present' | 'absent' | 'unknown'
export type SessionStatus = 'upcoming' | 'active' | 'done'

export type MockStudent = {
  id: string
  name: string
  class_level: number
  subjects: string[]
  attendance: AttendanceStatus
}

export type MockSession = {
  id: string
  time: string
  status: SessionStatus
  room: string
  coach: string
  students: MockStudent[]
}

export const mockSessions: MockSession[] = [
  {
    id: 's1',
    time: '13:00',
    status: 'done',
    room: 'Raum A1',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u1', name: 'Lena Fischer', class_level: 7, subjects: ['Mathematik', 'Deutsch'], attendance: 'present' },
      { id: 'u2', name: 'Kemal Yildiz', class_level: 8, subjects: ['Englisch'], attendance: 'present' },
      { id: 'u3', name: 'Sophie Braun', class_level: 7, subjects: ['Mathematik'], attendance: 'absent' },
      { id: 'u4', name: 'Jonas Müller', class_level: 9, subjects: ['Deutsch', 'Englisch'], attendance: 'present' },
    ],
  },
  {
    id: 's2',
    time: '15:00',
    status: 'active',
    room: 'Raum B2',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u5', name: 'Mia Schmidt', class_level: 6, subjects: ['Mathematik'], attendance: 'present' },
      { id: 'u6', name: 'Noah Wagner', class_level: 10, subjects: ['Englisch', 'Mathematik'], attendance: 'present' },
      { id: 'u7', name: 'Emre Demir', class_level: 8, subjects: ['Deutsch'], attendance: 'present' },
      { id: 'u8', name: 'Hanna Richter', class_level: 11, subjects: ['Mathematik'], attendance: 'unknown' },
      { id: 'u9', name: 'Tim Becker', class_level: 9, subjects: ['Englisch'], attendance: 'present' },
    ],
  },
  {
    id: 's3',
    time: '17:00',
    status: 'upcoming',
    room: 'Raum C3',
    coach: 'Yurtsever Welo',
    students: [
      { id: 'u10', name: 'Laura Hofmann', class_level: 5, subjects: ['Deutsch', 'Mathematik'], attendance: 'unknown' },
      { id: 'u11', name: 'Ben Schulze', class_level: 12, subjects: ['Mathematik'], attendance: 'unknown' },
      { id: 'u12', name: 'Zeynep Arslan', class_level: 6, subjects: ['Englisch'], attendance: 'unknown' },
    ],
  },
]
