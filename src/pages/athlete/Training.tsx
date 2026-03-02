import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Dumbbell, CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

interface WorkoutExercise {
    exercise_name: string
    sets: number
    reps: string
    rest_seconds: number | null
    notes: string | null
    sort_order: number
}

interface AssignedWorkout {
    id: string
    name: string
    date: string
    description: string | null
    completed: boolean
    exercises: WorkoutExercise[]
}

export default function AthleteTraining() {
    const { user } = useAuth()
    const [workouts, setWorkouts] = useState<AssignedWorkout[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming')
    const today = format(new Date(), 'yyyy-MM-dd')

    const load = useCallback(async () => {
        if (!user) return
        const { data: athData } = await supabase.from('athletes').select('id').eq('user_id', user.id).single()
        const ath = athData as unknown as { id: string } | null
        if (!ath) return setLoading(false)

        const { data } = await supabase
            .from('workout_assignments')
            .select(`
        id, completed, assigned_date,
        workouts(
          id, name, description,
          workout_exercises(exercise_name, sets, reps, rest_seconds, notes, sort_order)
        )
      `)
            .eq('athlete_id', ath.id)
            .order('assigned_date', { ascending: false })
            .limit(30)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (data ?? []) as any[]
        setWorkouts(raw.map(r => ({
            id: r.id as string,
            name: r.workouts?.name ?? 'Workout',
            date: r.assigned_date as string,
            description: r.workouts?.description ?? null,
            completed: r.completed as boolean,
            exercises: (r.workouts?.workout_exercises ?? [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => a.sort_order - b.sort_order) as WorkoutExercise[],
        })))
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const markComplete = async (id: string) => {
        await supabase.from('workout_assignments').update({ completed: true } as never).eq('id', id)
        void load()
    }

    const filtered = workouts.filter(w => {
        if (filter === 'upcoming') return !w.completed && w.date >= today
        if (filter === 'completed') return w.completed
        return true
    })

    const completedCount = workouts.filter(w => w.completed).length
    const totalCount = workouts.length
    const compliancePct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <AppShell title="My Training">
            <div className="mb-5">
                <h1 className="text-2xl font-heading font-bold text-white">My Training</h1>
                <p className="text-white/40 text-sm mt-0.5">{totalCount} workouts assigned</p>
            </div>

            {/* Compliance card */}
            {totalCount > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-5 flex items-center gap-5">
                    <div className="text-center">
                        <p className={cn('text-3xl font-heading font-bold', compliancePct >= 80 ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                            {compliancePct}%
                        </p>
                        <p className="text-white/40 text-xs">Compliance</p>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C8F000] rounded-full transition-all" style={{ width: `${compliancePct}%` }} />
                        </div>
                        <p className="text-white/40 text-xs mt-1.5">{completedCount} of {totalCount} workouts completed</p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-5">
                {(['upcoming', 'completed', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                            filter === f ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50')}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Workout list */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Dumbbell} title={filter === 'upcoming' ? 'No upcoming workouts' : 'No workouts found'} description="Your coach will assign workouts here" />
            ) : (
                <div className="space-y-3">
                    {filtered.map(w => (
                        <div key={w.id} className={cn('bg-[#1A1A1A] border rounded-2xl overflow-hidden',
                            w.date === today ? 'border-[#C8F000]/30' : w.completed ? 'border-[#2A2A2A]' : 'border-[#2A2A2A]')}>
                            <button
                                onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#2A2A2A]/20 transition-colors"
                            >
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                    w.completed ? 'bg-[#C8F000]/15' : w.date === today ? 'bg-[#C8F000]/10' : 'bg-[#2A2A2A]')}>
                                    {w.completed
                                        ? <CheckCircle2 className="w-5 h-5 text-[#C8F000]" />
                                        : <Dumbbell className="w-5 h-5 text-white/40" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-heading font-semibold text-white text-sm">{w.name}</p>
                                        {w.date === today && <Badge variant="success">Today</Badge>}
                                        {w.completed && <Badge variant="success">✓ Done</Badge>}
                                    </div>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        {format(new Date(w.date), 'EEE, MMM d')} · {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {expanded === w.id ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                            </button>

                            {expanded === w.id && (
                                <div className="border-t border-[#2A2A2A] px-4 py-3 space-y-3">
                                    {w.description && <p className="text-white/50 text-sm">{w.description}</p>}
                                    <div className="divide-y divide-[#2A2A2A]">
                                        {w.exercises.map((ex, i) => (
                                            <div key={i} className="flex items-start gap-3 py-2.5">
                                                <span className="w-5 h-5 rounded-full bg-[#C8F000]/10 text-[#C8F000] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-medium">{ex.exercise_name}</p>
                                                    <p className="text-white/50 text-xs mt-0.5">
                                                        {ex.sets} sets × {ex.reps}{ex.rest_seconds && ` · ${ex.rest_seconds}s rest`}
                                                    </p>
                                                    {ex.notes && <p className="text-white/30 text-xs mt-1 italic">{ex.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {!w.completed && (
                                        <button
                                            onClick={() => void markComplete(w.id)}
                                            className="w-full py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all"
                                        >
                                            <CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                            Mark Complete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    )
}
