import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Library, Dumbbell, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/shared/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type MainTab = 'exercises' | 'workouts' | 'templates'

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Glutes', 'Full Body', 'Cardio']
const CATEGORIES = ['All', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Plyometric']

interface Exercise {
    id: string
    name: string
    category: string
    muscle_group: string | null
    description: string | null
    is_custom: boolean
    coach_id: string | null
}

interface ExerciseFormState {
    name: string
    category: string
    muscle_group: string
    description: string
}

interface WorkoutFormState {
    name: string
    date: string
    description: string
    exercises: { exercise_id: string; sets: number; reps: string; rest: string; notes: string }[]
}

interface Athlete { id: string; name: string }

export default function TrainingPage() {
    const { user } = useAuth()
    const [tab, setTab] = useState<MainTab>('exercises')
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterMuscle, setFilterMuscle] = useState('All')
    const [filterCategory, setFilterCategory] = useState('All')
    const [showAddExercise, setShowAddExercise] = useState(false)
    const [showAddWorkout, setShowAddWorkout] = useState(false)
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [workouts, setWorkouts] = useState<{ id: string; name: string; date: string; description: string | null }[]>([])

    const loadExercises = useCallback(async () => {
        const { data } = await supabase
            .from('exercises')
            .select('*')
            .order('name')
        setExercises((data ?? []) as unknown as Exercise[])
        setLoading(false)
    }, [])

    const loadWorkouts = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('workouts')
            .select('id, name, date, description')
            .eq('coach_id', user.id)
            .order('date', { ascending: false })
            .limit(20)
        setWorkouts((data ?? []) as unknown as typeof workouts)
    }, [user])

    const loadAthletes = useCallback(async () => {
        if (!user) return
        const { data } = await supabase.from('athletes').select('id, name').eq('coach_id', user.id).order('name')
        setAthletes((data ?? []) as unknown as Athlete[])
    }, [user])

    useEffect(() => {
        void Promise.all([loadExercises(), loadWorkouts(), loadAthletes()])
    }, [loadExercises, loadWorkouts, loadAthletes])

    const filteredExercises = exercises.filter(ex => {
        const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
            (ex.muscle_group ?? '').toLowerCase().includes(search.toLowerCase())
        const matchMuscle = filterMuscle === 'All' || ex.muscle_group === filterMuscle
        const matchCat = filterCategory === 'All' || ex.category === filterCategory
        return matchSearch && matchMuscle && matchCat
    })

    const tabs: { id: MainTab; label: string; icon: typeof Dumbbell }[] = [
        { id: 'exercises', label: 'Exercise Library', icon: Library },
        { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    ]

    return (
        <AppShell title="Training Center">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Training Center</h1>
                <button
                    onClick={() => tab === 'exercises' ? setShowAddExercise(true) : setShowAddWorkout(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    {tab === 'exercises' ? 'Add Exercise' : 'New Workout'}
                </button>
            </div>

            {/* Main tabs */}
            <div className="flex gap-1 mb-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                            tab === t.id ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50 hover:text-white')}>
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'exercises' && (
                <>
                    {/* Search + filters */}
                    <div className="space-y-3 mb-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..."
                                className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none">
                            {MUSCLE_GROUPS.map(m => (
                                <button key={m} onClick={() => setFilterMuscle(m)}
                                    className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                        filterMuscle === m ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none">
                            {CATEGORIES.map(c => (
                                <button key={c} onClick={() => setFilterCategory(c)}
                                    className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                        filterCategory === c ? 'bg-[#C8F000]/20 text-[#C8F000] border border-[#C8F000]/30' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-xl animate-pulse" />)}
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <EmptyState icon={Dumbbell} title="No exercises found"
                            description="Add exercises to the library or adjust your filters"
                            action={
                                <button onClick={() => setShowAddExercise(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] transition-all">
                                    <Plus className="w-4 h-4" />Add Exercise
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredExercises.map(ex => (
                                <div key={ex.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 hover:border-[#C8F000]/30 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-heading font-semibold text-white text-sm">{ex.name}</h3>
                                        {ex.is_custom && (
                                            <span className="flex-shrink-0 text-[10px] bg-[#C8F000]/15 text-[#C8F000] px-1.5 py-0.5 rounded-full">Custom</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {ex.muscle_group && <span className="text-white/40 text-xs">{ex.muscle_group}</span>}
                                        {ex.muscle_group && ex.category && <span className="text-white/20 text-xs">·</span>}
                                        <span className="text-white/40 text-xs">{ex.category}</span>
                                    </div>
                                    {ex.description && <p className="text-white/30 text-xs mt-2 line-clamp-2">{ex.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'workouts' && (
                <WorkoutsTab workouts={workouts} onRefresh={loadWorkouts} athletes={athletes}
                    showAddWorkout={showAddWorkout} setShowAddWorkout={setShowAddWorkout}
                    exercises={exercises} coachId={user?.id ?? ''} />
            )}

            {showAddExercise && (
                <ExerciseFormModal
                    onClose={() => setShowAddExercise(false)}
                    onSaved={() => { setShowAddExercise(false); void loadExercises() }}
                    coachId={user?.id ?? ''}
                />
            )}
        </AppShell>
    )
}

/* ─── Workouts Tab ─── */
function WorkoutsTab({ workouts, onRefresh, athletes, showAddWorkout, setShowAddWorkout, exercises, coachId }: {
    workouts: { id: string; name: string; date: string; description: string | null }[]
    onRefresh: () => void
    athletes: Athlete[]
    showAddWorkout: boolean
    setShowAddWorkout: (v: boolean) => void
    exercises: Exercise[]
    coachId: string
}) {
    if (workouts.length === 0 && !showAddWorkout) {
        return (
            <EmptyState icon={Dumbbell} title="No workouts yet"
                description="Create your first workout to assign to athletes"
                action={
                    <button onClick={() => setShowAddWorkout(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] transition-all">
                        <Plus className="w-4 h-4" />Create Workout
                    </button>
                }
            />
        )
    }

    return (
        <div className="space-y-3">
            {showAddWorkout && (
                <WorkoutFormModal
                    exercises={exercises}
                    athletes={athletes}
                    coachId={coachId}
                    onClose={() => setShowAddWorkout(false)}
                    onSaved={() => { setShowAddWorkout(false); onRefresh() }}
                />
            )}
            <div className="divide-y divide-[#2A2A2A] bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                {workouts.map(w => (
                    <div key={w.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#2A2A2A]/30 transition-colors">
                        <div>
                            <p className="font-heading font-semibold text-white text-sm">{w.name}</p>
                            <p className="text-white/40 text-xs mt-0.5">{format(new Date(w.date), 'EEEE, MMM d, yyyy')}</p>
                            {w.description && <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{w.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ─── Exercise Form Modal ─── */
function ExerciseFormModal({ onClose, onSaved, coachId }: { onClose: () => void; onSaved: () => void; coachId: string }) {
    const [form, setForm] = useState<ExerciseFormState>({ name: '', category: 'Barbell', muscle_group: '', description: '' })
    const [saving, setSaving] = useState(false)
    const set = (k: keyof ExerciseFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        await supabase.from('exercises').insert({ ...form, is_custom: true, coach_id: coachId } as never)
        onSaved()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
                    <h2 className="font-heading font-bold text-white">Add Exercise</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">×</button>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div><label className="block text-xs text-white/50 mb-1">Name *</label>
                        <input className={inputCls} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Romanian Deadlift" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-white/50 mb-1">Category</label>
                            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-xs text-white/50 mb-1">Muscle Group</label>
                            <select className={inputCls} value={form.muscle_group} onChange={e => set('muscle_group', e.target.value)}>
                                <option value="">Select</option>
                                {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs text-white/50 mb-1">Description (optional)</label>
                        <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Form cues, notes..." />
                    </div>
                    <button type="submit" disabled={saving || !form.name}
                        className="w-full py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-[#d4f520] transition-all">
                        {saving ? 'Saving...' : 'Add to Library'}
                    </button>
                </form>
            </div>
        </div>
    )
}

/* ─── Workout Builder Modal ─── */
function WorkoutFormModal({ exercises, athletes, coachId, onClose, onSaved }: {
    exercises: Exercise[]
    athletes: Athlete[]
    coachId: string
    onClose: () => void
    onSaved: () => void
}) {
    const [form, setForm] = useState<WorkoutFormState>({
        name: '', date: format(new Date(), 'yyyy-MM-dd'), description: '',
        exercises: [],
    })
    const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [showExPicker, setShowExPicker] = useState(false)

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    const addExercise = (ex: Exercise) => {
        setForm(f => ({
            ...f,
            exercises: [...f.exercises, { exercise_id: ex.id, sets: 3, reps: '8', rest: '90', notes: '' }],
        }))
        setShowExPicker(false)
    }

    const updateEx = (i: number, key: string, value: string | number) => {
        setForm(f => ({
            ...f,
            exercises: f.exercises.map((e, idx) => idx === i ? { ...e, [key]: value } : e),
        }))
    }

    const removeEx = (i: number) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }))

    const toggleAthlete = (id: string) =>
        setSelectedAthletes(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || form.exercises.length === 0) return
        setSaving(true)

        const { data: workout } = await supabase.from('workouts').insert({
            name: form.name, date: form.date, description: form.description || null,
            coach_id: coachId, assigned_to: selectedAthletes,
        } as never).select('id').single()

        if (workout) {
            const wId = (workout as unknown as { id: string }).id
            await supabase.from('workout_exercises').insert(
                form.exercises.map((ex, idx) => ({
                    workout_id: wId, exercise_id: ex.exercise_id,
                    sets: ex.sets, reps: ex.reps, rest: parseInt(ex.rest),
                    order: idx + 1, notes: ex.notes || null,
                })) as never
            )
        }

        onSaved()
    }

    const filteredEx = exercises.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] flex-shrink-0">
                    <h2 className="font-heading font-bold text-white">Create Workout</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">×</button>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Workout Name *</label>
                                <input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monday Upper Body" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Date</label>
                                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1">Description (optional)</label>
                            <textarea className={cn(inputCls, 'resize-none')} rows={2} value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Workout focus, intensity, notes..." />
                        </div>

                        {/* Assign Athletes */}
                        {athletes.length > 0 && (
                            <div>
                                <label className="block text-xs text-white/50 mb-2">Assign to Athletes</label>
                                <div className="flex flex-wrap gap-2">
                                    {athletes.map(a => (
                                        <button type="button" key={a.id} onClick={() => toggleAthlete(a.id)}
                                            className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                                selectedAthletes.includes(a.id) ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#0D0D0D] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
                                            {a.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Exercises */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-white/50">Exercises ({form.exercises.length})</label>
                                <button type="button" onClick={() => setShowExPicker(v => !v)}
                                    className="flex items-center gap-1.5 text-xs text-[#C8F000] hover:text-[#d4f520]">
                                    <Plus className="w-3.5 h-3.5" />Add Exercise
                                </button>
                            </div>

                            {showExPicker && (
                                <div className="mb-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl overflow-hidden">
                                    <div className="p-2 border-b border-[#2A2A2A]">
                                        <input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                                            placeholder="Search exercises..." className="w-full bg-transparent text-white text-sm placeholder-white/30 focus:outline-none px-2 py-1" />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto divide-y divide-[#2A2A2A]">
                                        {filteredEx.slice(0, 20).map(ex => (
                                            <button type="button" key={ex.id} onClick={() => addExercise(ex)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1A1A1A] transition-colors">
                                                <span className="font-medium">{ex.name}</span>
                                                <span className="text-white/30 ml-2 text-xs">{ex.muscle_group ?? ex.category}</span>
                                            </button>
                                        ))}
                                        {filteredEx.length === 0 && <p className="text-white/30 text-sm px-4 py-3">No exercises found</p>}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {form.exercises.map((ex, i) => {
                                    const exercise = exercises.find(e => e.id === ex.exercise_id)
                                    return (
                                        <div key={i} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white text-sm font-medium">{exercise?.name ?? 'Exercise'}</span>
                                                <button type="button" onClick={() => removeEx(i)} className="text-white/30 hover:text-[#FF4444] text-xs transition-colors">Remove</button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { label: 'Sets', key: 'sets', type: 'number', value: ex.sets },
                                                    { label: 'Reps', key: 'reps', type: 'text', value: ex.reps },
                                                    { label: 'Rest (s)', key: 'rest', type: 'text', value: ex.rest },
                                                ].map(({ label, key, type, value }) => (
                                                    <div key={key}>
                                                        <label className="block text-[10px] text-white/30 mb-1">{label}</label>
                                                        <input type={type} value={value} onChange={e => updateEx(i, key, e.target.value)}
                                                            className="w-full px-2 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#C8F000] transition-colors" />
                                                    </div>
                                                ))}
                                                <div className="col-span-1">
                                                    <label className="block text-[10px] text-white/30 mb-1 flex items-center gap-1">
                                                        Notes <ChevronDown className="w-2.5 h-2.5" />
                                                    </label>
                                                    <input value={ex.notes} onChange={e => updateEx(i, 'notes', e.target.value)} placeholder="Optional"
                                                        className="w-full px-2 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#C8F000] transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {form.exercises.length === 0 && !showExPicker && (
                                <p className="text-white/30 text-sm text-center py-4 border border-dashed border-[#2A2A2A] rounded-xl">
                                    Add exercises to build this workout
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-[#2A2A2A] flex-shrink-0">
                        <button type="submit" disabled={saving || !form.name || form.exercises.length === 0}
                            className="w-full py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-[#d4f520] active:scale-[0.98] transition-all">
                            {saving ? 'Saving...' : `Create Workout${selectedAthletes.length > 0 ? ` & Assign to ${selectedAthletes.length}` : ''}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
