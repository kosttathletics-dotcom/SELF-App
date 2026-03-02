import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { StatCard } from '@/components/shared/StatCard'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateGPA } from '@/lib/gpa'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
    GraduationCap, Dumbbell, MessageCircle, AlertTriangle,
    ChevronRight, CheckCircle2, Calendar, Trophy
} from 'lucide-react'

interface AssignedWorkout {
    id: string
    name: string
    date: string
    description: string | null
    completed: boolean
    exercises: { exercise_name: string; sets: number; reps: string; rest_seconds: number | null }[]
}

interface AthleteStats {
    id: string
    name: string
    photo_url: string | null
    sport: string | null
    position: string | null
    grade: string | null
}

export default function AthleteDashboard() {
    const { user } = useAuth()
    const [athlete, setAthlete] = useState<AthleteStats | null>(null)
    const [gpa, setGpa] = useState<number | null>(null)
    const [attendancePct, setAttendancePct] = useState<number | null>(null)
    const [activeInjuries, setActiveInjuries] = useState(0)
    const [todayWorkout, setTodayWorkout] = useState<AssignedWorkout | null>(null)
    const [upcomingWorkouts, setUpcomingWorkouts] = useState<AssignedWorkout[]>([])
    const [loading, setLoading] = useState(true)
    const [expandWorkout, setExpandWorkout] = useState<string | null>(null)
    const [today] = useState(format(new Date(), 'yyyy-MM-dd'))

    const load = useCallback(async () => {
        if (!user) return

        const { data: athData } = await supabase
            .from('athletes')
            .select('id, name, photo_url, sport, position, grade')
            .eq('user_id', user.id)
            .single()
        const ath = athData as unknown as AthleteStats | null
        if (!ath) return setLoading(false)
        setAthlete(ath)

        // Load grades, attendance, injuries in parallel
        const [gradesRes, attRes, injRes, workoutsRes] = await Promise.all([
            supabase.from('grades').select('gpa_points').eq('athlete_id', ath.id),
            supabase.from('attendance').select('status').eq('athlete_id', ath.id),
            supabase.from('injuries').select('id').eq('athlete_id', ath.id).eq('status', 'active' as never),
            supabase.from('workout_assignments')
                .select(`
          id, completed, assigned_date,
          workouts(id, name, description,
            workout_exercises(exercise_name, sets, reps, rest_seconds, sort_order)
          )
        `)
                .eq('athlete_id', ath.id)
                .gte('assigned_date', today)
                .order('assigned_date', { ascending: true })
                .limit(5),
        ])

        // GPA
        const grades = (gradesRes.data ?? []) as { gpa_points: number }[]
        setGpa(grades.length > 0 ? calculateGPA(grades) : null)

        // Attendance
        const att = (attRes.data ?? []) as { status: string }[]
        const present = att.filter(a => a.status === 'present' || a.status === 'late').length
        setAttendancePct(att.length > 0 ? Math.round((present / att.length) * 100) : null)

        // Injuries
        setActiveInjuries((injRes.data ?? []).length)

        // Workouts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (workoutsRes.data ?? []) as any[]
        const parsed: AssignedWorkout[] = raw.map(r => ({
            id: r.id as string,
            name: r.workouts?.name ?? 'Workout',
            date: r.assigned_date as string,
            description: r.workouts?.description ?? null,
            completed: r.completed as boolean,
            exercises: (r.workouts?.workout_exercises ?? [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((e: any) => ({
                    exercise_name: e.exercise_name as string,
                    sets: e.sets as number,
                    reps: e.reps as string,
                    rest_seconds: e.rest_seconds as number | null,
                })),
        }))

        const todayW = parsed.find(w => w.date === today) ?? null
        setTodayWorkout(todayW)
        setUpcomingWorkouts(parsed.filter(w => w.date !== today).slice(0, 3))
        setLoading(false)
    }, [user, today])

    useEffect(() => { void load() }, [load])

    const markComplete = async (assignmentId: string) => {
        await supabase.from('workout_assignments').update({ completed: true } as never).eq('id', assignmentId)
        void load()
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    if (loading) {
        return (
            <AppShell title="Dashboard">
                <div className="space-y-4 animate-pulse">
                    <div className="h-28 bg-[#1A1A1A] rounded-2xl" />
                    <div className="h-40 bg-[#1A1A1A] rounded-2xl" />
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-xl" />)}
                    </div>
                </div>
            </AppShell>
        )
    }

    if (!athlete) {
        return (
            <AppShell title="Dashboard">
                <div className="text-center py-16">
                    <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h3 className="font-heading font-bold text-white mb-2">Profile Not Set Up</h3>
                    <p className="text-white/40 text-sm">Your coach needs to add you to the roster first.</p>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell title="Dashboard">
            {/* Greeting hero */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-5 flex items-center gap-4">
                <Avatar name={athlete.name} photoUrl={athlete.photo_url} size="lg" />
                <div>
                    <p className="text-white/50 text-sm">{greeting},</p>
                    <h1 className="text-2xl font-heading font-bold text-white leading-tight">{athlete.name.split(' ')[0]} 👋</h1>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                        {athlete.sport && <Badge>{athlete.sport}</Badge>}
                        {athlete.position && <Badge>{athlete.position}</Badge>}
                        {athlete.grade && <Badge>{athlete.grade}</Badge>}
                    </div>
                </div>
            </div>

            {/* Active injury alert */}
            {activeInjuries > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl mb-5">
                    <AlertTriangle className="w-4 h-4 text-[#FF4444] flex-shrink-0" />
                    <p className="text-white/60 text-sm">
                        You have <span className="text-[#FF4444] font-semibold">{activeInjuries} active {activeInjuries === 1 ? 'injury' : 'injuries'}</span> on record. Contact your trainer before workouts.
                    </p>
                </div>
            )}

            {/* Today's workout */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-heading font-bold text-white text-sm">Today's Workout</h2>
                    <Link to="/athlete/training" className="text-[#C8F000] text-xs">See all →</Link>
                </div>

                {!todayWorkout ? (
                    <div className="bg-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-2xl p-5 text-center">
                        <Dumbbell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-white/40 text-sm">No workout assigned for today</p>
                        <p className="text-white/25 text-xs mt-1">Rest day or check back later</p>
                    </div>
                ) : (
                    <div className={cn(
                        'bg-[#1A1A1A] border rounded-2xl overflow-hidden',
                        todayWorkout.completed ? 'border-[#C8F000]/20' : 'border-[#2A2A2A]'
                    )}>
                        <button
                            onClick={() => setExpandWorkout(expandWorkout === todayWorkout.id ? null : todayWorkout.id)}
                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#2A2A2A]/20 transition-colors"
                        >
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                todayWorkout.completed ? 'bg-[#C8F000]/15' : 'bg-[#C8F000]/10')}>
                                <Dumbbell className={cn('w-5 h-5', todayWorkout.completed ? 'text-[#C8F000]' : 'text-[#C8F000]/60')} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-heading font-semibold text-white">{todayWorkout.name}</p>
                                    {todayWorkout.completed && <Badge variant="success">✓ Done</Badge>}
                                </div>
                                <p className="text-white/40 text-xs mt-0.5">
                                    {todayWorkout.exercises.length} exercise{todayWorkout.exercises.length !== 1 ? 's' : ''} · Today
                                </p>
                            </div>
                            <ChevronRight className={cn('w-4 h-4 text-white/30 transition-transform', expandWorkout === todayWorkout.id && 'rotate-90')} />
                        </button>

                        {expandWorkout === todayWorkout.id && (
                            <div className="border-t border-[#2A2A2A] px-4 py-3 space-y-3">
                                {todayWorkout.description && (
                                    <p className="text-white/50 text-sm">{todayWorkout.description}</p>
                                )}
                                <div className="space-y-2">
                                    {todayWorkout.exercises.map((ex, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-[#2A2A2A] last:border-0">
                                            <span className="w-5 h-5 rounded-full bg-[#C8F000]/10 text-[#C8F000] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium">{ex.exercise_name}</p>
                                                <p className="text-white/40 text-xs">
                                                    {ex.sets} sets × {ex.reps}
                                                    {ex.rest_seconds && ` · ${ex.rest_seconds}s rest`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!todayWorkout.completed && (
                                    <button
                                        onClick={() => void markComplete(todayWorkout.id)}
                                        className="w-full py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all"
                                    >
                                        <CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                        Mark as Complete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard
                    label="GPA"
                    value={gpa !== null ? gpa.toFixed(2) : '—'}
                    icon={GraduationCap}
                    accent={gpa !== null && gpa >= 2.5}
                />
                <StatCard
                    label="Attendance"
                    value={attendancePct !== null ? `${attendancePct}%` : '—'}
                    icon={Calendar}
                    accent={attendancePct !== null && attendancePct >= 80}
                />
                <StatCard
                    label="Injuries"
                    value={activeInjuries}
                    icon={AlertTriangle}
                />
            </div>

            {/* GPA progress bar */}
            {gpa !== null && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs">GPA Progress</span>
                        <span className={cn('text-xs font-medium', gpa >= 3.0 ? 'text-[#C8F000]' : gpa >= 2.5 ? 'text-[#F4A261]' : 'text-[#FF4444]')}>
                            {gpa >= 3.0 ? 'Honor Roll' : gpa >= 2.5 ? 'Eligible' : '⚠ Red Flag'}
                        </span>
                    </div>
                    <ProgressBar value={gpa} max={4.0} variant={gpa >= 2.5 ? 'success' : 'error'} />
                </div>
            )}

            {/* Upcoming workouts */}
            {upcomingWorkouts.length > 0 && (
                <div>
                    <h2 className="font-heading font-bold text-white text-sm mb-3">Upcoming Workouts</h2>
                    <div className="space-y-2">
                        {upcomingWorkouts.map(w => (
                            <div key={w.id} className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                                <Dumbbell className="w-4 h-4 text-white/30 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{w.name}</p>
                                    <p className="text-white/40 text-xs">{format(new Date(w.date), 'EEE, MMM d')} · {w.exercises.length} exercises</p>
                                </div>
                                {w.completed && <Badge variant="success">Done</Badge>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick nav */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                    { to: '/athlete/grades', icon: GraduationCap, label: 'My Grades', sub: gpa !== null ? `GPA: ${gpa.toFixed(2)}` : 'View record' },
                    { to: '/athlete/messages', icon: MessageCircle, label: 'Messages', sub: 'Chat with coach' },
                ].map(({ to, icon: Icon, label, sub }) => (
                    <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-[#C8F000]/30 transition-all group">
                        <div className="w-9 h-9 rounded-xl bg-[#C8F000]/10 flex items-center justify-center group-hover:bg-[#C8F000]/15 transition-colors">
                            <Icon className="w-4 h-4 text-[#C8F000]" />
                        </div>
                        <div>
                            <p className="font-medium text-white text-sm">{label}</p>
                            <p className="text-white/40 text-xs">{sub}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </AppShell>
    )
}
