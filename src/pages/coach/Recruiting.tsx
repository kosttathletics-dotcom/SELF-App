import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, Info } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { FOOTBALL_BENCHMARKS, getMetricStatus, type Benchmark } from '@/lib/benchmarks'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Cell
} from 'recharts'

interface AthleteWithStats {
    id: string
    name: string
    photo_url: string | null
    sport: string | null
    position: string | null
    weight: number | null
    height: string | null
    gpa: number | null
    fortyYard: number | null
    bench: number | null
    squat: number | null
    vertical: number | null
}

const DIVISIONS: Benchmark['division'][] = ['FBS', 'FCS', 'D2/NAIA', 'D3']
const DIV_COLORS: Record<string, string> = { FBS: '#C8F000', FCS: '#60a5fa', 'D2/NAIA': '#F4A261', D3: '#a78bfa' }

export default function RecruitingPage() {
    const { user } = useAuth()
    const [athletes, setAthletes] = useState<AthleteWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<AthleteWithStats | null>(null)
    const [selectedDiv, setSelectedDiv] = useState<Benchmark['division']>('FBS')

    const load = useCallback(async () => {
        if (!user) return
        const { data: athData } = await supabase
            .from('athletes')
            .select('id, name, photo_url, sport, position, weight, height')
            .eq('coach_id', user.id)
            .eq('status', 'active' as never)
            .order('name')

        const athList = (athData ?? []) as { id: string; name: string; photo_url: string | null; sport: string | null; position: string | null; weight: number | null; height: string | null }[]
        if (athList.length === 0) { setAthletes([]); setLoading(false); return }

        const ids = athList.map(a => a.id)
        const [gradesRes, prsRes] = await Promise.all([
            supabase.from('grades').select('athlete_id, gpa_points').in('athlete_id', ids),
            supabase.from('personal_records').select('athlete_id, metric_type, value').eq('is_pr', true).in('athlete_id', ids),
        ])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grades = (gradesRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prs = (prsRes.data ?? []) as any[]

        const rows: AthleteWithStats[] = athList.map(a => {
            const ag = grades.filter(g => g.athlete_id === a.id)
            const gpa = ag.length > 0 ? calculateGPA(ag) : null
            const prFor = (metric: string) => prs.find(p => p.athlete_id === a.id && p.metric_type === metric)?.value ?? null

            return {
                ...a,
                gpa,
                fortyYard: prFor('forty_yard'),
                bench: prFor('bench_press_1rm'),
                squat: prFor('squat_1rm'),
                vertical: prFor('vertical_jump'),
            }
        })

        setAthletes(rows)
        if (rows.length > 0) setSelected(rows[0])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const benchmark = selected?.sport && selected?.position
        ? FOOTBALL_BENCHMARKS.find(b => b.sport === selected.sport && b.position === selected.position && b.division === selectedDiv)
        : null

    // Build radar chart data
    const buildRadarData = () => {
        if (!selected || !benchmark) return []
        const metrics = [
            { metric: 'Weight', athlete: selected.weight, benchmark: benchmark.weight_min, lowerIsBetter: false, unit: 'lbs' },
            { metric: '40 Yard', athlete: selected.fortyYard, benchmark: benchmark.forty_yard, lowerIsBetter: true, unit: 's' },
            { metric: 'Bench', athlete: selected.bench, benchmark: benchmark.bench, lowerIsBetter: false, unit: 'lbs' },
            { metric: 'Squat', athlete: selected.squat, benchmark: benchmark.squat, lowerIsBetter: false, unit: 'lbs' },
            { metric: 'Vertical', athlete: selected.vertical, benchmark: benchmark.vertical, lowerIsBetter: false, unit: '"' },
        ].filter(m => m.benchmark !== undefined && m.benchmark !== null)

        return metrics.map(m => {
            const athlVal = m.athlete ?? 0
            const benchVal = m.benchmark!
            const pct = m.lowerIsBetter
                ? Math.min(100, Math.round((benchVal / Math.max(athlVal, 0.01)) * 100))
                : Math.min(100, Math.round((athlVal / benchVal) * 100))
            return { metric: m.metric, athlete: pct, benchmark: 100 }
        })
    }

    // Build bar chart comparison
    const buildBarData = () => {
        if (!selected) return []
        return DIVISIONS.map(div => {
            const bench = FOOTBALL_BENCHMARKS.find(b => b.sport === selected.sport && b.position === selected.position && b.division === div)
            if (!bench) return null

            let score = 0
            let total = 0
            if (bench.weight_min && selected.weight) { score += selected.weight >= bench.weight_min ? 1 : selected.weight / bench.weight_min; total++ }
            if (bench.forty_yard && selected.fortyYard) { score += selected.fortyYard <= bench.forty_yard ? 1 : bench.forty_yard / selected.fortyYard; total++ }
            if (bench.bench && selected.bench) { score += selected.bench >= bench.bench ? 1 : selected.bench / bench.bench; total++ }
            if (bench.squat && selected.squat) { score += selected.squat >= bench.squat ? 1 : selected.squat / bench.squat; total++ }

            return { division: div, score: total > 0 ? Math.round((score / total) * 100) : 0 }
        }).filter(Boolean) as { division: string; score: number }[]
    }

    const radarData = buildRadarData()
    const barData = buildBarData()

    const MetricRow = ({ label, athlete, benchmark: bench, lowerIsBetter, unit }: {
        label: string; athlete: number | null; benchmark: number | undefined; lowerIsBetter?: boolean; unit?: string
    }) => {
        if (!bench) return null
        const status = athlete ? getMetricStatus(athlete, bench, lowerIsBetter) : 'red'
        const pct = athlete
            ? lowerIsBetter
                ? Math.min(100, Math.round((bench / athlete) * 100))
                : Math.min(100, Math.round((athlete / bench) * 100))
            : 0
        const barColor = status === 'green' ? '#C8F000' : status === 'yellow' ? '#F4A261' : '#FF4444'

        return (
            <div className="py-3 border-b border-[#2A2A2A] last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/70 text-sm">{label}</span>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={cn('font-heading font-bold', status === 'green' ? 'text-[#C8F000]' : status === 'yellow' ? 'text-[#F4A261]' : 'text-[#FF4444]')}>
                            {athlete !== null ? `${athlete}${unit ?? ''}` : '—'}
                        </span>
                        <span className="text-white/30">/ {bench}{unit ?? ''}</span>
                    </div>
                </div>
                <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
            </div>
        )
    }

    return (
        <AppShell title="Recruiting">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Recruiting</h1>
                <p className="text-white/40 text-sm mt-0.5">Division benchmark comparison</p>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-[#1A1A1A] rounded-2xl" />)}
                </div>
            ) : athletes.length === 0 ? (
                <div className="text-center py-16">
                    <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No active athletes on roster</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Athlete Selector */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {athletes.map(a => (
                            <button key={a.id} onClick={() => setSelected(a)}
                                className={cn('flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                                    selected?.id === a.id ? 'bg-[#C8F000]/10 border-[#C8F000]/30 text-[#C8F000]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/60 hover:text-white/80')}>
                                <Avatar name={a.name} photoUrl={a.photo_url} size="sm" />
                                <span className="text-sm font-medium">{a.name}</span>
                            </button>
                        ))}
                    </div>

                    {selected && (
                        <>
                            {/* Selected athlete header */}
                            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={selected.name} photoUrl={selected.photo_url} size="lg" />
                                        <div>
                                            <Link to={`/athletes/${selected.id}`} className="font-heading font-bold text-white hover:text-[#C8F000] transition-colors">
                                                {selected.name}
                                            </Link>
                                            <p className="text-white/50 text-sm">{[selected.sport, selected.position].filter(Boolean).join(' · ')}</p>
                                            <div className="flex gap-2 mt-1">
                                                {selected.height && <Badge>{selected.height}</Badge>}
                                                {selected.weight && <Badge>{selected.weight} lbs</Badge>}
                                                {selected.gpa !== null && <Badge variant={selected.gpa >= 2.5 ? 'success' : 'error'}>GPA {selected.gpa.toFixed(2)}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Division Selector */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-none">
                                {DIVISIONS.map(div => (
                                    <button key={div} onClick={() => setSelectedDiv(div)}
                                        className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                                            selectedDiv === div ? 'text-[#0D0D0D] border-transparent' : 'bg-[#1A1A1A] text-white/50 border-[#2A2A2A] hover:text-white/80')}
                                        style={selectedDiv === div ? { backgroundColor: DIV_COLORS[div] } : {}}>
                                        {div}
                                    </button>
                                ))}
                            </div>

                            {!benchmark && selected.sport === 'Football' && (
                                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3">
                                    <Info className="w-4 h-4 text-white/30 flex-shrink-0" />
                                    <p className="text-white/40 text-sm">No benchmark found for position "{selected.position}". Add position in athlete profile to see benchmarks.</p>
                                </div>
                            )}

                            {selected.sport !== 'Football' && (
                                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3">
                                    <Info className="w-4 h-4 text-[#C8F000] flex-shrink-0" />
                                    <p className="text-white/40 text-sm">Football benchmarks are built-in. Other sports can be configured by coaches in settings.</p>
                                </div>
                            )}

                            {/* Bar chart — Division fit scores */}
                            {barData.length > 0 && (
                                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-4 h-4 text-[#C8F000]" />
                                        <h3 className="font-heading font-semibold text-white text-sm">Division Fit Score</h3>
                                        <span className="text-white/30 text-xs ml-auto">based on available metrics</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                                            <XAxis dataKey="division" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                                                labelStyle={{ color: '#fff' }}
                                                formatter={(v) => v !== undefined ? [`${v}%`, 'Fit Score'] : ['—', 'Fit Score']}
                                            />
                                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                                {barData.map((entry) => (
                                                    <Cell key={entry.division} fill={DIV_COLORS[entry.division] ?? '#3A3A3A'} fillOpacity={selectedDiv === entry.division ? 1 : 0.4} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Radar chart */}
                            {radarData.length >= 3 && (
                                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                                    <h3 className="font-heading font-semibold text-white text-sm mb-4">Metric Radar vs {selectedDiv}</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#2A2A2A" />
                                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#666', fontSize: 11 }} />
                                            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#444', fontSize: 9 }} />
                                            <Radar name="Benchmark" dataKey="benchmark" stroke="#2A2A2A" fill="#2A2A2A" fillOpacity={0.3} />
                                            <Radar name={selected.name} dataKey="athlete" stroke="#C8F000" fill="#C8F000" fillOpacity={0.2} />
                                            <Tooltip
                                                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                                                formatter={(v) => v !== undefined ? [`${v}%`] : ['—']}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Metric details */}
                            {benchmark && (
                                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                                    <h3 className="font-heading font-semibold text-white text-sm mb-1">{selectedDiv} Benchmark — {selected.position}</h3>
                                    <p className="text-white/30 text-xs mb-4">Recruit typically needs to meet or exceed these metrics</p>
                                    <MetricRow label="Weight" athlete={selected.weight} benchmark={benchmark.weight_min} unit=" lbs" />
                                    <MetricRow label="40-Yard Dash" athlete={selected.fortyYard} benchmark={benchmark.forty_yard} lowerIsBetter unit="s" />
                                    <MetricRow label="Bench Press 1RM" athlete={selected.bench} benchmark={benchmark.bench} unit=" lbs" />
                                    <MetricRow label="Squat 1RM" athlete={selected.squat} benchmark={benchmark.squat} unit=" lbs" />
                                    <MetricRow label="Vertical Jump" athlete={selected.vertical} benchmark={benchmark.vertical} unit={'"'} />
                                    <p className="text-white/20 text-xs mt-4">* Metrics are populated from logged PRs. Log workouts to update athlete metrics.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </AppShell>
    )
}
