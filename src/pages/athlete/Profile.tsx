import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Save, Instagram, Twitter, Youtube, Link as LinkIcon, ExternalLink } from 'lucide-react'

interface AthleteProfile {
    id: string
    name: string
    photo_url: string | null
    sport: string | null
    position: string | null
    grade: string | null
    level: string | null
    height: string | null
    weight: number | null
    gpa: number | null
    hudl_url: string | null
    instagram: string | null
    twitter: string | null
    tiktok: string | null
    recruiting_url: string | null
    notes: string | null
    user_id: string | null
}

const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

export default function AthleteProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<AthleteProfile | null>(null)
    const [form, setForm] = useState<Partial<AthleteProfile>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [tab, setTab] = useState<'info' | 'social'>('info')

    const load = useCallback(async () => {
        if (!user) return
        const { data } = await supabase.from('athletes').select('*').eq('user_id', user.id).single()
        const p = data as unknown as AthleteProfile | null
        setProfile(p)
        setForm(p ?? {})
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const set = (k: keyof AthleteProfile, v: unknown) => setForm(f => ({ ...f, [k]: v }))

    const saveProfile = async () => {
        if (!profile) return
        setSaving(true)
        await supabase.from('athletes').update(form as never).eq('id', profile.id)
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        void load()
    }

    const handlePhotoUploaded = async (url: string) => {
        if (!profile) return
        set('photo_url', url)
        await supabase.from('athletes').update({ photo_url: url } as never).eq('id', profile.id)
    }

    if (loading) {
        return (
            <AppShell title="My Profile">
                <div className="space-y-4 animate-pulse">
                    <div className="h-32 bg-[#1A1A1A] rounded-2xl" />
                    <div className="h-64 bg-[#1A1A1A] rounded-2xl" />
                </div>
            </AppShell>
        )
    }

    if (!profile) {
        return (
            <AppShell title="My Profile">
                <div className="text-center py-16">
                    <p className="text-white/40">Your profile hasn't been set up yet. Ask your coach to create your athlete profile.</p>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell title="My Profile">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">My Profile</h1>
            </div>

            {/* Hero card with photo upload */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-5">
                <div className="flex items-start gap-4">
                    <PhotoUpload
                        currentUrl={form.photo_url ?? null}
                        name={profile.name}
                        bucket="avatars"
                        onUploaded={(url) => void handlePhotoUploaded(url)}
                        size="xl"
                    />
                    <div className="flex-1 min-w-0 pt-1">
                        <h2 className="font-heading font-bold text-white text-xl">{profile.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profile.sport && <Badge>{profile.sport}</Badge>}
                            {profile.position && <Badge>{profile.position}</Badge>}
                            {profile.grade && <Badge>{profile.grade}</Badge>}
                            {profile.level && <Badge variant="info">{profile.level}</Badge>}
                        </div>
                        <p className="text-white/30 text-xs mt-2">Tap photo to update</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-5">
                {(['info', 'social'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={cn('flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                            tab === t ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50')}>
                        {t === 'info' ? 'My Info' : 'Social & Recruiting'}
                    </button>
                ))}
            </div>

            {tab === 'info' && (
                <div className="space-y-4">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Height</label>
                                <input className={inputCls} placeholder={`e.g. 6'2"`} value={form.height ?? ''}
                                    onChange={e => set('height', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Weight (lbs)</label>
                                <input className={inputCls} type="number" placeholder="e.g. 195" value={form.weight ?? ''}
                                    onChange={e => set('weight', parseFloat(e.target.value) || null)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Sport</label>
                            <input className={cn(inputCls, 'opacity-60 cursor-not-allowed')} value={form.sport ?? ''} readOnly />
                            <p className="text-white/25 text-[10px] mt-1">Sport is set by your coach</p>
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">Position</label>
                            <input className={cn(inputCls, 'opacity-60 cursor-not-allowed')} value={form.position ?? ''} readOnly />
                        </div>
                    </div>
                </div>
            )}

            {tab === 'social' && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-4">
                    {[
                        { key: 'hudl_url', label: 'HUDL URL', icon: Youtube, placeholder: 'https://www.hudl.com/...' },
                        { key: 'recruiting_url', label: 'Recruiting Profile', icon: LinkIcon, placeholder: 'https://...' },
                        { key: 'instagram', label: 'Instagram Handle', icon: Instagram, placeholder: '@username' },
                        { key: 'twitter', label: 'Twitter / X Handle', icon: Twitter, placeholder: '@username' },
                        { key: 'tiktok', label: 'TikTok Handle', icon: LinkIcon, placeholder: '@username' },
                    ].map(({ key, label, icon: Icon, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs text-white/50 mb-1 flex items-center gap-1.5">
                                <Icon className="w-3 h-3" />{label}
                            </label>
                            <div className="relative">
                                <input className={inputCls} placeholder={placeholder}
                                    value={(form[key as keyof AthleteProfile] as string) ?? ''}
                                    onChange={e => set(key as keyof AthleteProfile, e.target.value)} />
                                {(form[key as keyof AthleteProfile] as string) && (
                                    <a href={form[key as keyof AthleteProfile] as string} target="_blank" rel="noopener noreferrer"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#C8F000] transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Save button */}
            <button
                onClick={() => void saveProfile()}
                disabled={saving}
                className={cn(
                    'w-full mt-5 py-3 font-heading font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2',
                    saved ? 'bg-[#C8F000]/20 text-[#C8F000] border border-[#C8F000]/30' : 'bg-[#C8F000] text-[#0D0D0D] hover:bg-[#d4f520] active:scale-[0.98]',
                    saving && 'opacity-60'
                )}
            >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
        </AppShell>
    )
}
