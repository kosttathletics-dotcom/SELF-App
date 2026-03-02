import { useState, useEffect } from 'react'
import { Trophy, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import {
    NCAA_CORE_REQUIREMENTS,
    check1014Rule,
    getDivisionGPAStatus,
    NCAA_DISCLAIMER,
    type Division
} from '@/lib/ncaa'
import type { Grade } from '@/types/database'

interface EligibilityTabProps {
    athleteId: string
    sport?: string | null
}

interface CoreCourseEntry {
    id: string
    subject: string
    credit_hours: number
    grade_value: number
    letter_grade: string
    gpa_points: number
    is_core: boolean
    school_year: string
}

const DIVISIONS: { id: Division; label: string; color: string }[] = [
    { id: 'D1', label: 'NCAA D1', color: '#C8F000' },
    { id: 'D2', label: 'NCAA D2', color: '#F4A261' },
    { id: 'D3', label: 'NCAA D3', color: '#60a5fa' },
    { id: 'NAIA', label: 'NAIA', color: '#a78bfa' },
]

export function EligibilityTab({ athleteId, sport: _sport }: EligibilityTabProps) {
    const [grades, setGrades] = useState<Grade[]>([])
    const [coreEntries, setCoreEntries] = useState<CoreCourseEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDiv, setSelectedDiv] = useState<Division>('D1')
    const [showDivDetail, setShowDivDetail] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const [gradesRes, coreRes] = await Promise.all([
                supabase.from('grades').select('*').eq('athlete_id', athleteId),
                supabase.from('core_courses').select('*').eq('athlete_id', athleteId).order('school_year'),
            ])
            setGrades((gradesRes.data ?? []) as unknown as Grade[])
            setCoreEntries((coreRes.data ?? []) as unknown as CoreCourseEntry[])
            setLoading(false)
        }
        void fetchData()
    }, [athleteId])

    if (loading) return <div className="h-40 bg-[#1A1A1A] rounded-2xl animate-pulse" />

    const gpa = grades.length > 0 ? calculateGPA(grades.map(g => ({ gpa_points: g.gpa_points }))) : null
    const coreCount = coreEntries.length
    const coreGpa = coreEntries.length > 0
        ? calculateGPA(coreEntries.map(c => ({ gpa_points: c.gpa_points })))
        : null

    // 10/14 rule check
    const ruleCheck = check1014Rule(coreEntries.map(c => ({ gpa_points: c.gpa_points, school_year: c.school_year })))

    // Division GPA requirements
    const divStatus = getDivisionGPAStatus(selectedDiv, gpa ?? 0)
    const coreReq = NCAA_CORE_REQUIREMENTS[selectedDiv]

    return (
        <div className="space-y-5">
            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{NCAA_DISCLAIMER}</p>
            </div>

            {/* Division selector */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {DIVISIONS.map(d => (
                    <button key={d.id} onClick={() => setSelectedDiv(d.id)}
                        className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                            selectedDiv === d.id
                                ? 'border-transparent text-[#0D0D0D]'
                                : 'bg-[#1A1A1A] text-white/50 border-[#2A2A2A] hover:text-white/80')}
                        style={selectedDiv === d.id ? { backgroundColor: d.color } : {}}>
                        {d.label}
                    </button>
                ))}
            </div>

            {/* Division status card */}
            <div className={cn(
                'rounded-2xl p-5 border',
                divStatus.eligible ? 'bg-[#C8F000]/5 border-[#C8F000]/20' : 'bg-[#FF4444]/5 border-[#FF4444]/20'
            )}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            {divStatus.eligible
                                ? <CheckCircle2 className="w-5 h-5 text-[#C8F000]" />
                                : <XCircle className="w-5 h-5 text-[#FF4444]" />}
                            <h3 className="font-heading font-bold text-white">{DIVISIONS.find(d => d.id === selectedDiv)?.label}</h3>
                        </div>
                        <p className={cn('text-sm mt-1', divStatus.eligible ? 'text-[#C8F000]' : 'text-[#FF4444]')}>
                            {divStatus.message}
                        </p>
                    </div>
                    <button onClick={() => setShowDivDetail(v => !v)} className="text-white/30 text-xs hover:text-white/60 transition-colors">
                        {showDivDetail ? 'Less' : 'Details'}
                    </button>
                </div>

                {showDivDetail && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-white/40 text-xs">Required GPA</p>
                            <p className="text-white font-medium">{divStatus.required.toFixed(2)}+</p>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs">Current GPA</p>
                            <p className={cn('font-bold', divStatus.eligible ? 'text-[#C8F000]' : 'text-[#FF4444]')}>
                                {gpa !== null ? gpa.toFixed(2) : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs">Required Core Courses</p>
                            <p className="text-white font-medium">{coreReq} courses</p>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs">Core Courses Logged</p>
                            <p className={cn('font-bold', coreCount >= coreReq ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                                {coreCount} / {coreReq}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-heading font-bold', gpa !== null && gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                        {gpa !== null ? gpa.toFixed(2) : '—'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Cumulative GPA</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-heading font-bold', coreGpa !== null && coreGpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                        {coreGpa !== null ? coreGpa.toFixed(2) : '—'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Core GPA</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-heading font-bold', coreCount >= NCAA_CORE_REQUIREMENTS[selectedDiv] ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                        {coreCount}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Core Courses</p>
                </div>
            </div>

            {/* 10/14 Rule */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    {ruleCheck.passes ? <CheckCircle2 className="w-4 h-4 text-[#C8F000]" /> : <AlertTriangle className="w-4 h-4 text-[#F4A261]" />}
                    <h3 className="font-heading font-semibold text-white text-sm">10/14 Rule</h3>
                    <span className={cn('ml-auto text-xs font-medium', ruleCheck.passes ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                        {ruleCheck.passes ? 'Passes ✓' : 'Not yet'}
                    </span>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{ruleCheck.message}</p>
                {!ruleCheck.passes && typeof ruleCheck.missing === 'number' && (
                    <p className="text-[#F4A261] text-xs mt-2">Still needs {ruleCheck.missing} more core courses before end of junior year.</p>
                )}
            </div>

            {/* Core Courses List */}
            {coreEntries.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
                        <h3 className="font-heading font-semibold text-white text-sm">Core Courses Logged</h3>
                        <span className="text-white/30 text-xs">{coreEntries.length} courses</span>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {coreEntries.map(c => (
                            <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <div>
                                    <span className="text-white">{c.subject}</span>
                                    <span className="text-white/30 text-xs ml-2">{c.school_year}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 text-xs">{c.credit_hours} cr</span>
                                    <span className={cn('font-heading font-bold', c.gpa_points < 2.0 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                                        {c.letter_grade}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {coreEntries.length === 0 && (
                <div className="text-center py-8 bg-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-xl">
                    <Trophy className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">No core courses logged yet</p>
                    <p className="text-white/25 text-xs mt-1">Ask your coach to add core courses to your record</p>
                </div>
            )}
        </div>
    )
}
