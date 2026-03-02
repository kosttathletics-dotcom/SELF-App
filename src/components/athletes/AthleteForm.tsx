import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Athlete } from '@/types/database'
import { cn } from '@/lib/utils'

const SPORTS = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball', 'Track', 'Wrestling', 'Swimming', 'Lacrosse', 'Other']
const GRADES = ['6th', '7th', '8th', '9th - Freshman', '10th - Sophomore', '11th - Junior', '12th - Senior']
const AGE_GROUPS = ['Middle School', 'JV', 'Varsity', 'College']
const POSITIONS: Record<string, string[]> = {
    Football: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P', 'LS'],
    Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
    Baseball: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
    Soccer: ['GK', 'CB', 'FB', 'MF', 'FW', 'CF'],
    Other: [],
}

interface AthleteFormProps {
    athlete?: Athlete
    onClose: () => void
    onSaved: () => void
}

type FormData = {
    name: string
    sport: string
    position: string
    grade: string
    age_group: string
    height: string
    weight: string
    status: string
    notes: string
    hudl_url: string
    instagram: string
    twitter: string
    tiktok: string
    recruiting_url: string
}

const defaultForm: FormData = {
    name: '', sport: '', position: '', grade: '', age_group: '',
    height: '', weight: '', status: 'active', notes: '',
    hudl_url: '', instagram: '', twitter: '', tiktok: '', recruiting_url: '',
}

export function AthleteForm({ athlete, onClose, onSaved }: AthleteFormProps) {
    const { user } = useAuth()
    const [form, setForm] = useState<FormData>(defaultForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'info' | 'digital'>('info')

    useEffect(() => {
        if (athlete) {
            setForm({
                name: athlete.name ?? '',
                sport: athlete.sport ?? '',
                position: athlete.position ?? '',
                grade: athlete.grade ?? '',
                age_group: athlete.age_group ?? '',
                height: athlete.height ?? '',
                weight: athlete.weight ?? '',
                status: athlete.status ?? 'active',
                notes: athlete.notes ?? '',
                hudl_url: athlete.hudl_url ?? '',
                instagram: athlete.instagram ?? '',
                twitter: athlete.twitter ?? '',
                tiktok: athlete.tiktok ?? '',
                recruiting_url: athlete.recruiting_url ?? '',
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

        const payload = { ...form, coach_id: user.id }

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
                    {(['info', 'digital'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={cn('flex-1 py-2.5 text-sm font-medium transition-colors', tab === t ? 'text-[#C8F000] border-b-2 border-[#C8F000]' : 'text-white/40 hover:text-white/70')}>
                            {t === 'info' ? 'Basic Info' : 'Digital Presence'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {tab === 'info' ? (
                            <>
                                {/* Photo upload placeholder */}
                                <div className="flex justify-center mb-2">
                                    <div className="w-20 h-20 rounded-full bg-[#0D0D0D] border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center cursor-pointer hover:border-[#C8F000]/50 transition-colors">
                                        <Upload className="w-5 h-5 text-white/30" />
                                        <span className="text-[10px] text-white/30 mt-1">Photo</span>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Full Name *</label>
                                    <input className={inputCls} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Marcus Johnson" />
                                </div>

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
                                        <select className={selectCls} value={form.position} onChange={e => set('position', e.target.value)}>
                                            <option value="">Select position</option>
                                            {positionOptions.length > 0
                                                ? positionOptions.map(p => <option key={p}>{p}</option>)
                                                : <option value={form.position}>{form.position || 'Custom'}</option>}
                                        </select>
                                        {positionOptions.length === 0 && (
                                            <input className={cn(inputCls, 'mt-1')} value={form.position} onChange={e => set('position', e.target.value)} placeholder="Enter position" />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Grade</label>
                                        <select className={selectCls} value={form.grade} onChange={e => set('grade', e.target.value)}>
                                            <option value="">Select grade</option>
                                            {GRADES.map(g => <option key={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Level</label>
                                        <select className={selectCls} value={form.age_group} onChange={e => set('age_group', e.target.value)}>
                                            <option value="">Select level</option>
                                            {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>

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

                                <div>
                                    <label className={labelCls}>Notes</label>
                                    <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Coach notes..." />
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-white/40 text-xs mb-2">These links appear on the athlete's recruiting profile and report.</p>
                                {[
                                    { key: 'hudl_url', label: 'HUDL URL', placeholder: 'https://hudl.com/profile/...' },
                                    { key: 'instagram', label: 'Instagram', placeholder: '@username' },
                                    { key: 'twitter', label: 'Twitter / X', placeholder: '@username' },
                                    { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
                                    { key: 'recruiting_url', label: 'Recruiting Profile URL', placeholder: 'https://247sports.com/...' },
                                ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                        <label className={labelCls}>{label}</label>
                                        <input className={inputCls} value={form[key as keyof FormData]} onChange={e => set(key as keyof FormData, e.target.value)} placeholder={placeholder} />
                                    </div>
                                ))}
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
