import type { CoachOption, OnboardingFormData, SchoolType, TierOption } from '@/types'

export const SUBJECTS = ['Mathematik', 'Deutsch', 'Englisch'] as const

export const SCHOOL_TYPES: SchoolType[] = ['Gymnasium', 'Gesamtschule', 'Realschule', 'Hauptschule']

const FIRST_CLASS_LEVEL = 5
const LAST_CLASS_LEVEL = 13
export const CLASS_LEVELS = Array.from(
  { length: LAST_CLASS_LEVEL - FIRST_CLASS_LEVEL + 1 },
  (_, index) => String(index + FIRST_CLASS_LEVEL),
)

export const MAX_SUBJECTS_PER_STUDENT = 2

export const STEP_LABELS = ['Stammdaten', 'Fächer', 'Tarif', 'Coach', 'Abschluss'] as const

export const TIERS: TierOption[] = [
  {
    id: 'Basic',
    label: 'Basic',
    price: '89 €/Monat',
    features: ['2 Sessions/Woche', 'Basis-Lernpfad', 'Monatlicher Eltern-Report'],
  },
  {
    id: 'Standard',
    label: 'Standard',
    price: '129 €/Monat',
    features: ['3 Sessions/Woche', 'KI-Lernpfad', '2× Eltern-Report/Monat', 'Coach-Chat'],
  },
  {
    id: 'Premium',
    label: 'Premium',
    price: '169 €/Monat',
    features: [
      'Unbegrenzte Sessions',
      'Voller KI-Lernpfad',
      'Wöchentlicher Report',
      'Prioritäts-Coach',
      'Fachwechsel flexibel',
    ],
  },
]

export const MOCK_COACHES: CoachOption[] = [
  { id: 'c2', name: 'Frau Demir' },
  { id: 'c3', name: 'Herr Kaya' },
]

export const EMPTY_FORM: OnboardingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  classLevel: '',
  schoolName: '',
  schoolType: '',
  subjects: [],
  tier: '',
  coachId: '',
}
