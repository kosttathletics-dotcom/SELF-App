import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'

interface GradeInfo {
    id: string
    subject: string
    quarter: string
    school_year: string
    grade_value: number
    letter_grade: string
    gpa_points: number
}

export default function ParentGrades() {
    const { user } = useAuth()
    const [grades, setGrades] = useState<GradeInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All')

    const load = useCallback(async () => {
        if (!user) return
        const { data: linkData } = await supabase.from('parent_athlete_links').select('athlete_id').eq('parent_id', user.id).single()
        const link = linkData as unknown as { athlete_id: string } | null
        if (!link) return setLoading(false)
        const { data } = await supabase.from('grades').select('*').eq('athlete_id', link.athlete_id).order('created_at', { ascending: false })
        setGrades((data ?? []) as unknown as GradeInfo[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const quarters = ['All', ...Array.from(new Set(grades.map(g => g.quarter)))]
    const filtered = filter === 'All' ? grades : grades.filter(g => g.quarter === filter)
    const gpa = filtered.length > 0 ? calculateGPA(filtered.map(g => ({ gpa_points: g.gpa_points }))) : null

    return (
        <AppShell title="Child's Grades">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Grades</h1>
                <p className="text-white/40 text-sm mt-0.5">Read-only view of your child's academic record</p>
            </div>

            {/* GPA hero */}
            <div className={cn('rounded-2xl p-5 mb-5 border', gpa !== null && gpa < 2.5 ? 'bg-[#FF4444]/10 border-[#FF4444]/20' : 'bg-[#1A1A1A] border-[#2A2A2A]')}>
                <p className="text-white/50 text-sm">Current GPA</p>
                <p className={cn('text-4xl font-heading font-bold mt-1', gpa !== null && gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                    {gpa !== null ? gpa.toFixed(2) : '—'}
                </p>
                {gpa !== null && gpa < 2.5 && (
                    <div className="flex items-center gap-1.5 mt-2 text-[#FF4444] text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Below 2.5 NCAA eligibility threshold — contact coach immediately
                    </div>
                )}
            </div>

            {/* Quarter filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
                {quarters.map(q => (
                    <button key={q} onClick={() => setFilter(q)}
                        className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            filter === q ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {q}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-10">No grades recorded yet</p>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 px-4 py-2.5 border-b border-[#2A2A2A] text-white/30 text-xs">
                        <span>Subject</span><span>Quarter</span><span>Grade</span><span className="text-right">Points</span>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {filtered.map(g => (
                            <div key={g.id} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                                <span className="text-white">{g.subject}</span>
                                <span className="text-white/50 text-xs">{g.quarter} · {g.school_year}</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn('font-heading font-bold text-base',
                                        g.gpa_points < 2.0 ? 'text-[#FF4444]' : g.gpa_points >= 3.0 ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                                        {g.letter_grade}
                                    </span>
                                    <span className="text-white/30 text-xs">{g.grade_value}</span>
                                </div>
                                <div className="text-right">
                                    <Badge variant={g.gpa_points >= 3.0 ? 'success' : g.gpa_points >= 2.0 ? 'warning' : 'error'}>
                                        {g.gpa_points.toFixed(1)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
