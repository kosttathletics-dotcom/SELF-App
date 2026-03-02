/**
 * CSV Export utilities for grades and attendance records.
 */

function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function buildCSV(headers: string[], rows: unknown[][]): string {
    const lines = [
        headers.map(escapeCell).join(','),
        ...rows.map(row => row.map(escapeCell).join(',')),
    ]
    return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// ─── Grades Export ────────────────────────────────────────────────

export interface GradeExportRow {
    athleteName: string
    subject: string
    quarter: string
    schoolYear: string
    gradeValue: number
    letterGrade: string
    gpaPoints: number
}

export function exportGradesCSV(rows: GradeExportRow[], filename = 'grades_export.csv') {
    const headers = ['Athlete', 'Subject', 'Quarter', 'School Year', 'Grade (%)', 'Letter', 'GPA Points']
    const data = rows.map(r => [
        r.athleteName,
        r.subject,
        r.quarter,
        r.schoolYear,
        r.gradeValue,
        r.letterGrade,
        r.gpaPoints,
    ])
    downloadCSV(buildCSV(headers, data), filename)
}

// ─── Attendance Export ─────────────────────────────────────────────

export interface AttendanceExportRow {
    athleteName: string
    eventTitle: string
    eventType: string
    date: string
    status: string
    required: boolean
}

export function exportAttendanceCSV(rows: AttendanceExportRow[], filename = 'attendance_export.csv') {
    const headers = ['Athlete', 'Event', 'Type', 'Date', 'Status', 'Required']
    const data = rows.map(r => [
        r.athleteName,
        r.eventTitle,
        r.eventType,
        r.date,
        r.status,
        r.required ? 'Yes' : 'No',
    ])
    downloadCSV(buildCSV(headers, data), filename)
}

// ─── Team GPA Summary Export ───────────────────────────────────────

export interface TeamGPAExportRow {
    athleteName: string
    sport: string | null
    grade: string | null
    gpa: number | null
    gradeCount: number
}

export function exportTeamGPACSV(rows: TeamGPAExportRow[], filename = 'team_gpa_export.csv') {
    const headers = ['Athlete', 'Sport', 'Grade', 'GPA', 'Grades Logged', 'Status']
    const data = rows.map(r => [
        r.athleteName,
        r.sport ?? '',
        r.grade ?? '',
        r.gpa !== null ? r.gpa.toFixed(2) : 'No data',
        r.gradeCount,
        r.gpa === null ? 'No data' : r.gpa < 2.5 ? 'Red Flag' : 'On Track',
    ])
    downloadCSV(buildCSV(headers, data), filename)
}
