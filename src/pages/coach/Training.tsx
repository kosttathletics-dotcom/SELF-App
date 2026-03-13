import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Library, Dumbbell, ChevronDown, LayoutTemplate, Trash2, Copy } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type MainTab = 'exercises' | 'workouts' | 'templates'

const CATEGORIES = ['All', 'Strength', 'Power', 'Conditioning', 'Mobility', 'Sport-Specific']
const TEMPLATE_CATEGORIES = ['Strength', 'Speed', 'Conditioning', 'Power', 'Mobility', 'Sport-Specific']
const PROGRESSION_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite']

interface Exercise {
    id: string
    name: string
    category: string | null
    progression_level: string | null
    video_url: string | null
    notes: string | null
    coach_id: string | null
}

interface ExerciseFormState {
    name: string
    category: string
    progression_level: string
    notes: string
}

interface WorkoutFormState {
    name: string
    date: string
    description: string
    exercises: { exercise_id: string; sets: number; reps: string; target_weight: string; notes: string }[]
}

interface TemplateRow {
    id: string
    name: string
    description: string | null
    notes: string | null
    created_at: string
}

interface TemplateExRow {
    exercise_id: string
    sets: number | null
    reps: number | null
    target_weight: number | null
    order_index: number
    notes: string | null
    exercises: { name: string } | null
}

interface Athlete { id: string; name: string }

