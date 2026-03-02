import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { EligibilityTab } from '@/components/eligibility/EligibilityTab'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Info } from 'lucide-react'

export default function ParentEligibility() {
    const { user } = useAuth()
    const [athleteId, setAthleteId] = useState<string | null>(null)
    const [athleteName, setAthleteName] = useState<string>('')
    const [sport, setSport] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!user) return
        const { data: linkData } = await supabase
            .from('parent_athlete_links')
            .select('athlete_id')
            .eq('parent_id', user.id)
            .single()
        const link = linkData as unknown as { athlete_id: string } | null
        if (!link) return setLoading(false)

        const { data: ath } = await supabase
            .from('athletes')
            .select('id, name, sport')
            .eq('id', link.athlete_id)
            .single()
        const a = ath as unknown as { id: string; name: string; sport: string | null } | null
        setAthleteId(a?.id ?? null)
        setAthleteName(a?.name ?? '')
        setSport(a?.sport ?? null)
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    return (
        <AppShell title="Eligibility">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">NCAA Eligibility</h1>
                {athleteName && <p className="text-white/40 text-sm mt-0.5">{athleteName}'s eligibility status</p>}
            </div>

            {/* Read-only notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 mb-5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>This is a read-only view. Grades and core courses are updated by your child's coach. Contact the coach with any questions.</p>
            </div>

            {loading ? (
                <div className="h-40 bg-[#1A1A1A] rounded-2xl animate-pulse" />
            ) : !athleteId ? (
                <div className="text-center py-12">
                    <p className="text-white/40">No athlete linked to your account. Contact the coach to link your child's profile.</p>
                </div>
            ) : (
                <EligibilityTab athleteId={athleteId} sport={sport} />
            )}
        </AppShell>
    )
}
