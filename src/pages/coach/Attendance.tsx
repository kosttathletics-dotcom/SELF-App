import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

interface AttendanceEvent {
    id: string
    title: string
    date: string
    time: string | null
    location: string | null
    type: string
    notes: string | null
    created_at: string
}

interface AttendanceRecord {
    id: string
    event_id: string
    athlete_id: string
    status: 'present' | 'late' | 'absent'
    athlete_name?: string
    photo_url?: string | null
}

interface AthleteBasic {
    id: string
    name: string
    photo_url: string | null
}

const EVENT_TYPES = ['Lift', 'Practice', 'Game', 'Meeting', 'Event']

export default function AttendancePage() {
    const { user } = useAuth()
    const [events, setEvents] = useState<AttendanceEvent[]>([])
    const [athletes, setAthletes] = useState<AthleteBasic[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
    const [eventRecords, setEventRecords] = useState<Record<string, AttendanceRecord[]>>({})
    const [showNewEvent, setShowNewEvent] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '', type: 'Practice', notes: '' })
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        if (!user) return
        const [eventsRes, athletesRes] = await Promise.all([
            supabase.from('attendance_events').select('*').eq('coach_id', user.id).order('date', { ascending: false }).limit(30),
            supabase.from('athletes').select('id, name, photo_url').eq('coach_id', user.id).eq('status', 'active' as never).order('name'),
        ])
        setEvents((eventsRes.data ?? []) as unknown as AttendanceEvent[])
        setAthletes((athletesRes.data ?? []) as unknown as AthleteBasic[])
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const loadEventRecords = useCallback(async (eventId: string) => {
        const { data } = await supabase
            .from('attendance_records')
            .select('id, event_id, athlete_id, status')
            .eq('event_id', eventId)
        setEventRecords(r => ({ ...r, [eventId]: (data ?? []) as unknown as AttendanceRecord[] }))
    }, [])

    const toggleExpand = async (eventId: string) => {
        if (expandedEvent === eventId) { setExpandedEvent(null); return }
        setExpandedEvent(eventId)
        if (!eventRecords[eventId]) await loadEventRecords(eventId)
    }

    const takeAttendance = async (eventId: string, athleteId: string, status: AttendanceRecord['status']) => {
        if (!user) return
        const existing = eventRecords[eventId]?.find(r => r.athlete_id === athleteId)
        if (existing) {
            await supabase.from('attendance_records').update({ status } as never).eq('id', existing.id)
        } else {
            await supabase.from('attendance_records').insert({ event_id: eventId, athlete_id: athleteId, status } as never)
        }
        await loadEventRecords(eventId)
    }

    const createEvent = async () => {
        if (!user || !newEvent.title || !newEvent.date) return
        setSaving(true)
        await supabase.from('attendance_events').insert({
            title: newEvent.title, date: newEvent.date, type: newEvent.type,
            coach_id: user.id,
            time: newEvent.time || null, location: newEvent.location || null,
            notes: newEvent.notes || null,
        } as never)
        setSaving(false)
        setShowNewEvent(false)
        setNewEvent({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '', type: 'Practice', notes: '' })
        void load()
    }

    const getEventStats = (eventId: string) => {
        const records = eventRecords[eventId] ?? []
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length
        return { present, total: athletes.length, pct: athletes.length > 0 ? Math.round((present / athletes.length) * 100) : 0 }
    }

    const getAthleteStatus = (eventId: string, athleteId: string): AttendanceRecord['status'] | null => {
        return eventRecords[eventId]?.find(r => r.athlete_id === athleteId)?.status ?? null
    }

    const inputCls = 'w-full px-3 py-2.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    return (
        <AppShell title="Attendance">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Attendance</h1>
                    <p className="text-white/40 text-sm mt-0.5">{events.length} events tracked</p>
                </div>
                <button onClick={() => setShowNewEvent(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    New Event
                </button>
            </div>

            {/* New Event Form */}
            {showNewEvent && (
                <div className="bg-[#1A1A1A] border border-[#C8F000]/20 rounded-2xl p-5 mb-5 space-y-4">
                    <h3 className="font-heading font-bold text-white">Create Event</h3>
                    <input className={inputCls} placeholder="Event title (e.g. Monday Practice)" value={newEvent.title}
                        onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs text-white/40 mb-1">Date</label>
                            <input type="date" className={inputCls} value={newEvent.date} onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1">Time</label>
                            <input type="time" className={inputCls} value={newEvent.time} onChange={e => setNewEvent(n => ({ ...n, time: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1">Type</label>
                            <select className={inputCls} value={newEvent.type} onChange={e => setNewEvent(n => ({ ...n, type: e.target.value }))}>
                                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs text-white/40 mb-1">Location</label>
                            <input className={inputCls} placeholder="Optional" value={newEvent.location} onChange={e => setNewEvent(n => ({ ...n, location: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => void createEvent()} disabled={saving || !newEvent.title}
                            className="flex-1 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm disabled:opacity-50">
                            {saving ? 'Creating...' : 'Create Event'}
                        </button>
                        <button onClick={() => setShowNewEvent(false)} className="px-5 py-2.5 bg-[#2A2A2A] text-white/60 rounded-xl text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Events List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}</div>
            ) : events.length === 0 ? (
                <EmptyState icon={Calendar} title="No events yet" description="Create your first event to start taking attendance" />
            ) : (
                <div className="space-y-3">
                    {events.map(ev => {
                        const isExpanded = expandedEvent === ev.id
                        const stats = getEventStats(ev.id)
                        const upcoming = isFuture(parseISO(ev.date))
                        const past = isPast(parseISO(ev.date))

                        return (
                            <div key={ev.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                                <button onClick={() => void toggleExpand(ev.id)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-[#2A2A2A]/30 transition-colors text-left">
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                        upcoming ? 'bg-[#C8F000]/10' : 'bg-[#2A2A2A]')}>
                                        {upcoming ? <Clock className="w-5 h-5 text-[#C8F000]" /> : <Calendar className="w-5 h-5 text-white/30" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-heading font-semibold text-white text-sm">{ev.title}</p>
                                            <Badge>{ev.type}</Badge>
                                        </div>
                                        <p className="text-white/40 text-xs mt-0.5">
                                            {format(parseISO(ev.date), 'EEE, MMM d, yyyy')}
                                            {ev.time && ` · ${ev.time}`}
                                            {ev.location && ` · ${ev.location}`}
                                        </p>
                                        {past && eventRecords[ev.id] && (
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="h-1.5 flex-1 bg-[#2A2A2A] rounded-full overflow-hidden max-w-24">
                                                    <div className="h-full bg-[#C8F000] rounded-full" style={{ width: `${stats.pct}%` }} />
                                                </div>
                                                <span className="text-white/40 text-xs">{stats.present}/{stats.total} present</span>
                                            </div>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-[#2A2A2A]">
                                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A]">
                                            <span className="text-white/50 text-xs font-medium">Take Attendance</span>
                                            <div className="flex gap-2">
                                                {athletes.length > 0 && (
                                                    <>
                                                        <button onClick={async () => { for (const a of athletes) await takeAttendance(ev.id, a.id, 'present') }}
                                                            className="text-xs text-[#C8F000] hover:text-[#d4f520] transition-colors">Mark All Present</button>
                                                        <span className="text-white/20">·</span>
                                                        <button onClick={async () => { for (const a of athletes) await takeAttendance(ev.id, a.id, 'absent') }}
                                                            className="text-xs text-white/30 hover:text-[#FF4444] transition-colors">Mark All Absent</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-[#2A2A2A]">
                                            {athletes.map(a => {
                                                const status = getAthleteStatus(ev.id, a.id)
                                                return (
                                                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                                                        <Avatar name={a.name} photoUrl={a.photo_url} size="sm" />
                                                        <span className="text-white text-sm flex-1">{a.name}</span>
                                                        <div className="flex gap-1">
                                                            {(['present', 'late', 'absent'] as const).map(s => (
                                                                <button key={s} onClick={() => void takeAttendance(ev.id, a.id, s)}
                                                                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize',
                                                                        status === s
                                                                            ? s === 'present' ? 'bg-[#C8F000] text-[#0D0D0D]'
                                                                                : s === 'late' ? 'bg-[#F4A261] text-[#0D0D0D]'
                                                                                    : 'bg-[#FF4444]/30 text-[#FF4444]'
                                                                            : 'bg-[#2A2A2A] text-white/30 hover:text-white/60')}>
                                                                    {s === 'present' ? '✓' : s === 'late' ? 'L' : '✗'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {athletes.length === 0 && <p className="text-white/30 text-sm px-4 py-4">No active athletes on roster</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </AppShell>
    )
}
