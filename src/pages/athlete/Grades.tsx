import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts'

interface GradeEntry {
    id: string
    subject: string
    quarter: string
    school_year: string
    grade_value: number
    letter_grade: string
    gpa_points: number
    created_at: string
}

interface ChartPoint {
    quarter: string
    gpa: number
}

export default function AthleteGrades() {
    const { user } = useAuth()
    const [grades, setGrades] = useState<GradeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterQuarter, setFilterQuarter] = useState<string>('All')
    const [filterYear, setFilterYear] = useState<string>('All')

    const load = useCallback(async () => {
        if (!user) return
        const { data: athlete } = await supabase
            .from('athletes')
            .select('id')
            .eq('user_id', user.id)
            .single()
        if (!athlete) return setLoading(false)

        const { data } = await supabase
            .from('grades')
            .select('*')
            .eq('athlete_id', (athlete as unknown as { id: string }).id)
            .order('created_at', { ascending: true })

        setGrades((data ?? []) as unknown as GradeEntry[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const quarters = ['All', ...Array.from(new Set(grades.map(g => g.quarter)))]
    const years = ['All', ...Array.from(new Set(grades.map(g => g.school_year)))]

    const filtered = grades.filter(g => {
        const matchQ = filterQuarter === 'All' || g.quarter === filterQuarter
        const matchY = filterYear === 'All' || g.school_year === filterYear
        return matchQ && matchY
    })

    const gpa = filtered.length > 0 ? calculateGPA(filtered.map(g => ({ gpa_points: g.gpa_points }))) : null

    // Build chart data — avg GPA per quarter
    const chartData: ChartPoint[] = []
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4', 'Semester 1', 'Semester 2', 'Final']
    const quarterMap = new Map<string, number[]>()
    for (const g of grades) {
        if (!quarterMap.has(g.quarter)) quarterMap.set(g.quarter, [])
        quarterMap.get(g.quarter)!.push(g.gpa_points)
    }
    for (const q of quarterOrder) {
        const pts = quarterMap.get(q)
        if (pts && pts.length > 0) {
            chartData.push({ quarter: q, gpa: parseFloat((pts.reduce((a, b) => a + b, 0) / pts.length).toFixed(2)) })
        }
    }

    const gpaColor = (g: number | null) => g === null ? 'text-white/30' : g < 2.5 ? 'text-[#FF4444]' : g < 3.0 ? 'text-[#F4A261]' : 'text-[#C8F000]'

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 shadow-xl">
                <p className="text-white/50 text-xs mb-1">{label}</p>
                <p className="text-[#C8F000] font-heading font-bold">{payload[0].value.toFixed(2)} GPA</p>
            </div>
        )
    }

    return (
        <AppShell title="My Grades">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">My Grades</h1>
                <p className="text-white/40 text-sm mt-0.5">{grades.length} grade records logged</p>
            </div>

            {/* GPA Summary */}
            <div className={cn(
                'rounded-2xl p-5 mb-6 border',
                gpa !== null && gpa < 2.5 ? 'bg-[#FF4444]/10 border-[#FF4444]/20' : 'bg-[#1A1A1A] border-[#2A2A2A]'
            )}>
                <p className="text-white/50 text-sm mb-1">Overall GPA</p>
                <p className={cn('text-5xl font-heading font-bold', gpaColor(gpa))}>
                    {gpa !== null ? gpa.toFixed(2) : '—'}
                </p>
                {gpa !== null && (
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant={gpa >= 3.0 ? 'success' : gpa >= 2.5 ? 'warning' : 'error'}>
                            {gpa >= 3.0 ? '✓ NCAA Compliant' : gpa >= 2.5 ? '⚠ Borderline' : '🚨 Below Threshold'}
                        </Badge>
                        {gpa < 2.5 && (
                            <span className="text-[#FF4444] text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Must be 2.5+ for eligibility
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* GPA Trend Chart */}
            {chartData.length >= 2 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-[#C8F000]" />
                        <h2 className="font-heading font-semibold text-white text-sm">GPA Trend</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                            <XAxis dataKey="quarter" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 4]} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} ticks={[0, 1, 2, 3, 4]} />
                            <ReferenceLine y={2.5} stroke="#FF4444" strokeDasharray="4 4" strokeOpacity={0.6} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone" dataKey="gpa" stroke="#C8F000" strokeWidth={2.5}
                                dot={{ fill: '#C8F000', r: 4, strokeWidth: 2, stroke: '#0D0D0D' }}
                                activeDot={{ r: 6, fill: '#C8F000' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <p className="text-white/30 text-[10px] mt-2 text-center">Red dashed line = 2.5 eligibility threshold</p>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
                {quarters.map(q => (
                    <button key={q} onClick={() => setFilterQuarter(q)}
                        className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            filterQuarter === q ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {q}
                    </button>
                ))}
                {years.filter(y => y !== 'All').map(y => (
                    <button key={y} onClick={() => setFilterYear(filterYear === y ? 'All' : y)}
                        className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            filterYear === y ? 'bg-[#C8F000]/15 text-[#C8F000] border border-[#C8F000]/30' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {y}
                    </button>
                ))}
            </div>

            {/* Grade Table */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-10">No grades logged yet. Your coach will enter them here.</p>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 px-4 py-2.5 border-b border-[#2A2A2A] text-white/30 text-xs">
                        <span>Subject</span><span>Quarter</span><span>Grade</span><span className="text-right">GPA Pts</span>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {filtered.map(g => (
                            <div key={g.id} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                                <span className="text-white">{g.subject}</span>
                                <span className="text-white/50 text-xs">{g.quarter} · {g.school_year}</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn('font-heading font-bold text-base',
                                        g.gpa_points < 2.0 ? 'text-[#FF4444]' : g.gpa_points < 3.0 ? 'text-[#F4A261]' : 'text-[#C8F000]')}>
                                        {g.letter_grade}
                                    </span>
                                    <span className="text-white/30 text-xs">{g.grade_value}</span>
                                </div>
                                <span className={cn('text-right font-heading font-bold',
                                    g.gpa_points < 2.0 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                                    {g.gpa_points.toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GPA breakdown by subject */}
            {filtered.length > 0 && (
                <div className="mt-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                    <h3 className="font-heading font-semibold text-white text-sm mb-3">Subject Breakdown</h3>
                    <div className="space-y-2">
                        {Array.from(new Set(filtered.map(g => g.subject))).map(subj => {
                            const subjectGrades = filtered.filter(g => g.subject === subj)
                            const subjectGpa = calculateGPA(subjectGrades.map(g => ({ gpa_points: g.gpa_points })))
                            const latest = subjectGrades[subjectGrades.length - 1]
                            return (
                                <div key={subj} className="flex items-center justify-between">
                                    <span className="text-white/70 text-sm">{subj}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/30 text-xs">{latest.letter_grade}</span>
                                        <span className={cn('font-heading font-bold text-sm', gpaColor(subjectGpa))}>
                                            {subjectGpa.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
