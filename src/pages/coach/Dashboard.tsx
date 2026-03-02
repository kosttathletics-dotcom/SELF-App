import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Dumbbell, AlertTriangle, CalendarCheck, Plus, MessageSquarePlus, Zap } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StatCard } from '@/components/shared/StatCard'
import { Badge } from '@/components/shared/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns'

interface DashboardStats {
    totalAthletes: number
    workoutsThisWeek: number
    activeInjuries: number
    attendanceRate: number
}

interface RedFlag {
    type: 'gpa' | 'compliance' | 'injury' | 'attendance'
    athleteName: string
    athleteId: string
    detail: string
}

interface PREntry {
    id: string
    weight: number
    estimated_1rm: number
    athleteName?: string
    athletePhoto?: string | null
    exerciseName?: string
}

interface EventEntry {
    id: string
    title: string
    date: string
    time: string | null
    type: string
    location: string | null
}

export default function CoachDashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({ totalAthletes: 0, workoutsThisWeek: 0, activeInjuries: 0, attendanceRate: 0 })
    const [redFlags, setRedFlags] = useState<RedFlag[]>([])
    const [recentPRs, setRecentPRs] = useState<PREntry[]>([])
    const [upcomingEvents, setUpcomingEvents] = useState<EventEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) void loadDashboard(user.id)
    }, [user])

    const loadDashboard = async (coachId: string) => {
        setLoading(true)

        const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd')
        const today = format(new Date(), 'yyyy-MM-dd')

        const [athletesRes, injuriesRes, logsRes, eventsRes, attendanceRes, gradesRes] = await Promise.all([
            supabase.from('athletes').select('id, name, status, photo_url').eq('coach_id', coachId),
            supabase.from('injuries').select('id, athlete_id, status').eq('status', 'active' as never),
            supabase.from('workout_logs').select('athlete_id, completed, date').gte('date', weekStart).lte('date', weekEnd),
            supabase.from('calendar_events').select('id, title, date, time, type, location').eq('coach_id', coachId).gte('date', today).order('date').limit(5),
            supabase.from('attendance_records').select('athlete_id, status'),
            supabase.from('grades').select('athlete_id, gpa_points'),
        ])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const athletes = (athletesRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const injuries = (injuriesRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logs = (logsRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = (eventsRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = (attendanceRes.data ?? []) as any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allGrades = (gradesRes.data ?? []) as any[]

        const attendanceTotal = records.length
        const attendancePresent = records.filter((r: { status: string }) => r.status !== 'absent').length
        const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 100

        setStats({
            totalAthletes: athletes.length,
            workoutsThisWeek: logs.filter((l: { completed: boolean }) => l.completed).length,
            activeInjuries: injuries.length,
            attendanceRate,
        })

        // Red flags
        const flags: RedFlag[] = []

        for (const inj of injuries) {
            const athlete = athletes.find((a: { id: string }) => a.id === inj.athlete_id)
            if (athlete) {
                flags.push({ type: 'injury', athleteName: athlete.name as string, athleteId: athlete.id as string, detail: 'Active injury — check status' })
            }
        }

        const gradeMap = new Map<string, number[]>()
        for (const g of allGrades) {
            if (!gradeMap.has(g.athlete_id)) gradeMap.set(g.athlete_id, [])
            gradeMap.get(g.athlete_id)!.push(g.gpa_points as number)
        }
        for (const [athId, pts] of gradeMap.entries()) {
            const gpa = pts.reduce((a, b) => a + b, 0) / pts.length
            if (gpa < 2.5) {
                const athlete = athletes.find((a: { id: string }) => a.id === athId)
                if (athlete) flags.push({ type: 'gpa', athleteName: athlete.name as string, athleteId: athId, detail: `GPA ${gpa.toFixed(2)} — below 2.5 threshold` })
            }
        }

        setRedFlags(flags.slice(0, 5))
        setUpcomingEvents(events as EventEntry[])

        // Fetch PRs separately with a simpler query
        const { data: prsData } = await supabase
            .from('personal_records')
            .select('id, weight, estimated_1rm, athlete_id, exercise_id')
            .eq('is_pr', true)
            .order('created_at', { ascending: false })
            .limit(5)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prsRaw = (prsData ?? []) as any[]

        // Enrich with athlete/exercise names
        const prEntries: PREntry[] = prsRaw.map(pr => {
            const athlete = athletes.find((a: { id: string }) => a.id === pr.athlete_id)
            return {
                id: pr.id as string,
                weight: pr.weight as number,
                estimated_1rm: pr.estimated_1rm as number,
                athleteName: athlete?.name as string | undefined,
                athletePhoto: athlete?.photo_url as string | null | undefined,
                exerciseName: undefined,
            }
        })

        setRecentPRs(prEntries)
        setLoading(false)
    }

    const today = new Date()

    return (
        <AppShell title="Dashboard">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-white">
                    Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                    <span className="text-[#C8F000]">{user?.name?.split(' ')[0] ?? 'Coach'}</span> 👊
                </h1>
                <p className="text-white/40 text-sm mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
                <Link
                    to="/athletes"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Add Athlete
                </Link>
                <Link
                    to="/training"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium rounded-xl text-sm hover:border-[#C8F000]/40 hover:text-[#C8F000] active:scale-95 transition-all"
                >
                    <Dumbbell className="w-4 h-4" />
                    Create Workout
                </Link>
                <Link
                    to="/messages"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium rounded-xl text-sm hover:border-[#C8F000]/40 hover:text-[#C8F000] active:scale-95 transition-all"
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    Send Message
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Athletes" value={loading ? '—' : stats.totalAthletes} icon={Users} />
                <StatCard label="Workouts This Week" value={loading ? '—' : stats.workoutsThisWeek} icon={Dumbbell} accent={stats.workoutsThisWeek > 0} />
                <StatCard label="Active Injuries" value={loading ? '—' : stats.activeInjuries} icon={AlertTriangle} />
                <StatCard label="Attendance Rate" value={loading ? '—' : `${stats.attendanceRate}%`} icon={CalendarCheck} accent={stats.attendanceRate >= 70} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Red Flags */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A2A2A]">
                            <AlertTriangle className="w-4 h-4 text-[#FF4444]" />
                            <h2 className="font-heading font-semibold text-white text-sm">Red Flags</h2>
                            {redFlags.length > 0 && (
                                <span className="ml-auto text-xs bg-[#FF4444]/15 text-[#FF4444] px-2 py-0.5 rounded-full font-medium">{redFlags.length}</span>
                            )}
                        </div>
                        {loading ? (
                            <div className="px-5 py-6 space-y-3">
                                {[1, 2].map(i => <div key={i} className="h-12 bg-[#2A2A2A] rounded-xl animate-pulse" />)}
                            </div>
                        ) : redFlags.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <div className="w-10 h-10 rounded-full bg-[#C8F000]/10 flex items-center justify-center mx-auto mb-2">
                                    <Zap className="w-5 h-5 text-[#C8F000]" />
                                </div>
                                <p className="text-white/40 text-sm">No red flags — team is on track 🎯</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2A2A2A]">
                                {redFlags.map((flag, i) => (
                                    <Link key={i} to={`/athletes/${flag.athleteId}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#2A2A2A]/50 transition-colors">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${flag.type === 'gpa' ? 'bg-[#F4A261]' : 'bg-[#FF4444]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium">{flag.athleteName}</p>
                                            <p className="text-white/40 text-xs mt-0.5 truncate">{flag.detail}</p>
                                        </div>
                                        <Badge variant={flag.type === 'gpa' ? 'warning' : 'error'}>
                                            {flag.type === 'gpa' ? 'GPA' : flag.type === 'injury' ? 'Injured' : 'Flag'}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent PRs */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A2A2A]">
                            <Zap className="w-4 h-4 text-[#C8F000]" />
                            <h2 className="font-heading font-semibold text-white text-sm">Recent PRs</h2>
                        </div>
                        {loading ? (
                            <div className="px-5 py-6 space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#2A2A2A] rounded-xl animate-pulse" />)}
                            </div>
                        ) : recentPRs.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-white/40 text-sm">No PRs logged yet. Get your athletes lifting! 💪</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2A2A2A]">
                                {recentPRs.map((pr) => (
                                    <div key={pr.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <Avatar name={pr.athleteName} photoUrl={pr.athletePhoto} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium">{pr.athleteName ?? 'Athlete'}</p>
                                            <p className="text-white/40 text-xs">{pr.exerciseName ?? 'Exercise'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#C8F000] font-heading font-bold text-sm">{pr.weight} lbs</p>
                                            <p className="text-white/30 text-xs">1RM: {pr.estimated_1rm}</p>
                                        </div>
                                        <Badge variant="success">PR 🏆</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right 1/3 — Upcoming Events */}
                <div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
                            <div className="flex items-center gap-2">
                                <CalendarCheck className="w-4 h-4 text-white/60" />
                                <h2 className="font-heading font-semibold text-white text-sm">Upcoming</h2>
                            </div>
                            <Link to="/calendar" className="text-[#C8F000] text-xs hover:text-[#d4f520] transition-colors">View all</Link>
                        </div>
                        {loading ? (
                            <div className="px-5 py-6 space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#2A2A2A] rounded-xl animate-pulse" />)}
                            </div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-white/40 text-sm">No upcoming events</p>
                                <Link to="/calendar" className="text-[#C8F000] text-xs mt-2 inline-block">Schedule one →</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2A2A2A]">
                                {upcomingEvents.map((event) => {
                                    const eventDate = parseISO(event.date)
                                    const typeColors: Record<string, string> = {
                                        Lift: 'bg-[#C8F000]', Practice: 'bg-white', Game: 'bg-yellow-400', Meeting: 'bg-blue-400', Event: 'bg-white/40',
                                    }
                                    return (
                                        <div key={event.id} className="flex items-start gap-3 px-5 py-3.5">
                                            <div className="text-center min-w-[36px]">
                                                <p className="text-white/40 text-[10px] uppercase">{format(eventDate, 'MMM')}</p>
                                                <p className="text-white font-heading font-bold text-lg leading-none">{format(eventDate, 'd')}</p>
                                                {isToday(eventDate) && <p className="text-[#C8F000] text-[9px] font-medium">TODAY</p>}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeColors[event.type] ?? 'bg-white/40'}`} />
                                                    <p className="text-white text-sm font-medium truncate">{event.title}</p>
                                                </div>
                                                {event.time && <p className="text-white/30 text-xs">{event.time.slice(0, 5)}</p>}
                                                {event.location && <p className="text-white/30 text-xs truncate">{event.location}</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
