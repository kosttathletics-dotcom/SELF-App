import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculateOneRM, isPersonalRecord } from '@/lib/oneRM'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Dumbbell, CheckCircle2, Trophy, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

interface ExerciseEntry {
    exercise_id: string | null
    exercise_name: string
    target_sets: number | null
    target_reps: string | null
    target_weight: number | null
    target_rpe: number | null
    // Athlete input
    sets_completed: number
    reps_completed: number
    weight_achieved: number
    rpe_actual: number
    notes: string
    // Computed
    estimated_1rm: number | null
    is_new_pr: boolean
}

interface WorkoutInfo {
    workout_id: string
    workout_name: string
    description: string | null
    assignment_id: string | null
    exercises: ExerciseEntry[]
}

export default function LogWorkout() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const workoutParam = searchParams.get('workout')
    const assignmentParam = searchParams.get('assignment')

    const [athleteId, setAthleteId] = useState<string | null>(null)
    const [athleteName, setAthleteName] = useState('')
    const [workout, setWorkout] = useState<WorkoutInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [expandedIdx, setExpandedIdx] = useState<number | null>(0)
    const [existingMaxes, setExistingMaxes] = useState<Record<string, number>>({})

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C8F000] transition-colors'

    const load = useCallback(async () => {
        if (!user) return

        // Fetch athlete record
        const { data: athData } = await supabase
            .from('athletes')
            .select('id, name')
            .eq('user_id', user.id)
            .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ath = athData as any
        if (!ath) return setLoading(false)
        setAthleteId(ath.id as string)
        setAthleteName(ath.name as string)

        if (!workoutParam) return setLoading(false)

        // Load workout with exercises
        const { data: workoutData } = await supabase
            .from('workouts')
            .select(`
                id, name, description,
                workout_exercises(
                    exercise_id, exercise_name, sets, reps, target_weight, rpe, order_index, sort_order, notes
                )
            `)
            .eq('id', workoutParam)
            .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = workoutData as any
        if (!w) return setLoading(false)

        // Sort exercises by order_index or sort_order
        const rawExercises = (w.workout_exercises ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a: any, b: any) => (a.order_index ?? a.sort_order ?? 0) - (b.order_index ?? b.sort_order ?? 0))

        // Get existing max 1RMs for PR detection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exerciseIds = rawExercises.map((e: any) => e.exercise_id).filter(Boolean) as string[]
        const maxMap: Record<string, number> = {}

        if (exerciseIds.length > 0) {
            const { data: prData } = await supabase
                .from('personal_records')
                .select('exercise_id, estimated_1rm')
                .eq('athlete_id', ath.id as string)
                .in('exercise_id', exerciseIds)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const pr of (prData ?? []) as any[]) {
                const eid = pr.exercise_id as string
                const e1rm = pr.estimated_1rm as number
                if (!maxMap[eid] || e1rm > maxMap[eid]) {
                    maxMap[eid] = e1rm
                }
            }
        }
        setExistingMaxes(maxMap)

        // Build exercise entries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exercises: ExerciseEntry[] = rawExercises.map((e: any) => ({
            exercise_id: (e.exercise_id as string) ?? null,
            exercise_name: (e.exercise_name as string) ?? 'Exercise',
            target_sets: (e.sets as number) ?? null,
            target_reps: e.reps != null ? String(e.reps) : null,
            target_weight: (e.target_weight as number) ?? null,
            target_rpe: (e.rpe as number) ?? null,
            sets_completed: (e.sets as number) ?? 0,
            reps_completed: typeof e.reps === 'number' ? e.reps : parseInt(String(e.reps)) || 0,
            weight_achieved: (e.target_weight as number) ?? 0,
            rpe_actual: (e.rpe as number) ?? 7,
            notes: '',
            estimated_1rm: null,
            is_new_pr: false,
        }))

        setWorkout({
            workout_id: w.id as string,
            workout_name: w.name as string,
            description: w.description as string | null,
            assignment_id: assignmentParam,
            exercises,
        })

        setLoading(false)
    }, [user, workoutParam, assignmentParam])

    useEffect(() => { void load() }, [load])

    const updateExercise = (idx: number, field: keyof ExerciseEntry, value: number | string) => {
        setWorkout(prev => {
            if (!prev) return prev
            const exercises = [...prev.exercises]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ex = { ...exercises[idx], [field]: value } as any as ExerciseEntry

            // Recalculate 1RM when weight or reps change
            if ((field === 'weight_achieved' || field === 'reps_completed') && ex.weight_achieved > 0 && ex.reps_completed > 0) {
                ex.estimated_1rm = calculateOneRM(ex.weight_achieved, ex.reps_completed)
                const existingMax = ex.exercise_id ? existingMaxes[ex.exercise_id] ?? null : null
                ex.is_new_pr = isPersonalRecord(ex.estimated_1rm, existingMax)
            } else if (ex.weight_achieved === 0 || ex.reps_completed === 0) {
                ex.estimated_1rm = null
                ex.is_new_pr = false
            }

            exercises[idx] = ex
            return { ...prev, exercises }
        })
    }

    const handleSave = async () => {
        if (!workout || !athleteId) return
        setSaving(true)

        const today = format(new Date(), 'yyyy-MM-dd')
        const logsToInsert = workout.exercises
            .filter(ex => ex.sets_completed > 0)
            .map(ex => ({
                athlete_id: athleteId,
                workout_id: workout.workout_id,
                exercise_id: ex.exercise_id,
                date: today,
                sets_completed: ex.sets_completed,
                reps_completed: ex.reps_completed,
                weight_achieved: ex.weight_achieved || null,
                rpe_actual: ex.rpe_actual || null,
                estimated_1rm: ex.estimated_1rm,
                notes: ex.notes || null,
                completed: true,
            }))

        // 1. Insert workout logs
        if (logsToInsert.length > 0) {
            await supabase.from('workout_logs').insert(logsToInsert as never[])
        }

        // 2. Insert new PRs
        const newPRs = workout.exercises.filter(ex => ex.is_new_pr && ex.exercise_id && ex.estimated_1rm)
        for (const pr of newPRs) {
            await supabase.from('personal_records').insert({
                athlete_id: athleteId,
                exercise_id: pr.exercise_id,
                weight: pr.weight_achieved,
                estimated_1rm: pr.estimated_1rm,
                date: today,
                is_pr: true,
            } as never)
        }

        // 3. Mark assignment as completed
        if (workout.assignment_id) {
            await supabase.from('workout_assignments')
                .update({ completed: true, completed_at: new Date().toISOString() } as never)
                .eq('id', workout.assignment_id)
        }

        setSaving(false)
        setSaved(true)
    }

    // Success screen
    if (saved) {
        const prCount = workout?.exercises.filter(e => e.is_new_pr).length ?? 0
        return (
            <AppShell title="Workout Complete">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#C8F000]/15 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-[#C8F000]" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-white mb-2">Workout Complete!</h2>
                    <p className="text-white/50 text-sm mb-1">{workout?.workout_name}</p>
                    {prCount > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 mb-6">
                            <Trophy className="w-4 h-4 text-[#C8F000]" />
                            <span className="text-[#C8F000] text-sm font-medium">
                                {prCount} new PR{prCount !== 1 ? 's' : ''} set!
                            </span>
                        </div>
                    )}
                    <button onClick={() => navigate('/athlete/dashboard')}
                        className="mt-4 px-6 py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </AppShell>
        )
    }

    // Loading
    if (loading) {
        return (
            <AppShell title="Log Workout">
                <div className="space-y-4 animate-pulse">
                    <div className="h-16 bg-[#1A1A1A] rounded-2xl" />
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#1A1A1A] rounded-2xl" />)}
                </div>
            </AppShell>
        )
    }

    // No workout param — empty state
    if (!workout) {
        return (
            <AppShell title="Log Workout">
                <div className="text-center py-16">
                    <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <h3 className="font-heading font-bold text-white mb-2">No Workout Selected</h3>
                    <p className="text-white/40 text-sm mb-4">Go to your dashboard to start a workout.</p>
                    <button onClick={() => navigate('/athlete/dashboard')}
                        className="px-5 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm">
                        Go to Dashboard
                    </button>
                </div>
            </AppShell>
        )
    }

    const loggedCount = workout.exercises.filter(e => e.sets_completed > 0 && e.weight_achieved > 0).length

    return (
        <AppShell title="Log Workout">
            {/* Header */}
            <div className="mb-5">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-white/40 text-xs hover:text-white/60 transition-colors mb-3">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-heading font-bold text-white">{workout.workout_name}</h1>
                        <p className="text-white/40 text-sm mt-0.5">
                            {athleteName} · {format(new Date(), 'MMM d, yyyy')}
                        </p>
                    </div>
                    <Badge variant={loggedCount === workout.exercises.length ? 'success' : 'default'}>
                        {loggedCount}/{workout.exercises.length}
                    </Badge>
                </div>
                {workout.description && (
                    <p className="text-white/30 text-xs mt-2">{workout.description}</p>
                )}
            </div>

            {/* Exercise list */}
            <div className="space-y-3 mb-6">
                {workout.exercises.map((ex, idx) => {
                    const isExpanded = expandedIdx === idx
                    const hasData = ex.sets_completed > 0 && ex.weight_achieved > 0

                    return (
                        <div key={idx}
                            className={cn(
                                'bg-[#1A1A1A] border rounded-2xl overflow-hidden transition-colors',
                                ex.is_new_pr ? 'border-[#C8F000]/30' : hasData ? 'border-[#C8F000]/10' : 'border-[#2A2A2A]'
                            )}>
                            {/* Header */}
                            <button
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#2A2A2A]/20 transition-colors"
                            >
                                <span className="w-7 h-7 rounded-full bg-[#C8F000]/10 text-[#C8F000] text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm">{ex.exercise_name}</p>
                                    <p className="text-white/40 text-xs">
                                        Target: {ex.target_sets ?? '--'} x {ex.target_reps ?? '--'}
                                        {ex.target_weight ? ` @ ${ex.target_weight} lbs` : ''}
                                        {ex.target_rpe ? ` · RPE ${ex.target_rpe}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {hasData && <Badge variant="success">Logged</Badge>}
                                    {ex.is_new_pr && <Badge variant="success">PR!</Badge>}
                                    {isExpanded
                                        ? <ChevronUp className="w-4 h-4 text-white/30" />
                                        : <ChevronDown className="w-4 h-4 text-white/30" />}
                                </div>
                            </button>

                            {/* Expanded input form */}
                            {isExpanded && (
                                <div className="border-t border-[#2A2A2A] p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-white/50 text-xs mb-1 block">Sets</label>
                                            <input type="number" min={0} value={ex.sets_completed}
                                                onChange={e => updateExercise(idx, 'sets_completed', Math.max(0, +e.target.value))}
                                                className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="text-white/50 text-xs mb-1 block">Reps</label>
                                            <input type="number" min={0} value={ex.reps_completed}
                                                onChange={e => updateExercise(idx, 'reps_completed', Math.max(0, +e.target.value))}
                                                className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-white/50 text-xs mb-1 block">Weight (lbs)</label>
                                            <input type="number" min={0} value={ex.weight_achieved}
                                                onChange={e => updateExercise(idx, 'weight_achieved', Math.max(0, +e.target.value))}
                                                className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="text-white/50 text-xs mb-1 block">RPE (1-10)</label>
                                            <input type="number" min={1} max={10} value={ex.rpe_actual}
                                                onChange={e => updateExercise(idx, 'rpe_actual', Math.min(10, Math.max(1, +e.target.value)))}
                                                className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-xs mb-1 block">Notes</label>
                                        <input type="text" value={ex.notes}
                                            onChange={e => updateExercise(idx, 'notes', e.target.value)}
                                            placeholder="Optional notes..."
                                            className={inputCls} />
                                    </div>

                                    {/* Computed 1RM */}
                                    {ex.estimated_1rm !== null && ex.estimated_1rm > 0 && (
                                        <div className={cn(
                                            'flex items-center gap-2 rounded-xl px-3 py-2',
                                            ex.is_new_pr
                                                ? 'bg-[#C8F000]/10 border border-[#C8F000]/20'
                                                : 'bg-[#2A2A2A]/50'
                                        )}>
                                            <Trophy className={cn('w-4 h-4', ex.is_new_pr ? 'text-[#C8F000]' : 'text-white/30')} />
                                            <span className="text-white/70 text-xs">
                                                Est. 1RM: <span className={cn('font-bold', ex.is_new_pr ? 'text-[#C8F000]' : 'text-white')}>{ex.estimated_1rm} lbs</span>
                                                {ex.is_new_pr && <span className="text-[#C8F000] ml-1">NEW PR!</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Complete button */}
            <button
                onClick={() => void handleSave()}
                disabled={saving || loggedCount === 0}
                className="w-full py-3.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {saving ? (
                    <>
                        <span className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Workout ({loggedCount}/{workout.exercises.length})
                    </>
                )}
            </button>
        </AppShell>
    )
}
