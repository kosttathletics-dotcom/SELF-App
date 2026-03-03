import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Zap, Shield, Dumbbell, Users, ArrowRight, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type OnboardingRole = 'coach' | 'athlete' | 'parent'

const ROLE_OPTIONS: { role: OnboardingRole; icon: React.ElementType; label: string; desc: string; restricted?: boolean }[] = [
    {
        role: 'coach',
        icon: Shield,
        label: 'I am a Coach',
        desc: 'Manage your roster, track training, grades & recruiting.',
    },
    {
        role: 'athlete',
        icon: Dumbbell,
        label: 'I am an Athlete',
        desc: 'View your workouts, grades, and development progress.',
        restricted: true,
    },
    {
        role: 'parent',
        icon: Users,
        label: 'I am a Parent',
        desc: 'Monitor your child\'s academics, attendance, and eligibility.',
        restricted: true,
    },
]

export default function Onboarding() {
    const { user, role: ctxRole } = useAuth()
    const navigate = useNavigate()

    const [step, setStep] = useState<'role' | 'profile'>('role')
    const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Determine if this is an invited user (role already assigned) or brand-new
    const onboardingSource = sessionStorage.getItem('self-onboarding-source')
    const isInvited = onboardingSource === 'invite'

    useEffect(() => {
        // If invited user — role already set in DB, skip role selection
        if (isInvited && ctxRole && ctxRole !== 'pending') {
            setSelectedRole(ctxRole as OnboardingRole)
            setStep('profile')
        }
        // If existing user who somehow landed here, redirect out
        if (user && ctxRole && ctxRole !== 'pending' && !isInvited) {
            if (ctxRole === 'coach') navigate('/dashboard', { replace: true })
            else if (ctxRole === 'athlete') navigate('/athlete/dashboard', { replace: true })
            else if (ctxRole === 'parent') navigate('/parent/dashboard', { replace: true })
        }
    }, [isInvited, ctxRole, user, navigate])

    const handleRoleSelect = (r: OnboardingRole) => {
        setSelectedRole(r)
    }

    const handleRoleContinue = () => {
        if (!selectedRole) return
        setStep('profile')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim() || !selectedRole) return
        setLoading(true)
        setError(null)

        const { error: updateError } = await supabase
            .from('users')
            .update({ name: name.trim(), role: selectedRole } as never)
            .eq('id', user.id)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        // Clear onboarding flag
        sessionStorage.removeItem('self-onboarding-source')

        if (selectedRole === 'coach') navigate('/dashboard', { replace: true })
        else if (selectedRole === 'athlete') navigate('/athlete/dashboard', { replace: true })
        else if (selectedRole === 'parent') navigate('/parent/dashboard', { replace: true })
    }

    // ── STEP 1: Role Selection ─────────────────────────────────
    if (step === 'role') {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C8F000]/5 blur-[100px]" />
                </div>

                <div className="relative w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C8F000] mb-4">
                            <Zap className="w-7 h-7 text-[#0D0D0D]" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-white">Welcome to SELF</h1>
                        <p className="text-white/50 text-sm mt-1">Who are you joining as?</p>
                    </div>

                    <div className="space-y-3">
                        {ROLE_OPTIONS.map(({ role, icon: Icon, label, desc, restricted }) => (
                            <button
                                key={role}
                                onClick={() => handleRoleSelect(role)}
                                className={cn(
                                    'w-full text-left px-4 py-4 rounded-2xl border transition-all',
                                    selectedRole === role
                                        ? 'border-[#C8F000] bg-[#C8F000]/8'
                                        : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                                        selectedRole === role ? 'bg-[#C8F000]/20' : 'bg-[#2A2A2A]'
                                    )}>
                                        <Icon className={cn('w-4.5 h-4.5', selectedRole === role ? 'text-[#C8F000]' : 'text-white/40')} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-heading font-semibold text-white text-sm">{label}</p>
                                            {restricted && (
                                                <span className="text-[10px] bg-[#F4A261]/15 text-[#F4A261] px-2 py-0.5 rounded-full">Invite only</span>
                                            )}
                                        </div>
                                        <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                    {selectedRole === role && (
                                        <div className="w-4 h-4 rounded-full bg-[#C8F000] flex items-center justify-center flex-shrink-0 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#0D0D0D]" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Restricted role warning */}
                    {selectedRole && selectedRole !== 'coach' && (
                        <div className="mt-4 flex items-start gap-2.5 bg-[#F4A261]/10 border border-[#F4A261]/20 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-[#F4A261] flex-shrink-0 mt-0.5" />
                            <p className="text-[#F4A261] text-xs leading-relaxed">
                                Athletes and parents normally join via a coach's invite link. Without an invite, you'll have limited access until a coach links you to their program.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleRoleContinue}
                        disabled={!selectedRole}
                        className="w-full mt-5 py-3.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    // ── STEP 2: Profile Setup ──────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C8F000]/5 blur-[100px]" />
            </div>
            <div className="relative w-full max-w-sm">
                {!isInvited && (
                    <button
                        onClick={() => setStep('role')}
                        className="flex items-center gap-1.5 text-white/40 text-xs hover:text-white/70 transition-colors mb-6"
                    >
                        ← Change role
                    </button>
                )}

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C8F000] mb-4">
                        <Zap className="w-7 h-7 text-[#0D0D0D]" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-white">Set up your profile</h1>
                    <p className="text-white/50 text-sm mt-1">
                        You're joining as a <span className="text-[#C8F000] capitalize font-medium">{selectedRole}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                            Your full name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Johnson"
                            className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] focus:ring-1 focus:ring-[#C8F000] transition-colors text-sm"
                        />
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
                        <p className="text-white/40 text-xs">Email</p>
                        <p className="text-white text-sm mt-0.5">{user?.email}</p>
                    </div>

                    {error && (
                        <p className="text-[#FF4444] text-sm bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full py-3.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            "Let's go →"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
