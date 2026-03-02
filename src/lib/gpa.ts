export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F'

const LETTER_TO_POINTS: Record<LetterGrade, number> = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0,
}

export function letterToGpaPoints(letter: LetterGrade): number {
    return LETTER_TO_POINTS[letter]
}

export function gradeValueToLetter(value: number): LetterGrade {
    if (value >= 90) return 'A'
    if (value >= 80) return 'B'
    if (value >= 70) return 'C'
    if (value >= 60) return 'D'
    return 'F'
}

export function calculateGPA(grades: { gpa_points: number }[]): number {
    if (grades.length === 0) return 0
    const total = grades.reduce((sum, g) => sum + g.gpa_points, 0)
    return Math.round((total / grades.length) * 100) / 100
}

export const GPA_RED_FLAG = 2.5
export const D1_CORE_GPA_ALERT = 2.3
export const D2_CORE_GPA_ALERT = 2.2

export function getGPAStatus(gpa: number): 'good' | 'warning' | 'danger' {
    if (gpa >= GPA_RED_FLAG) return 'good'
    if (gpa >= D2_CORE_GPA_ALERT) return 'warning'
    return 'danger'
}
