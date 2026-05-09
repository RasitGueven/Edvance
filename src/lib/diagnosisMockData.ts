import type { DiagnosisTask } from '@/types/diagnosis'

export const mockDiagnosisTasks: DiagnosisTask[] = [
  {
    id: 't1',
    skill_id: 'M8.RZ.03',
    skill_cluster: 'Rationale Zahlen',
    question: 'Berechne: −3 + (−4) · 2 − (−1)',
    solution:
      'Punkt vor Strich: (−4) · 2 = −8.\nDann: −3 + (−8) − (−1) = −3 − 8 + 1 = −10.\nLösung: −10',
    common_errors:
      '• Ignoriert Punkt-vor-Strich, rechnet von links: (−3 + (−4)) · 2 = −14\n• Vorzeichenfehler bei (−(−1)) → schreibt −1 statt +1\n• Multipliziert nur Beträge ohne Vorzeichen → +8 statt −8',
    coach_hint:
      'Achte darauf, ob das Kind Punkt-vor-Strich respektiert UND ob es das doppelte Minus −(−1) sicher als +1 auflöst. Beide Fehlertypen separat notieren.',
    estimated_minutes: 2,
  },
  {
    id: 't2',
    skill_id: 'M8.TG.03',
    skill_cluster: 'Terme & Gleichungen',
    question: 'Löse die Gleichung: 3x − 7 = 2(x + 4)',
    solution:
      '3x − 7 = 2x + 8\n3x − 2x = 8 + 7\nx = 15',
    common_errors:
      '• Verteilt 2(x + 4) falsch → 2x + 4 (vergisst die 4 zu multiplizieren)\n• Bringt Vorzeichen beim Umstellen falsch mit (−7 wird nicht +7)\n• Probe wird nicht gemacht',
    coach_hint:
      'Schlüsselstelle ist die Distributivregel beim Klammerauflösen. Wenn das Kind richtig auflöst, ist der Rest meist sicher. Lass nach „x =" eine Probe machen wenn Zeit ist.',
    estimated_minutes: 3,
  },
  {
    id: 't3',
    skill_id: 'M8.PR.03',
    skill_cluster: 'Proportionalität',
    question: 'Für 4 Liter Farbe zahlt man 14 €. Was kosten 10 Liter?',
    solution:
      'Dreisatz: 1 L = 14 € ÷ 4 = 3,50 €.\n10 L = 3,50 € · 10 = 35 €',
    common_errors:
      '• Rechnet 14 € · 10 ÷ 4 = 35 € (korrekt, aber ohne Verständnis warum)\n• Verwechselt proportional/antiproportional → 14 · 4 ÷ 10\n• Vergisst die Einheit (35 statt 35 €)',
    coach_hint:
      'Frag im Zweifel nach dem Rechenweg — viele Kinder schreiben nur 35, ohne den Dreisatz aufzuschreiben. Das verrät, ob Verständnis oder Auswendiglernen vorliegt.',
    estimated_minutes: 2,
  },
  {
    id: 't4',
    skill_id: 'M8.PZ.02',
    skill_cluster: 'Prozentrechnung',
    question: 'Ein Sofa kostet 480 €. Im Sale gibt es 15 % Rabatt. Was kostet das Sofa jetzt?',
    solution:
      'Variante 1: Rabatt = 480 · 0,15 = 72 €. Endpreis = 480 − 72 = 408 €.\nVariante 2: 85 % von 480 = 480 · 0,85 = 408 €.\nLösung: 408 €',
    common_errors:
      '• Berechnet nur den Rabatt (72 €) statt den Endpreis\n• Rechnet 480 · 0,15 = 7,20 (Komma falsch)\n• Subtrahiert 15 statt 15 % (480 − 15 = 465)',
    coach_hint:
      'Wichtigster Check: Hat das Kind den Endpreis berechnet, nicht nur den Rabatt? Variante 2 (· 0,85) zeigt höheres Verständnis als Variante 1.',
    estimated_minutes: 3,
  },
  {
    id: 't5',
    skill_id: 'M8.LF.02',
    skill_cluster: 'Lineare Funktionen',
    question: 'Wo schneidet die Funktion f(x) = 2x − 4 die x-Achse?',
    solution:
      'Nullstelle: f(x) = 0 setzen.\n2x − 4 = 0\n2x = 4\nx = 2.\nSchnittpunkt mit x-Achse: (2 | 0)',
    common_errors:
      '• Setzt x = 0 statt f(x) = 0 → bekommt y-Achsenabschnitt (0 | −4)\n• Antwort nur „2" ohne Punktnotation (2 | 0)\n• Verwechselt x- und y-Achse',
    coach_hint:
      'Konzeptioneller Knackpunkt: x-Achse heißt y = 0, also f(x) = 0. Wenn Kind y-Achsenabschnitt liefert, ist das ein klarer Hinweis auf fehlendes Funktionsverständnis.',
    estimated_minutes: 3,
  },
]