export default function TrainingPage() {
    const { user } = useAuth()
    const [tab, setTab] = useState<MainTab>('exercises')
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('All')
    const [showAddExercise, setShowAddExercise] = useState(false)
    const [showAddWorkout, setShowAddWorkout] = useState(false)
    const [showAddTemplate, setShowAddTemplate] = useState(false)
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [workouts, setWorkouts] = useState<{ id: string; name: string; date: string; description: string | null }[]>([])
    const [templates, setTemplates] = useState<TemplateRow[]>([])

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
            .eq('is_template', false)
            .order('date', { ascending: false })
            .limit(20)
        setWorkouts((data ?? []) as unknown as typeof workouts)
    }, [user])

    const loadTemplates = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('workouts')
            .select('id, name, description, notes, created_at')
            .eq('coach_id', user.id)
            .eq('is_template', true)
            .order('created_at', { ascending: false })
        setTemplates((data ?? []) as unknown as TemplateRow[])
    }, [user])

    const loadAthletes = useCallback(async () => {
        if (!user) return
        const { data } = await supabase.from('athletes').select('id, name').eq('coach_id', user.id).order('name')
        setAthletes((data ?? []) as unknown as Athlete[])
    }, [user])

    useEffect(() => {
        void Promise.all([loadExercises(), loadWorkouts(), loadTemplates(), loadAthletes()])
    }, [loadExercises, loadWorkouts, loadTemplates, loadAthletes])

    const filteredExercises = exercises.filter(ex => {
        const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCategory === 'All' || ex.category === filterCategory
        return matchSearch && matchCat
    })

    const handleAddClick = () => {
        if (tab === 'exercises') setShowAddExercise(true)
        else if (tab === 'workouts') setShowAddWorkout(true)
        else setShowAddTemplate(true)
    }

    const addButtonLabel = tab === 'exercises' ? 'Add Exercise' : tab === 'workouts' ? 'New Workout' : 'New Template'

    const tabs: { id: MainTab; label: string; icon: typeof Dumbbell }[] = [
        { id: 'exercises', label: 'Exercise Library', icon: Library },
        { id: 'workouts', label: 'Workouts', icon: Dumbbell },
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    ]

    return (
        <AppShell title="Training Center">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Training Center</h1>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    {addButtonLabel}
                </button>
            </div>

            {/* Main tabs */}
            <div className="flex gap-1 mb-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                            tab === t.id ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50 hover:text-white')}>
                        <t.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.label}</span>
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
                            {CATEGORIES.map(c => (
                                <button key={c} onClick={() => setFilterCategory(c)}
                                    className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                        filterCategory === c ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
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
                                        {ex.progression_level && (
                                            <span className="flex-shrink-0 text-[10px] bg-[#C8F000]/15 text-[#C8F000] px-1.5 py-0.5 rounded-full">{ex.progression_level}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {ex.category && <span className="text-white/40 text-xs">{ex.category}</span>}
                                    </div>
                                    {ex.notes && <p className="text-white/30 text-xs mt-2 line-clamp-2">{ex.notes}</p>}
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

            {tab === 'templates' && (
                <TemplatesTab
                    templates={templates}
                    onRefresh={loadTemplates}
                    exercises={exercises}
                    coachId={user?.id ?? ''}
                    showAdd={showAddTemplate}
                    setShowAdd={setShowAddTemplate}
                />
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

/* ─── Templates Tab ─── */
function TemplatesTab({ templates, onRefresh, exercises, coachId, showAdd, setShowAdd }: {
    templates: TemplateRow[]
    onRefresh: () => void
    exercises: Exercise[]
    coachId: string
    showAdd: boolean
    setShowAdd: (v: boolean) => void
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [expandedExercises, setExpandedExercises] = useState<TemplateExRow[]>([])
    const [loadingExpand, setLoadingExpand] = useState(false)

    const toggleExpand = async (templateId: string) => {
        if (expandedId === templateId) {
            setExpandedId(null)
            return
        }
        setLoadingExpand(true)
        setExpandedId(templateId)
        const { data } = await supabase
            .from('workout_exercises')
            .select('exercise_id, sets, reps, target_weight, order_index, notes, exercises(name)')
            .eq('workout_id', templateId)
            .order('order_index')
        setExpandedExercises((data ?? []) as unknown as TemplateExRow[])
        setLoadingExpand(false)
    }

    const deleteTemplate = async (id: string) => {
        await supabase.from('workout_exercises').delete().eq('workout_id', id)
        await supabase.from('workouts').delete().eq('id', id)
        onRefresh()
    }

    const categoryColor: Record<string, string> = {
        Strength: 'success', Speed: 'info', Conditioning: 'warning', Power: 'success', Mobility: 'default',
    }

    if (templates.length === 0 && !showAdd) {
        return (
            <EmptyState icon={LayoutTemplate} title="No templates yet"
                description="Create reusable workout templates to quickly assign to athletes"
                action={
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] transition-all">
                        <Plus className="w-4 h-4" />Create Template
                    </button>
                }
            />
        )
    }

    return (
        <div className="space-y-3">
            {showAdd && (
                <TemplateFormModal
                    exercises={exercises}
                    coachId={coachId}
                    onClose={() => setShowAdd(false)}
                    onSaved={() => { setShowAdd(false); onRefresh() }}
                />
            )}

            <div className="space-y-3">
                {templates.map(t => {
                    const category = t.description ?? 'Strength'
                    const isExpanded = expandedId === t.id
                    return (
                        <div key={t.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#C8F000]/20 transition-colors">
                            <button
                                type="button"
                                onClick={() => void toggleExpand(t.id)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#C8F000]/10 flex items-center justify-center flex-shrink-0">
                                        <LayoutTemplate className="w-5 h-5 text-[#C8F000]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-heading font-semibold text-white text-sm truncate">{t.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant={(categoryColor[category] ?? 'default') as 'success' | 'warning' | 'info' | 'default' | 'error'}>
                                                {category}
                                            </Badge>
                                            {t.notes && <span className="text-white/30 text-xs truncate">{t.notes}</span>}
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown className={cn('w-4 h-4 text-white/30 flex-shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                            </button>

                            {isExpanded && (
                                <div className="border-t border-[#2A2A2A]">
                                    {loadingExpand ? (
                                        <div className="px-5 py-4 space-y-2">
                                            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-[#2A2A2A] rounded-lg animate-pulse" />)}
                                        </div>
                                    ) : expandedExercises.length === 0 ? (
                                        <p className="text-white/30 text-sm px-5 py-4">No exercises in this template.</p>
                                    ) : (
                                        <div className="px-5 py-3 space-y-1">
                                            {expandedExercises.map((ex, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[#C8F000] text-xs font-mono w-5">{i + 1}.</span>
                                                        <span className="text-white text-sm">{(ex.exercises as unknown as { name: string } | null)?.name ?? 'Exercise'}</span>
                                                    </div>
                                                    <span className="text-white/40 text-xs">
                                                        {[
                                                            ex.sets && `${ex.sets} sets`,
                                                            ex.reps && `${ex.reps} reps`,
                                                            ex.target_weight && `${ex.target_weight} lbs`,
                                                        ].filter(Boolean).join(' × ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 px-5 py-3 border-t border-[#2A2A2A]">
                                        <button
                                            onClick={() => void deleteTemplate(t.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#FF4444] hover:bg-[#FF4444]/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ─── Template Form Modal ─── */
function TemplateFormModal({ exercises, coachId, onClose, onSaved }: {
    exercises: Exercise[]
    coachId: string
    onClose: () => void
    onSaved: () => void
}) {
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Strength')
    const [notes, setNotes] = useState('')
    const [templateExercises, setTemplateExercises] = useState<{ exercise_id: string; sets: number; reps: string; target_weight: string; notes: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [showExPicker, setShowExPicker] = useState(false)
    const [exerciseSearch, setExerciseSearch] = useState('')

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    const addExercise = (ex: Exercise) => {
        setTemplateExercises(prev => [...prev, { exercise_id: ex.id, sets: 3, reps: '8', target_weight: '', notes: '' }])
        setShowExPicker(false)
        setExerciseSearch('')
    }

    const updateEx = (i: number, key: string, value: string | number) => {
        setTemplateExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: value } : e))
    }

    const removeEx = (i: number) => setTemplateExercises(prev => prev.filter((_, idx) => idx !== i))

    const moveEx = (from: number, to: number) => {
        if (to < 0 || to >= templateExercises.length) return
        setTemplateExercises(prev => {
            const arr = [...prev]
            const [item] = arr.splice(from, 1)
            arr.splice(to, 0, item)
            return arr
        })
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || templateExercises.length === 0) return
        setSaving(true)

        // Create the workout as a template
        const { data: workout } = await supabase.from('workouts').insert({
            name,
            description: category,
            notes: notes || null,
            coach_id: coachId,
            is_template: true,
        } as never).select('id').single()

        if (workout) {
            const wId = (workout as unknown as { id: string }).id
            await supabase.from('workout_exercises').insert(
                templateExercises.map((ex, idx) => ({
                    workout_id: wId,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: parseInt(ex.reps) || null,
                    target_weight: ex.target_weight ? parseFloat(ex.target_weight) : null,
                    order_index: idx,
                    notes: ex.notes || null,
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
                    <h2 className="font-heading font-bold text-white">Create Workout Template</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">×</button>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                        {/* Name + Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Template Name *</label>
                                <input className={inputCls} required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Upper Body Strength" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Category</label>
                                <select className={cn(inputCls, 'cursor-pointer')} value={category} onChange={e => setCategory(e.target.value)}>
                                    {TEMPLATE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1">Notes (optional)</label>
                            <textarea className={cn(inputCls, 'resize-none')} rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Template description, coaching cues..." />
                        </div>

                        {/* Exercises */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-white/50">Exercises ({templateExercises.length})</label>
                                <button type="button" onClick={() => setShowExPicker(v => !v)}
                                    className="flex items-center gap-1.5 text-xs text-[#C8F000] hover:text-[#d4f520]">
                                    <Plus className="w-3.5 h-3.5" />Add Exercise
                                </button>
                            </div>

                            {showExPicker && (
                                <div className="mb-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl overflow-hidden">
                                    <div className="p-2 border-b border-[#2A2A2A]">
                                        <input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                                            placeholder="Search exercises..." className="w-full bg-transparent text-white text-sm placeholder-white/30 focus:outline-none px-2 py-1" autoFocus />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto divide-y divide-[#2A2A2A]">
                                        {filteredEx.slice(0, 20).map(ex => (
                                            <button type="button" key={ex.id} onClick={() => addExercise(ex)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1A1A1A] transition-colors">
                                                <span className="font-medium">{ex.name}</span>
                                                <span className="text-white/30 ml-2 text-xs">{ex.category}</span>
                                            </button>
                                        ))}
                                        {filteredEx.length === 0 && <p className="text-white/30 text-sm px-4 py-3">No exercises found — add exercises in the Exercise Library tab first</p>}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {templateExercises.map((ex, i) => {
                                    const exercise = exercises.find(e => e.id === ex.exercise_id)
                                    return (
                                        <div key={i} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[#C8F000] text-xs font-mono">{i + 1}.</span>
                                                    <span className="text-white text-sm font-medium">{exercise?.name ?? 'Exercise'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => moveEx(i, i - 1)} disabled={i === 0}
                                                        className="text-white/20 hover:text-white/60 disabled:opacity-30 text-xs px-1">↑</button>
                                                    <button type="button" onClick={() => moveEx(i, i + 1)} disabled={i === templateExercises.length - 1}
                                                        className="text-white/20 hover:text-white/60 disabled:opacity-30 text-xs px-1">↓</button>
                                                    <button type="button" onClick={() => removeEx(i)} className="text-white/30 hover:text-[#FF4444] text-xs transition-colors ml-2">Remove</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { label: 'Sets', key: 'sets', type: 'number', value: ex.sets },
                                                    { label: 'Reps', key: 'reps', type: 'text', value: ex.reps },
                                                    { label: 'Weight (lbs)', key: 'target_weight', type: 'text', value: ex.target_weight },
                                                ].map(({ label, key, type, value }) => (
                                                    <div key={key}>
                                                        <label className="block text-[10px] text-white/30 mb-1">{label}</label>
                                                        <input type={type} value={value} onChange={e => updateEx(i, key, e.target.value)}
                                                            className="w-full px-2 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#C8F000] transition-colors"
                                                            placeholder={key === 'target_weight' ? 'Optional' : ''} />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className="block text-[10px] text-white/30 mb-1">Notes</label>
                                                    <input value={ex.notes} onChange={e => updateEx(i, 'notes', e.target.value)} placeholder="Optional"
                                                        className="w-full px-2 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#C8F000] transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {templateExercises.length === 0 && !showExPicker && (
                                <button type="button" onClick={() => setShowExPicker(true)}
                                    className="w-full text-white/30 text-sm text-center py-6 border border-dashed border-[#2A2A2A] rounded-xl hover:border-[#C8F000]/30 hover:text-white/50 transition-colors">
                                    + Add exercises to this template
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-[#2A2A2A] flex-shrink-0">
                        <button type="submit" disabled={saving || !name || templateExercises.length === 0}
                            className="w-full py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-[#d4f520] active:scale-[0.98] transition-all">
                            {saving ? 'Saving...' : `Save Template (${templateExercises.length} exercises)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
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
                            {w.date && <p className="text-white/40 text-xs mt-0.5">{format(new Date(w.date), 'EEEE, MMM d, yyyy')}</p>}
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
    const [form, setForm] = useState<ExerciseFormState>({ name: '', category: 'Strength', progression_level: '', notes: '' })
    const [saving, setSaving] = useState(false)
    const set = (k: keyof ExerciseFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        await supabase.from('exercises').insert({
            name: form.name,
            category: form.category || null,
            progression_level: form.progression_level || null,
            notes: form.notes || null,
            coach_id: coachId,
        } as never)
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
                        <div><label className="block text-xs text-white/50 mb-1">Progression Level</label>
                            <select className={inputCls} value={form.progression_level} onChange={e => set('progression_level', e.target.value)}>
                                <option value="">Select</option>
                                {PROGRESSION_LEVELS.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-xs text-white/50 mb-1">Notes (optional)</label>
                        <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Form cues, notes..." />
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
            exercises: [...f.exercises, { exercise_id: ex.id, sets: 3, reps: '8', target_weight: '', notes: '' }],
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
                    sets: ex.sets, reps: parseInt(ex.reps) || null,
                    target_weight: ex.target_weight ? parseFloat(ex.target_weight) : null,
                    order_index: idx, notes: ex.notes || null,
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
                                                <span className="text-white/30 ml-2 text-xs">{ex.category ?? ex.progression_level}</span>
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
                                                    { label: 'Weight', key: 'target_weight', type: 'text', value: ex.target_weight },
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
