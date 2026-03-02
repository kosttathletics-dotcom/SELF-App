import { useState, useEffect, useCallback } from 'react'
import { Plus, X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface Injury {
    id: string
    athlete_id: string
    athlete_name?: string
    type: string
    body_part: string | null
    severity: 'minor' | 'moderate' | 'severe'
    date: string
    return_date: string | null
    status: 'active' | 'recovering' | 'cleared'
    notes: string | null
}

interface AthleteOption { id: string; name: string }

const BODY_PARTS = ['Head/Neck', 'Shoulder', 'Elbow', 'Wrist/Hand', 'Back', 'Hip', 'Quad', 'Hamstring', 'Knee', 'Ankle', 'Foot', 'Groin', 'Calf', 'Other']
const INJURY_TYPES = ['Sprain', 'Strain', 'Fracture', 'Contusion', 'Concussion', 'Tear', 'Soreness', 'Other']
const SEVERITIES: { value: Injury['severity']; label: string; color: string }[] = [
    { value: 'minor', label: 'Minor', color: '#F4A261' },
    { value: 'moderate', label: 'Moderate', color: '#F97316' },
    { value: 'severe', label: 'Severe', color: '#FF4444' },
]

interface InjuryFormState {
    athlete_id: string
    type: string
    body_part: string
    severity: Injury['severity']
    date: string
    return_date: string
    notes: string
}

export default function InjuryLog() {
    const { user } = useAuth()
    const [injuries, setInjuries] = useState<Injury[]>([])
    const [athletes, setAthletes] = useState<AthleteOption[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'recovering' | 'cleared'>('active')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<InjuryFormState>({
        athlete_id: '', type: 'Sprain', body_part: 'Knee',
        severity: 'minor', date: format(new Date(), 'yyyy-MM-dd'),
        return_date: '', notes: ''
    })
    const [saving, setSaving] = useState(false)
    const set = (k: keyof InjuryFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

    const load = useCallback(async () => {
        if (!user) return
        const [injRes, athRes] = await Promise.all([
            supabase.from('injuries').select('*, athletes(name)')
                .eq('coach_id', user.id)
                .order('date', { ascending: false }),
            supabase.from('athletes').select('id, name').eq('coach_id', user.id).order('name'),
        ])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (injRes.data ?? []) as any[]
        setInjuries(raw.map(r => ({ ...r, athlete_name: r.athletes?.name ?? 'Unknown' } as Injury)))
        setAthletes((athRes.data ?? []) as unknown as AthleteOption[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const openEdit = (inj: Injury) => {
        setForm({
            athlete_id: inj.athlete_id, type: inj.type, body_part: inj.body_part ?? '',
            severity: inj.severity, date: inj.date, return_date: inj.return_date ?? '', notes: inj.notes ?? ''
        })
        setEditingId(inj.id)
        setShowForm(true)
    }

    const clearForm = () => { setForm({ athlete_id: '', type: 'Sprain', body_part: 'Knee', severity: 'minor', date: format(new Date(), 'yyyy-MM-dd'), return_date: '', notes: '' }); setEditingId(null); setShowForm(false) }

    const saveInjury = async () => {
        if (!user || !form.athlete_id) return
        setSaving(true)
        const payload = {
            ...form, coach_id: user.id,
            return_date: form.return_date || null, notes: form.notes || null,
            body_part: form.body_part || null, status: 'active',
        }
        if (editingId) {
            await supabase.from('injuries').update(payload as never).eq('id', editingId)
        } else {
            await supabase.from('injuries').insert(payload as never)
        }
        setSaving(false)
        clearForm()
        void load()
    }

    const updateStatus = async (id: string, status: Injury['status']) => {
        await supabase.from('injuries').update({ status } as never).eq('id', id)
        void load()
    }

    const deleteInjury = async (id: string) => {
        if (!confirm('Delete this injury record?')) return
        await supabase.from('injuries').delete().eq('id', id)
        void load()
    }

    const filtered = injuries.filter(i => filter === 'all' || i.status === filter)
    const activeCount = injuries.filter(i => i.status === 'active').length

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    return (
        <AppShell title="Injury Log">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Injury Log</h1>
                    {activeCount > 0 && (
                        <p className="text-[#FF4444] text-sm mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {activeCount} active {activeCount === 1 ? 'injury' : 'injuries'}
                        </p>
                    )}
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Log Injury
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-[#1A1A1A] border border-[#C8F000]/20 rounded-2xl p-5 mb-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-white">{editingId ? 'Edit Injury' : 'Log Injury'}</h3>
                        <button onClick={clearForm}><X className="w-4 h-4 text-white/40" /></button>
                    </div>

                    <div>
                        <label className="block text-xs text-white/50 mb-1">Athlete</label>
                        <select className={inputCls} value={form.athlete_id} onChange={e => set('athlete_id', e.target.value)}>
                            <option value="">Select athlete</option>
                            {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Injury Type</label>
                            <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                                {INJURY_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Body Part</label>
                            <select className={inputCls} value={form.body_part} onChange={e => set('body_part', e.target.value)}>
                                {BODY_PARTS.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-white/50 mb-2">Severity</label>
                        <div className="flex gap-2">
                            {SEVERITIES.map(s => (
                                <button type="button" key={s.value} onClick={() => set('severity', s.value)}
                                    className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                                        form.severity === s.value
                                            ? 'text-[#0D0D0D] border-transparent'
                                            : 'bg-[#0D0D0D] text-white/40 border-[#2A2A2A] hover:border-[#3A3A3A]')}
                                    style={form.severity === s.value ? { backgroundColor: s.color } : {}}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Date</label>
                            <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Est. Return Date</label>
                            <input type="date" className={inputCls} value={form.return_date} onChange={e => set('return_date', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-white/50 mb-1">Notes</label>
                        <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.notes}
                            onChange={e => set('notes', e.target.value)} placeholder="Mechanism of injury, treatment notes..." />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => void saveInjury()} disabled={saving || !form.athlete_id}
                            className="flex-1 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm disabled:opacity-50">
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Log Injury'}
                        </button>
                        <button onClick={clearForm} className="px-5 py-2.5 bg-[#2A2A2A] text-white/60 rounded-xl text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {(['active', 'recovering', 'cleared', 'all'] as const).map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                            filter === s ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {s} {s !== 'all' && `(${injuries.filter(i => i.status === s).length})`}
                    </button>
                ))}
            </div>

            {/* Injury List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-[#C8F000]/30 mx-auto mb-3" />
                    <p className="text-white font-heading font-semibold">
                        {filter === 'active' ? 'No active injuries 💪' : 'No injuries in this category'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(inj => {
                        const daysOut = inj.return_date ? differenceInDays(parseISO(inj.return_date), new Date()) : null
                        return (
                            <div key={inj.id} className={cn('bg-[#1A1A1A] border rounded-2xl p-4',
                                inj.status === 'active' ? 'border-[#FF4444]/20' : inj.status === 'recovering' ? 'border-[#F4A261]/20' : 'border-[#2A2A2A]')}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-heading font-bold text-white">{inj.athlete_name}</span>
                                            <Badge variant={inj.status === 'active' ? 'error' : inj.status === 'recovering' ? 'warning' : 'success'}>
                                                {inj.status}
                                            </Badge>
                                            <Badge variant={inj.severity === 'severe' ? 'error' : inj.severity === 'moderate' ? 'warning' : 'default'}>
                                                {inj.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-white/70 text-sm">{inj.type} — {inj.body_part ?? 'Unknown'}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/30">
                                            <span>Injured: {format(parseISO(inj.date), 'MMM d, yyyy')}</span>
                                            {inj.return_date && (
                                                <span className={cn(daysOut !== null && daysOut < 0 ? 'text-[#C8F000]' : 'text-[#F4A261]')}>
                                                    {daysOut !== null && daysOut < 0 ? '✓ Return date passed' : `Est. return: ${format(parseISO(inj.return_date), 'MMM d')}`}
                                                </span>
                                            )}
                                        </div>
                                        {inj.notes && <p className="text-white/30 text-xs mt-1.5 line-clamp-2">{inj.notes}</p>}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button onClick={() => openEdit(inj)} className="text-white/30 text-xs hover:text-white/60 transition-colors">Edit</button>
                                        <button onClick={() => void deleteInjury(inj.id)} className="text-[#FF4444]/30 text-xs hover:text-[#FF4444] transition-colors">Delete</button>
                                    </div>
                                </div>
                                {inj.status !== 'cleared' && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-[#2A2A2A]">
                                        {inj.status === 'active' && (
                                            <button onClick={() => void updateStatus(inj.id, 'recovering')}
                                                className="flex-1 py-1.5 text-xs font-medium bg-[#F4A261]/10 text-[#F4A261] border border-[#F4A261]/20 rounded-lg hover:bg-[#F4A261]/15 transition-colors">
                                                <Clock className="w-3 h-3 inline mr-1" />Mark Recovering
                                            </button>
                                        )}
                                        <button onClick={() => void updateStatus(inj.id, 'cleared')}
                                            className="flex-1 py-1.5 text-xs font-medium bg-[#C8F000]/10 text-[#C8F000] border border-[#C8F000]/20 rounded-lg hover:bg-[#C8F000]/15 transition-colors">
                                            <CheckCircle2 className="w-3 h-3 inline mr-1" />Mark Cleared
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </AppShell>
    )
}
