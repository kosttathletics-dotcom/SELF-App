import { useState, useEffect } from 'react'
import { X, Mail, Send, CheckCircle2, AlertTriangle, Shield, Dumbbell, Users } from 'lucide-react'
import { useInvite, type InviteRole } from '@/hooks/useInvite'
import { cn } from '@/lib/utils'

interface InviteModalProps {
    role: InviteRole
    athleteId?: string          // Pre-filled for parent invites
    athleteName?: string        // Athlete's name shown in parent invite context
    onClose: () => void
}

const ROLE_META: Record<InviteRole, { icon: React.ElementType; label: string; color: string; hint: string }> = {
    athlete: {
        icon: Dumbbell,
        label: 'Athlete',
        color: 'text-[#C8F000]',
        hint: 'The athlete will receive an email with a secure link to join your program.',
    },
    parent: {
        icon: Users,
        label: 'Parent',
        color: 'text-blue-400',
        hint: 'The parent will be automatically linked to their child\'s profile upon joining.',
    },
}

export function InviteModal({ role, athleteId, athleteName, onClose }: InviteModalProps) {
    const { sending, error, sent, sendInvite, reset } = useInvite()
    const [email, setEmail] = useState('')
    const [nameInput, setNameInput] = useState(athleteName ?? '')

    const meta = ROLE_META[role]
    const Icon = meta.icon

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await sendInvite({
            email,
            role,
            athleteId,
            athleteName: role === 'athlete' ? nameInput : undefined,
        })
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                <div className="w-full max-w-sm bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-2xl pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#2A2A2A]">
                        <div className="flex items-center gap-2.5">
                            <div className={cn('w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center')}>
                                <Icon className={cn('w-4 h-4', meta.color)} />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-white text-sm">Invite {meta.label}</h2>
                                {role === 'parent' && athleteName && (
                                    <p className="text-white/40 text-xs">Parent of {athleteName}</p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5 text-white/50" />
                        </button>
                    </div>

                    <div className="px-5 py-5">
                        {sent ? (
                            /* ── Success State ─────────────────────── */
                            <div className="text-center py-4">
                                <div className="w-14 h-14 rounded-full bg-[#C8F000]/10 border border-[#C8F000]/30 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-7 h-7 text-[#C8F000]" />
                                </div>
                                <h3 className="font-heading font-semibold text-white text-base mb-1">Invite sent!</h3>
                                <p className="text-white/50 text-sm mb-5">
                                    An invite link was sent to <span className="text-white/80 font-medium">{email}</span>.
                                    They'll join your program when they click it.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { reset(); setEmail(''); setNameInput('') }}
                                        className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white/60 text-sm rounded-xl hover:text-white hover:border-[#3A3A3A] transition-all font-medium"
                                    >
                                        Send another
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-2.5 bg-[#C8F000] text-[#0D0D0D] text-sm rounded-xl font-heading font-semibold hover:bg-[#d4f520] transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Form State ────────────────────────── */
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Athlete name field (only for athlete invites) */}
                                {role === 'athlete' && (
                                    <div>
                                        <label className="block text-xs font-medium text-white/60 mb-1.5">
                                            Athlete's name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={nameInput}
                                            onChange={e => setNameInput(e.target.value)}
                                            placeholder="Jordan Smith"
                                            className="w-full px-3.5 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C8F000] transition-colors"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-white/60 mb-1.5">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="athlete@example.com"
                                            className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C8F000] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Contextual hint */}
                                <div className="flex items-start gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-3">
                                    <Shield className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                                    <p className="text-white/40 text-xs leading-relaxed">{meta.hint}</p>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl px-3.5 py-3">
                                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF4444] flex-shrink-0 mt-0.5" />
                                        <p className="text-[#FF4444] text-xs">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={sending || !email.trim() || (role === 'athlete' && !nameInput.trim())}
                                    className="w-full py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                                            Sending invite...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
