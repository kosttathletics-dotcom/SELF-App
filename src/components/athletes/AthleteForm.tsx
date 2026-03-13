import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Athlete } from '@/types/database'
import { cn } from '@/lib/utils'

const SPORTS = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball', 'Track', 'Wrestling', 'Swimming', 'Lacrosse', 'Other']

const POSITIONS: Record<string, string[]> = {
    Football: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P', 'LS', 'ATH'],
    Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
    Baseball: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
    Soccer: ['GK', 'CB', 'FB', 'MF', 'FW', 'CF'],
    Volleyball: ['Setter', 'Outside', 'Middle', 'Opposite', 'Libero'],
    Other: [],
}

// Generate graduation years: current year through +8
const currentYear = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => String(currentYear + i))

interface AthleteFormProps {
    athlete?: Athlete
    onClose: () => void
    onSaved: () => void
}

type FormData = {
    name: string
    sport: string
    position: string
    graduation_year: string
    height: string
    weight: string
    gpa: string
    status: string
    notes: string
    parent_name: string
    parent_email: string
    parent_phone: string
}

const defaultForm: FormData = {
    name: '',
    sport: 'Football',
    position: '',
    graduation_year: '',
    height: '',
    weight: '',
    gpa: '',
    status: 'active',
    notes: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
}

export function AthleteForm({ athlete, onClose, onSaved }: AthleteFormProps) {
    const { user } = useAuth()
    const [form, setForm] = useState<FormData>(defaultForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'info' | 'parent'>('info')

    useEffect(() => {
        if (athlete) {
            setForm({
                name: athlete.name ?? '',
                sport: athlete.sport ?? 'Football',
                position: athlete.position ?? '',
                graduation_year: athlete.graduation_year ?? '',
                height: athlete.height ?? '',
                weight: athlete.weight ?? '',
                gpa: athlete.gpa != null ? String(athlete.gpa) : '',
                status: athlete.status ?? 'active',
                notes: athlete.notes ?? '',
                parent_name: athlete.parent_name ?? '',
                parent_email: athlete.parent_email ?? '',
                parent_phone: athlete.parent_phone ?? '',
            })
        }
    }, [athlete])

    const positionOptions = POSITIONS[form.sport] ?? []

    const set = (key: keyof FormData, value: string) => setForm(f => ({ ...f, [key]: value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)
        setError(null)

        // Build the payload — only send non-empty strings, convert gpa to number
        const payload: Record<string, unknown> = {
            name: form.name,
            sport: form.sport || null,
            position: form.position || null,
            graduation_year: form.graduation_year || null,
            height: form.height || null,
            weight: form.weight || null,
            gpa: form.gpa ? parseFloat(form.gpa) : null,
            status: form.status,
            notes: form.notes || null,
            parent_name: form.parent_name || null,
            parent_email: form.parent_email || null,
            parent_phone: form.parent_phone || null,
            coach_id: user.id,
        }

        let err
        if (athlete) {
            const { error: e } = await supabase.from('athletes').update(payload as never).eq('id', athlete.id)
            err = e
        } else {
            const { error: e } = await supabase.from('athletes').insert(payload as never)
            err = e
        }

        if (err) { setError(err.message); setLoading(false); return }
        onSaved()
    }

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] focus:ring-1 focus:ring-[#C8F000] transition-colors text-sm'
    const labelCls = 'block text-xs font-medium text-white/50 mb-1'
    const selectCls = cn(inputCls, 'cursor-pointer')

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] flex-shrink-0">
                    <h2 className="font-heading font-bold text-white">{athlete ? 'Edit Athlete' : 'Add Athlete'}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors">
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#2A2A2A] flex-shrink-0">
                    {(['info', 'parent'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={cn('flex-1 py-2.5 text-sm font-medium transition-colors', tab === t ? 'text-[#C8F000] border-b-2 border-[#C8F000]' : 'text-white/40 hover:text-white/70')}>
                            {t === 'info' ? 'Athlete Info' : 'Parent / Guardian'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {tab === 'info' ? (
                            <>
                                {/* Name */}
                                <div>
                                    <label className={labelCls}>Full Name *</label>
                                    <input className={inputCls} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Marcus Johnson" />
                                </div>

                                {/* Sport + Position */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Sport</label>
                                        <select className={selectCls} value={form.sport} onChange={e => { set('sport', e.target.value); set('position', '') }}>
                                            <option value="">Select sport</option>
                                            {SPORTS.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Position</label>
                                        {positionOptions.length > 0 ? (
                                            <select className={selectCls} value={form.position} onChange={e => set('position', e.target.value)}>
                                                <option value="">Select position</option>
                                                {positionOptions.map(p => <option key={p}>{p}</option>)}
                                            </select>
                                        ) : (
                                            <input className={inputCls} value={form.position} onChange={e => set('position', e.target.value)} placeholder="Enter position" />
                                        )}
                                    </div>
                                </div>

                                {/* Graduation Year + GPA */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Graduation Year</label>
                                        <select className={selectCls} value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)}>
                                            <option value="">Select year</option>
                                            {GRAD_YEARS.map(y => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>GPA</label>
                                        <input
                                            className={inputCls}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="5.0"
                                            value={form.gpa}
                                            onChange={e => set('gpa', e.target.value)}
                                            placeholder="3.50"
                                        />
                                    </div>
                                </div>

                                {/* Height + Weight */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Height (e.g. 6'2")</label>
                                        <input className={inputCls} value={form.height} onChange={e => set('height', e.target.value)} placeholder="6'2&quot;" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Weight (lbs)</label>
                                        <input className={inputCls} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="185" />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className={labelCls}>Status</label>
                                    <div className="flex gap-2">
                                        {(['active', 'inactive', 'injured'] as const).map(s => (
                                            <button type="button" key={s} onClick={() => set('status', s)}
                                                className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                                                    form.status === s
                                                        ? s === 'active' ? 'bg-[#C8F000]/15 text-[#C8F000] border border-[#C8F000]/30'
                                                            : s === 'injured' ? 'bg-[#FF4444]/15 text-[#FF4444] border border-[#FF4444]/30'
                                                                : 'bg-[#2A2A2A] text-white border border-[#3A3A3A]'
                                                        : 'bg-[#0D0D0D] text-white/40 border border-[#2A2A2A] hover:border-[#3A3A3A]')}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className={labelCls}>Notes</label>
                                    <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Coach notes about this athlete..." />
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-white/40 text-xs mb-2">Parent or guardian contact info. This will be visible on the athlete's profile.</p>

                                <div>
                                    <label className={labelCls}>Parent / Guardian Name</label>
                                    <input className={inputCls} value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Robert Johnson" />
                                </div>

                                <div>
                                    <label className={labelCls}>Parent Email</label>
                                    <input className={inputCls} type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="parent@email.com" />
                                </div>

                                <div>
                                    <label className={labelCls}>Parent Phone</label>
                                    <input className={inputCls} type="tel" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="(555) 123-4567" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-[#2A2A2A] flex-shrink-0 space-y-3">
                        {error && <p className="text-[#FF4444] text-xs bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-3 py-2">{error}</p>}
                        <button type="submit" disabled={loading || !form.name}
                            className="w-full py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50">
                            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />Saving...</span>
                                : athlete ? 'Save Changes' : 'Add Athlete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
