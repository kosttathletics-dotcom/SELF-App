import { AppShell } from '@/components/layout/AppShell'
import { CalendarWidget, useCalendarEvents } from '@/components/calendar/CalendarWidget'
import { useAuth } from '@/context/AuthContext'

export default function CoachCalendarPage() {
    const { user } = useAuth()
    const { events, loading } = useCalendarEvents(user?.id)

    return (
        <AppShell title="Calendar">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Calendar</h1>
                <p className="text-white/40 text-sm mt-0.5">{events.length} events scheduled</p>
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
