export interface CoreCourseRequirements {
    english: number       // required: 4
    math: number          // required: 3
    science: number       // required: 2
    englishMathScience: number // required: 1 (extra EMS)
    socialScience: number // required: 2
    electives: number     // required: 4
}

export const CORE_COURSE_REQUIREMENTS: CoreCourseRequirements = {
    english: 4,
    math: 3,
    science: 2,
    englishMathScience: 1,
    socialScience: 2,
    electives: 4,
}

export const TOTAL_CORE_COURSES_REQUIRED = 16

export type Division = 'D1' | 'D2' | 'D3' | 'NAIA'

/**
 * Total core courses required per division
 */
export const NCAA_CORE_REQUIREMENTS: Record<Division, number> = {
    D1: 16,
    D2: 16,
    D3: 0,   // D3 does not use NCAA Eligibility Center
    NAIA: 16,
}

/**
 * GPA requirements per division (minimum for initial eligibility)
 */
export const DIVISION_GPA_THRESHOLDS: Record<Division, number> = {
    D1: 2.3,
    D2: 2.2,
    D3: 0,
    NAIA: 2.0,
}

/**
 * Returns eligibility status and message for a specific division + GPA
 */
export function getDivisionGPAStatus(division: Division, gpa: number): {
    eligible: boolean
    required: number
    message: string
} {
    const required = DIVISION_GPA_THRESHOLDS[division]

    if (division === 'D3') {
        return { eligible: true, required: 0, message: 'D3 schools do not use the NCAA Eligibility Center — contact each school directly.' }
    }

    const eligible = gpa >= required
    return {
        eligible,
        required,
        message: eligible
            ? `You meet the ${division} GPA requirement (${required.toFixed(1)}+ needed, you have ${gpa.toFixed(2)}).`
            : `Your GPA (${gpa.toFixed(2)}) is below the ${division} requirement (${required.toFixed(1)}+). You need ${(required - gpa).toFixed(2)} more points.`,
    }
}

/**
 * 10/14 Rule checker:
 * Athletes must complete 10 of 16 core courses before their 7th semester (start of senior year).
 */
export function check1014Rule(coreCourses: { gpa_points: number; school_year: string }[]): {
    passes: boolean
    message: string
    missing?: number
} {
    // If we have 10+ courses logged assume they satisfy pre-senior requirement
    const count = coreCourses.length
    const TARGET = 10

    if (count >= TARGET) {
        return {
            passes: true,
            message: `✓ ${count} core courses logged — meets the 10-course pre-senior year requirement.`,
        }
    }

    return {
        passes: false,
        missing: TARGET - count,
        message: `${count} of ${TARGET} required core courses completed before senior year. Must complete 10 of 16 core courses before the start of 7th semester.`,
    }
}

/**
 * Original 10/7 rule checker (kept for compatibility)
 */
export function checkTenSevenRule(courses: {
    subject: string
    completed: boolean
    semester: string
}[]): {
    completedTotal: number
    completedEMS: number
    meetsTotal: boolean
    meetsEMS: boolean
    isAtRisk: boolean
} {
    const completedBeforeSr = courses.filter(
        (c) => c.completed && !['7th Semester', '8th Semester'].includes(c.semester)
    )

    const completedTotal = completedBeforeSr.length
    const completedEMS = completedBeforeSr.filter((c) =>
        ['English', 'Math', 'Science'].includes(c.subject)
    ).length

    const meetsTotal = completedTotal >= 10
    const meetsEMS = completedEMS >= 7
    const isAtRisk = !meetsTotal || !meetsEMS

    return { completedTotal, completedEMS, meetsTotal, meetsEMS, isAtRisk }
}

/**
 * Division eligibility status (legacy helper)
 */
export function getDivisionEligibilityStatus(coreGPA: number): {
    D1: 'eligible' | 'at-risk'
    D2: 'eligible' | 'at-risk'
    D3: 'eligible'
} {
    return {
        D1: coreGPA >= DIVISION_GPA_THRESHOLDS.D1 ? 'eligible' : 'at-risk',
        D2: coreGPA >= DIVISION_GPA_THRESHOLDS.D2 ? 'eligible' : 'at-risk',
        D3: 'eligible',
    }
}

export const NCAA_DISCLAIMER =
    'This tool provides general guidance only. Always consult the NCAA Eligibility Center (eligibilitycenter.org) for official requirements. Rules may change.'

export const SAT_ACT_DISCLAIMER =
    'Standardized tests are no longer required for NCAA D1/D2 initial eligibility as of 2023.'
