import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import { AlertTriangle, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Avatar } from '@/components/shared/Avatar'
import { Link } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts'

interface AthleteInfo {
    id: string
    name: string
    photo_url: string | null
    sport: string | null
}

interface GradeInfo {
    athlete_id: string
    gpa_points: number
    subject: string
    letter_grade: string
    quarter: string
    school_year: string
    created_at: string
}

export default function ParentDashboard() {
    const { user } = useAuth()
    const [athlete, setAthlete] = useState<AthleteInfo | null>(null)
    const [grades, setGrades] = useState<GradeInfo[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!user) return
        // Get linked athlete through parent_athlete_links
        const { data: linkData } = await supabase
            .from('parent_athlete_links')
            .select('athlete_id')
            .eq('parent_id', user.id)
            .single()

        const link = linkData as unknown as { athlete_id: string } | null
        if (!link) return setLoading(false)

        const [athRes, gradesRes] = await Promise.all([
            supabase.from('athletes').select('id, name, photo_url, sport').eq('id', link.athlete_id).single(),
            supabase.from('grades').select('athlete_id, gpa_points, subject, letter_grade, quarter, school_year, created_at')
                .eq('athlete_id', link.athlete_id).order('created_at', { ascending: false }),
        ])

        setAthlete((athRes.data as unknown as AthleteInfo) ?? null)
        setGrades((gradesRes.data ?? []) as unknown as GradeInfo[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const gpa = grades.length > 0 ? calculateGPA(grades.map(g => ({ gpa_points: g.gpa_points }))) : null
    const recentGrades = grades.slice(0, 5)

    // Chart data
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4', 'Semester 1', 'Semester 2', 'Final']
    const qMap = new Map<string, number[]>()
    for (const g of grades) {
        if (!qMap.has(g.quarter)) qMap.set(g.quarter, [])
        qMap.get(g.quarter)!.push(g.gpa_points)
    }
    const chartData = quarterOrder
        .filter(q => qMap.has(q))
        .map(q => {
            const pts = qMap.get(q)!
            return { quarter: q, gpa: parseFloat((pts.reduce((a, b) => a + b, 0) / pts.length).toFixed(2)) }
        })

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2">
                <p className="text-white/50 text-xs">{label}</p>
                <p className="text-[#C8F000] font-heading font-bold">{payload[0].value.toFixed(2)} GPA</p>
            </div>
        )
    }

    return (
        <AppShell title="Dashboard">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">
                    Parent Dashboard
                </h1>
                {athlete && <p className="text-white/40 text-sm mt-0.5">Monitoring <span className="text-white">{athlete.name}</span></p>}
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#1A1A1A] rounded-2xl" />)}
                </div>
            ) : !athlete ? (
                <div className="text-center py-16">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h3 className="font-heading font-bold text-white mb-1">No athlete linked</h3>
                    <p className="text-white/40 text-sm">Contact your coach to link your account to your child's profile.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Athlete card */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 flex items-center gap-4">
                        <Avatar name={athlete.name} photoUrl={athlete.photo_url} size="lg" />
                        <div className="flex-1">
                            <h2 className="font-heading font-bold text-white text-lg">{athlete.name}</h2>
                            {athlete.sport && <p className="text-white/50 text-sm">{athlete.sport}</p>}
                        </div>
                        {gpa !== null && (
                            <div className="text-right">
                                <p className={cn('text-3xl font-heading font-bold', gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                                    {gpa.toFixed(2)}
                                </p>
                                <p className="text-white/30 text-xs">GPA</p>
                            </div>
                        )}
                    </div>

                    {/* GPA alert */}
                    {gpa !== null && gpa < 2.5 && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-[#FF4444] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[#FF4444] font-medium text-sm">GPA Alert</p>
                                <p className="text-white/50 text-xs mt-0.5">
                                    {athlete.name}'s GPA ({gpa.toFixed(2)}) is below the 2.5 NCAA eligibility threshold. Please contact the coach.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="GPA" value={gpa !== null ? gpa.toFixed(2) : '—'} icon={GraduationCap}
                            accent={(gpa ?? 0) >= 2.5} />
                        <StatCard label="Grades Logged" value={grades.length} icon={TrendingUp} />
                    </div>

                    {/* GPA Chart */}
                    {chartData.length >= 2 && (
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5">
                            <h3 className="font-heading font-semibold text-white text-sm mb-4">GPA Trend</h3>
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                                    <XAxis dataKey="quarter" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 4]} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} ticks={[1, 2, 3, 4]} />
                                    <ReferenceLine y={2.5} stroke="#FF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="gpa" stroke="#C8F000" strokeWidth={2.5}
                                        dot={{ fill: '#C8F000', r: 4, strokeWidth: 2, stroke: '#0D0D0D' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Recent Grades */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
                            <h3 className="font-heading font-semibold text-white text-sm">Recent Grades</h3>
                            <Link to="/parent/grades" className="text-[#C8F000] text-xs">View all →</Link>
                        </div>
                        {recentGrades.length === 0 ? (
                            <p className="text-white/40 text-sm px-5 py-6 text-center">No grades logged yet</p>
                        ) : (
                            <div className="divide-y divide-[#2A2A2A]">
                                {recentGrades.map((g, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                                        <div>
                                            <p className="text-white">{g.subject}</p>
                                            <p className="text-white/30 text-xs">{g.quarter} · {g.school_year}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn('font-heading font-bold text-base',
                                                g.gpa_points < 2.0 ? 'text-[#FF4444]' : g.gpa_points >= 3.0 ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                                                {g.letter_grade}
                                            </span>
                                            <Badge variant={g.gpa_points >= 3.0 ? 'success' : g.gpa_points >= 2.0 ? 'warning' : 'error'}>
                                                {g.gpa_points.toFixed(1)} pts
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
