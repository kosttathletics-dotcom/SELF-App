import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Zap, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ── Auto-redirect if valid session already exists ──────────
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                // Fetch role and redirect accordingly
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const role = (data as any)?.role as string | null
                if (role === 'coach') navigate('/dashboard', { replace: true })
                else if (role === 'athlete') navigate('/athlete/dashboard', { replace: true })
                else if (role === 'parent') navigate('/parent/dashboard', { replace: true })
                else navigate('/onboarding', { replace: true })
            } else {
                setChecking(false)
            }
        }
        void checkSession()
    }, [navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSent(true)
            setLoading(false)
        }
    }

    // ── Loading state while checking existing session ──────────
    if (checking) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#C8F000] flex items-center justify-center">
                        <Zap className="w-7 h-7 text-[#0D0D0D]" strokeWidth={2.5} />
                    </div>
                    <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C8F000]/5 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8F000] mb-4 shadow-[0_0_40px_rgba(200,240,0,0.3)]">
                        <Zap className="w-8 h-8 text-[#0D0D0D]" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-white tracking-tight">SELF</h1>
                    <p className="text-white/50 mt-1 text-sm">Know your SELF.</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] focus:ring-1 focus:ring-[#C8F000] transition-colors text-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-[#FF4444] text-sm bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full py-3.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                                    Sending magic link...
                                </span>
                            ) : (
                                'Send Magic Link'
                            )}
                        </button>

                        <p className="text-center text-white/40 text-xs mt-4">
                            No password needed. We'll email you a secure login link.
                        </p>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#C8F000]/10 border border-[#C8F000]/30 flex items-center justify-center mx-auto">
                            <Zap className="w-7 h-7 text-[#C8F000]" />
                        </div>
                        <h2 className="text-xl font-heading font-semibold text-white">Check your email</h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            We sent a magic link to{' '}
                            <span className="text-[#C8F000] font-medium">{email}</span>.
                            <br />
                            Click it to sign in to SELF.
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            className="text-white/40 text-xs hover:text-white/70 transition-colors underline underline-offset-2"
                        >
                            Use a different email
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
