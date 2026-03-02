/**
 * Epley Formula: Estimated 1-Rep Max
 * weight × (1 + reps / 30)
 */
export function calculateOneRM(weight: number, reps: number): number {
    if (reps === 1) return weight
    return Math.round(weight * (1 + reps / 30))
}

/**
 * Check if a new 1RM is a personal record
 */
export function isPersonalRecord(newOneRM: number, existingMaxOneRM: number | null): boolean {
    if (existingMaxOneRM === null) return true
    return newOneRM > existingMaxOneRM
}
