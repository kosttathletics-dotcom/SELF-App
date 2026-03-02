import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface CalEvent {
    id: string; title: string; date: string; type: string; required: boolean
}

export default function AthleteCalendarPage() {
    const { user } = useAuth()
    const [events, setEvents] = useState<CalEvent[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!user) return
        const { data: ath } = await supabase.from('athletes').select('coach_id').eq('user_id', user.id).single()
        const athlete = ath as unknown as { coach_id: string } | null
        if (!athlete) return setLoading(false)

        const { data } = await supabase
            .from('events')
            .select('id, title, date, type, required')
            .eq('coach_id', athlete.coach_id)
            .order('date')
        setEvents((data ?? []) as unknown as CalEvent[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    return (
        <AppShell title="Calendar">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Calendar</h1>
                <p className="text-white/40 text-sm mt-0.5">Team schedule</p>
            </div>
            {loading ? (
                <div className="h-72 bg-[#1A1A1A] rounded-2xl animate-pulse" />
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                    <CalendarWidget events={events} />
                </div>
            )}
        </AppShell>
    )
}
