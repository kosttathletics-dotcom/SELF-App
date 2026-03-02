import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, AlertTriangle, Plus, Download, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/shared/Avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { exportTeamGPACSV } from '@/lib/csvExport'

interface AthleteGPARow {
    id: string
    name: string
    photo_url: string | null
    sport: string | null
    grade: string | null
    gpa: number | null
    gradeCount: number
    trend: 'up' | 'down' | 'stable' | null
}

interface BulkGradeEntry {
    subject: string
    quarter: string
    school_year: string
    grade_value: string
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Semester 1', 'Semester 2', 'Final']
const SUBJECTS = ['English', 'Math', 'Science', 'History', 'PE', 'Spanish', 'French', 'Art', 'Music', 'Health', 'Elective']

export default function GradesPage() {
    const { user } = useAuth()
    const [athletes, setAthletes] = useState<AthleteGPARow[]>([])
    const [loading, setLoading] = useState(true)
    const [filterFlag, setFilterFlag] = useState<'all' | 'red' | 'ok'>('all')
    const [showBulk, setShowBulk] = useState<string | null>(null) // athleteId
    const [bulkForm, setBulkForm] = useState<BulkGradeEntry>({
        subject: '', quarter: 'Q1', school_year: '2025-2026', grade_value: ''
    })
    const [bulkSaving, setBulkSaving] = useState(false)
    const [sort, setSort] = useState<'name' | 'gpa'>('gpa')

    const load = useCallback(async () => {
        if (!user) return
        setLoading(true)

        const { data: athData } = await supabase
            .from('athletes')
            .select('id, name, photo_url, sport, grade')
            .eq('coach_id', user.id)
            .eq('status', 'active' as never)
            .order('name')

        const athleteList = (athData ?? []) as { id: string; name: string; photo_url: string | null; sport: string | null; grade: string | null }[]

        if (athleteList.length === 0) { setAthletes([]); setLoading(false); return }

        const ids = athleteList.map(a => a.id)
        const { data: gradesData } = await supabase
            .from('grades')
            .select('athlete_id, gpa_points, quarter, created_at')
            .in('athlete_id', ids)
            .order('created_at', { ascending: true })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grades = (gradesData ?? []) as any[]

        const rows: AthleteGPARow[] = athleteList.map(a => {
            const ag = grades.filter((g) => g.athlete_id === a.id)
            const gpa = ag.length > 0 ? calculateGPA(ag.map(g => ({ gpa_points: g.gpa_points as number }))) : null

            // Trend: compare last 2 quarters
            const q1 = ag.slice(0, Math.floor(ag.length / 2))
            const q2 = ag.slice(Math.floor(ag.length / 2))
            let trend: AthleteGPARow['trend'] = null
            if (q1.length > 0 && q2.length > 0) {
                const avg1 = q1.reduce((s: number, g) => s + (g.gpa_points as number), 0) / q1.length
                const avg2 = q2.reduce((s: number, g) => s + (g.gpa_points as number), 0) / q2.length
                trend = avg2 > avg1 + 0.1 ? 'up' : avg2 < avg1 - 0.1 ? 'down' : 'stable'
            }

            return { ...a, gpa, gradeCount: ag.length, trend }
        })

        setAthletes(rows)
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const filtered = athletes
        .filter(a => {
            if (filterFlag === 'red') return a.gpa !== null && a.gpa < 2.5
            if (filterFlag === 'ok') return a.gpa === null || a.gpa >= 2.5
            return true
        })
        .sort((a, b) => {
            if (sort === 'gpa') return (b.gpa ?? 9) - (a.gpa ?? 9)
            return a.name.localeCompare(b.name)
        })

    const letterFromValue = (v: number) => v >= 90 ? 'A' : v >= 80 ? 'B' : v >= 70 ? 'C' : v >= 60 ? 'D' : 'F'
    const pointsFromValue = (v: number) => v >= 90 ? 4.0 : v >= 80 ? 3.0 : v >= 70 ? 2.0 : v >= 60 ? 1.0 : 0.0

    const saveBulkGrade = async (athleteId: string) => {
        if (!bulkForm.subject || !bulkForm.grade_value || !user) return
        setBulkSaving(true)
        const val = parseFloat(bulkForm.grade_value)
        await supabase.from('grades').insert({
            athlete_id: athleteId,
            coach_id: user.id,
            subject: bulkForm.subject,
            quarter: bulkForm.quarter,
            school_year: bulkForm.school_year,
            grade_value: val,
            letter_grade: letterFromValue(val),
            gpa_points: pointsFromValue(val),
        } as never)
        setBulkSaving(false)
        setShowBulk(null)
        setBulkForm({ subject: '', quarter: 'Q1', school_year: '2025-2026', grade_value: '' })
        void load()
    }

    const redCount = athletes.filter(a => a.gpa !== null && a.gpa < 2.5).length

    const inputCls = 'w-full px-3 py-2 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    return (
        <AppShell title="Grades">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Grades</h1>
                    <p className="text-white/40 text-sm mt-0.5">
                        {athletes.filter(a => a.gpa !== null).length} athletes with records
                        {redCount > 0 && <span className="text-[#FF4444] ml-2">· {redCount} below 2.5 ⚠️</span>}
                    </p>
                </div>
                <button
                    onClick={() => exportTeamGPACSV(athletes.map(a => ({
                        athleteName: a.name,
                        sport: a.sport,
                        grade: a.grade,
                        gpa: a.gpa,
                        gradeCount: a.gradeCount,
                    })))}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white/60 rounded-xl text-xs hover:text-white/80 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export
                </button>
            </div>

            {/* Summary stats */}
            {!loading && athletes.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        {
                            label: 'Team Avg GPA', value: athletes.filter(a => a.gpa !== null).length > 0
                                ? (athletes.filter(a => a.gpa !== null).reduce((s, a) => s + a.gpa!, 0) / athletes.filter(a => a.gpa !== null).length).toFixed(2)
                                : '—', accent: true
                        },
                        { label: 'Below 2.5', value: redCount, color: redCount > 0 ? 'text-[#FF4444]' : 'text-[#C8F000]' },
                        { label: 'No Records', value: athletes.filter(a => a.gpa === null).length, color: 'text-white/60' },
                    ].map(({ label, value, accent, color }) => (
                        <div key={label} className={cn('bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center', accent && 'border-[#C8F000]/20')}>
                            <p className={cn('text-2xl font-heading font-bold', accent ? 'text-[#C8F000]' : color)}>{value}</p>
                            <p className="text-white/40 text-xs mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1">
                    {([['all', 'All'], ['red', '🚨 Red Flag'], ['ok', '✓ On Track']] as const).map(([v, label]) => (
                        <button key={v} onClick={() => setFilterFlag(v)}
                            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                filterFlag === v ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50 hover:text-white')}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1 ml-auto">
                    {([['gpa', 'GPA ↑'], ['name', 'Name']] as const).map(([v, label]) => (
                        <button key={v} onClick={() => setSort(v)}
                            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                sort === v ? 'bg-[#2A2A2A] text-white' : 'text-white/40 hover:text-white/70')}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Athlete Grade List */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">
                        {filterFlag !== 'all' ? 'No athletes match this filter' : 'No athletes yet — add athletes first'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(a => (
                        <div key={a.id}>
                            <div
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                                    a.gpa !== null && a.gpa < 2.5
                                        ? 'bg-[#FF4444]/5 border-[#FF4444]/20'
                                        : 'bg-[#1A1A1A] border-[#2A2A2A]'
                                )}
                            >
                                <Link to={`/athletes/${a.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar name={a.name} photoUrl={a.photo_url} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-heading font-semibold text-white text-sm truncate">{a.name}</p>
                                            {a.gpa !== null && a.gpa < 2.5 && (
                                                <span className="flex items-center gap-1 text-[#FF4444] text-xs">
                                                    <AlertTriangle className="w-3 h-3" /> Red Flag
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white/40 text-xs mt-0.5">
                                            {[a.sport, a.grade].filter(Boolean).join(' · ')}
                                            {a.gradeCount > 0 && <span> · {a.gradeCount} grade{a.gradeCount !== 1 ? 's' : ''} logged</span>}
                                        </p>
                                    </div>
                                </Link>

                                {/* GPA + trend */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {a.trend && a.trend !== 'stable' && (
                                        <TrendingUp className={cn('w-4 h-4', a.trend === 'up' ? 'text-[#C8F000]' : 'text-[#FF4444] rotate-180')} />
                                    )}
                                    <div className="text-right">
                                        <p className={cn('text-xl font-heading font-bold',
                                            a.gpa === null ? 'text-white/20' :
                                                a.gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                                            {a.gpa !== null ? a.gpa.toFixed(2) : '—'}
                                        </p>
                                        <p className="text-white/30 text-[10px]">GPA</p>
                                    </div>

                                    <button
                                        onClick={() => setShowBulk(showBulk === a.id ? null : a.id)}
                                        className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center hover:bg-[#C8F000]/20 hover:text-[#C8F000] text-white/50 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Inline grade add form */}
                            {showBulk === a.id && (
                                <div className="mx-2 mb-2 bg-[#1A1A1A] border border-[#C8F000]/20 rounded-b-xl px-4 py-4 space-y-3 -mt-2 pt-5">
                                    <h4 className="text-white/70 text-xs font-medium">Add grade for <span className="text-white">{a.name}</span></h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <select className={inputCls} value={bulkForm.subject}
                                            onChange={e => setBulkForm(f => ({ ...f, subject: e.target.value }))}>
                                            <option value="">Subject</option>
                                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                                            <option value="Other">Other</option>
                                        </select>
                                        {bulkForm.subject === 'Other' && (
                                            <input className={inputCls} placeholder="Enter subject" onChange={e => setBulkForm(f => ({ ...f, subject: e.target.value }))} />
                                        )}
                                        <select className={inputCls} value={bulkForm.quarter}
                                            onChange={e => setBulkForm(f => ({ ...f, quarter: e.target.value }))}>
                                            {QUARTERS.map(q => <option key={q}>{q}</option>)}
                                        </select>
                                        <input className={inputCls} placeholder="Year (2025-2026)" value={bulkForm.school_year}
                                            onChange={e => setBulkForm(f => ({ ...f, school_year: e.target.value }))} />
                                        <input className={inputCls} type="number" min="0" max="100" placeholder="Grade (0-100)"
                                            value={bulkForm.grade_value} onChange={e => setBulkForm(f => ({ ...f, grade_value: e.target.value }))} />
                                    </div>
                                    {bulkForm.grade_value && (
                                        <p className="text-white/40 text-xs">
                                            = <span className="text-white font-medium">{letterFromValue(parseFloat(bulkForm.grade_value))}</span>
                                            {' '}({pointsFromValue(parseFloat(bulkForm.grade_value)).toFixed(1)} pts)
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => void saveBulkGrade(a.id)}
                                            disabled={bulkSaving || !bulkForm.subject || !bulkForm.grade_value}
                                            className="flex-1 py-2 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-lg text-sm disabled:opacity-50">
                                            {bulkSaving ? 'Saving...' : 'Save Grade'}
                                        </button>
                                        <button onClick={() => setShowBulk(null)} className="px-4 py-2 bg-[#2A2A2A] text-white/60 rounded-lg text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    )
}
