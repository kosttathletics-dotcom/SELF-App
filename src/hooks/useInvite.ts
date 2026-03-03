import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type InviteRole = 'athlete' | 'parent'

interface SendInviteOptions {
    email: string
    role: InviteRole
    athleteId?: string      // required for parent invites, optional for athlete
    athleteName?: string    // for athlete invites — pre-creates athlete record
}

interface UseInviteReturn {
    sending: boolean
    error: string | null
    sent: boolean
    sendInvite: (opts: SendInviteOptions) => Promise<void>
    reset: () => void
}

export function useInvite(): UseInviteReturn {
    const { user } = useAuth()
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)

    const sendInvite = async ({ email, role, athleteId, athleteName }: SendInviteOptions) => {
        if (!user) return
        setSending(true)
        setError(null)

        try {
            // Step 1: Create the invite record
            let targetAthleteId = athleteId

            // For athlete invites without an existing athlete record,
            // pre-create the athlete shell so the coach sees them in roster
            if (role === 'athlete' && !athleteId && athleteName) {
                const { data: newAthlete, error: athErr } = await supabase
                    .from('athletes')
                    .insert({
                        coach_id: user.id,
                        name: athleteName,
                        status: 'active',
                    } as never)
                    .select('id')
                    .single()

                if (athErr) throw new Error(athErr.message)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                targetAthleteId = (newAthlete as any)?.id as string
            }

            const { data: inviteRow, error: inviteErr } = await supabase
                .from('invites')
                .insert({
                    email: email.toLowerCase().trim(),
                    role,
                    coach_id: user.id,
                    athlete_id: targetAthleteId ?? null,
                    accepted: false,
                } as never)
                .select('id')
                .single()

            if (inviteErr) {
                // Gracefully handle duplicate invite
                if (inviteErr.code === '23505') {
                    throw new Error('An invite for this email address already exists.')
                }
                throw new Error(inviteErr.message)
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inviteId = (inviteRow as any)?.id as string

            // Step 2: Send magic link with invite_id encoded in redirect URL
            const redirectTo = `${window.location.origin}/auth/callback?invite_id=${inviteId}`
            const { error: otpErr } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: {
                    emailRedirectTo: redirectTo,
                    shouldCreateUser: true,
                },
            })

            if (otpErr) throw new Error(otpErr.message)

            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invite')
        } finally {
            setSending(false)
        }
    }

    const reset = () => {
        setSent(false)
        setError(null)
    }

    return { sending, error, sent, sendInvite, reset }
}
