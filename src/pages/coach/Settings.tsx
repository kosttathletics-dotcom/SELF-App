import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Save, User, Bell } from 'lucide-react'

interface CoachProfile {
    id: string
    name: string | null
    email: string
    photo_url: string | null
    role: string
}

const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

export default function SettingsPage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<CoachProfile | null>(null)
    const [form, setForm] = useState<Partial<CoachProfile>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [tab, setTab] = useState<'profile' | 'account'>('profile')

    const load = useCallback(async () => {
        if (!user) return
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        const p = data as unknown as CoachProfile | null
        setProfile(p)
        setForm(p ?? {})
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const set = (k: keyof CoachProfile, v: unknown) => setForm(f => ({ ...f, [k]: v }))

    const save = async () => {
        if (!user) return
        setSaving(true)
        await supabase.from('users').update({
            name: form.name,
            photo_url: form.photo_url,
        } as never).eq('id', user.id)
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        void load()
    }

    const handlePhotoUploaded = async (url: string) => {
        set('photo_url', url)
        if (!user) return
        await supabase.from('users').update({ photo_url: url } as never).eq('id', user.id)
    }

    const TABS = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'account' as const, label: 'Account', icon: Bell },
    ]

    return (
        <AppShell title="Settings">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Settings</h1>
            </div>

            {/* Photo + name hero */}
            {!loading && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-5 flex items-center gap-4">
                    <PhotoUpload
                        currentUrl={form.photo_url ?? null}
                        name={profile?.name ?? 'Coach'}
                        bucket="avatars"
                        onUploaded={(url) => void handlePhotoUploaded(url)}
                        size="xl"
                    />
                    <div>
                        <h2 className="font-heading font-bold text-white text-lg">{profile?.name ?? 'Coach'}</h2>
                        <p className="text-white/40 text-sm capitalize">{profile?.role}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 mb-5">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                            tab === id ? 'bg-[#C8F000] text-[#0D0D0D]' : 'text-white/50')}>
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-4">
                    {tab === 'profile' && (
                        <>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Display Name</label>
                                <input className={inputCls} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Email</label>
                                <input className={cn(inputCls, 'opacity-50 cursor-not-allowed')} value={user?.email ?? ''} readOnly />
                                <p className="text-white/25 text-[10px] mt-1">Email is managed through Supabase Auth</p>
                            </div>
                        </>
                    )}

                    {tab === 'account' && (
                        <div className="space-y-3">
                            <div className="px-1 py-2">
                                <p className="text-white/50 text-xs font-medium mb-3">Account Information</p>
                                {[
                                    { label: 'Email', value: user?.email ?? '—' },
                                    { label: 'Role', value: profile?.role ?? '—' },
                                    { label: 'User ID', value: (user?.id?.slice(0, 8) ?? '?') + '...' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#2A2A2A] last:border-0">
                                        <span className="text-white/50 text-sm">{label}</span>
                                        <span className="text-white text-sm font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2">
                                <p className="text-white/30 text-xs text-center">
                                    To sign out, close the app or clear your session.<br />
                                    Contact support to change your email or role.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Save button — hidden on account tab */}
            {tab !== 'account' && (
                <button
                    onClick={() => void save()}
                    disabled={saving || loading}
                    className={cn(
                        'w-full mt-5 py-3 font-heading font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2',
                        saved ? 'bg-[#C8F000]/20 text-[#C8F000] border border-[#C8F000]/30' : 'bg-[#C8F000] text-[#0D0D0D] hover:bg-[#d4f520] active:scale-[0.98]',
                        saving && 'opacity-60'
                    )}
                >
                    <Save className="w-4 h-4" />
                    {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
            )}
        </AppShell>
    )
}
