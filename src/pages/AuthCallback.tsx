import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Zap } from 'lucide-react'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const handleAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error || !session) {
                navigate('/login')
                return
            }

            const authUser = session.user

            // ── 1. Check if user profile already exists ──────────
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profile = profileData as any

            if (profile?.role) {
                // Existing user with role — go straight to dashboard
                if (profile.role === 'coach') navigate('/dashboard', { replace: true })
                else if (profile.role === 'athlete') navigate('/athlete/dashboard', { replace: true })
                else if (profile.role === 'parent') navigate('/parent/dashboard', { replace: true })
                else navigate('/onboarding', { replace: true })
                return
            }

            // ── 2. New user — Check for invite ────────────────────
            // First check URL param invite_id (more precise)
            const params = new URLSearchParams(window.location.search)
            const inviteId = params.get('invite_id')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let invite: any = null

            if (inviteId) {
                const { data } = await supabase
                    .from('invites')
                    .select('*')
                    .eq('id', inviteId)
                    .eq('accepted', false)
                    .single()
                invite = data
            }

            // Fall back: match by email (handles older invite links)
            if (!invite) {
                const { data } = await supabase
                    .from('invites')
                    .select('*')
                    .eq('email', authUser.email ?? '')
                    .eq('accepted', false)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()
                invite = data
            }

            if (invite) {
                // ── Invited user: create profile with invite role ──
                await supabase.from('users').upsert({
                    id: authUser.id,
                    email: authUser.email ?? '',
                    role: invite.role as string,
                    name: null,
                    photo_url: null,
                })

                // Mark invite accepted
                await supabase.from('invites').update({ accepted: true } as never).eq('id', invite.id as string)

                // Link athlete record to this user_id (so profile lookup works)
                if (invite.role === 'athlete' && invite.athlete_id) {
                    await supabase
                        .from('athletes')
                        .update({ user_id: authUser.id } as never)
                        .eq('id', invite.athlete_id as string)
                }

                // If parent, create parent-athlete link
                if (invite.role === 'parent' && invite.athlete_id) {
                    await supabase.from('parent_athlete_links').upsert({
                        parent_id: authUser.id,
                        athlete_id: invite.athlete_id as string,
                    })
                }

                // Store invite info so Onboarding knows role is pre-assigned
                sessionStorage.setItem('self-onboarding-source', 'invite')

                navigate('/onboarding', { replace: true })
                return
            }

            // ── 3. No invite — new user needs to select their role ──
            // Create a minimal profile row without a role (will be set in Onboarding)
            await supabase.from('users').upsert({
                id: authUser.id,
                email: authUser.email ?? '',
                role: 'pending',   // Placeholder — Onboarding will update this
                name: null,
                photo_url: null,
            })

            sessionStorage.setItem('self-onboarding-source', 'new')
            navigate('/onboarding', { replace: true })
        }

        void handleAuth()
    }, [navigate])

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#C8F000] flex items-center justify-center animate-pulse">
                    <Zap className="w-7 h-7 text-[#0D0D0D]" strokeWidth={2.5} />
                </div>
                <p className="text-white/50 text-sm">Signing you in...</p>
            </div>
        </div>
    )
}
