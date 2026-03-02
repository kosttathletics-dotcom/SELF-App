import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Zap } from 'lucide-react'
import type { User } from '@/types/database'

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

            // Check if user profile exists
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            const profile = profileData as User | null

            if (!profile) {
                // Check for pending invite
                const { data: inviteData } = await supabase
                    .from('invites')
                    .select('*')
                    .eq('email', authUser.email ?? '')
                    .eq('accepted', false)
                    .single()

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invite = inviteData as any

                if (invite) {
                    // Create user profile from invite
                    await supabase.from('users').upsert({
                        id: authUser.id,
                        email: authUser.email ?? '',
                        role: invite.role as string,
                        name: null,
                        photo_url: null,
                    })

                    // Mark invite as accepted
                    await supabase.from('invites').update({ accepted: true }).eq('id', invite.id as string)

                    // If parent, create parent-athlete link
                    if (invite.role === 'parent' && invite.athlete_id) {
                        await supabase.from('parent_athlete_links').upsert({
                            parent_id: authUser.id,
                            athlete_id: invite.athlete_id as string,
                        })
                    }

                    navigate('/onboarding')
                    return
                } else {
                    // New coach — create coach profile
                    await supabase.from('users').upsert({
                        id: authUser.id,
                        email: authUser.email ?? '',
                        role: 'coach',
                        name: null,
                        photo_url: null,
                    })
                    navigate('/onboarding')
                    return
                }
            }

            // Profile exists — redirect by role
            if (profile.role === 'coach') navigate('/dashboard')
            else if (profile.role === 'athlete') navigate('/athlete/dashboard')
            else if (profile.role === 'parent') navigate('/parent/dashboard')
            else navigate('/login')
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
