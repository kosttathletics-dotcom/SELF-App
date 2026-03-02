import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ProgressBar'

interface AttendanceRecord {
    id: string
    status: 'present' | 'absent' | 'excused' | 'late'
    event: {
        id: string
        title: string
        date: string
        type: string
        required: boolean
    }
}

const STATUS_ICON = {
    present: <CheckCircle2 className="w-4 h-4 text-[#C8F000]" />,
    late: <Clock className="w-4 h-4 text-[#F4A261]" />,
    excused: <AlertCircle className="w-4 h-4 text-blue-400" />,
    absent: <XCircle className="w-4 h-4 text-[#FF4444]" />,
}

const STATUS_LABEL: Record<string, string> = {
    present: 'Present', late: 'Late', excused: 'Excused', absent: 'Absent'
}

export default function AthleteAttendance() {
    const { user } = useAuth()
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'excused' | 'late'>('all')

    const load = useCallback(async () => {
        if (!user) return

        // Get the athlete record linked to this user
        const { data: ath } = await supabase.from('athletes').select('id').eq('user_id', user.id).single()
        const athlete = ath as unknown as { id: string } | null
        if (!athlete) return setLoading(false)

        const { data } = await supabase
            .from('attendance')
            .select('id, status, events(id, title, date, type, required)')
            .eq('athlete_id', athlete.id)
            .order('created_at', { ascending: false })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (data ?? []) as any[]
        setRecords(raw.map(r => ({
            id: r.id as string,
            status: r.status as AttendanceRecord['status'],
            event: r.events as AttendanceRecord['event'],
        })))
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const present = records.filter(r => r.status === 'present' || r.status === 'late').length
    const required = records.filter(r => r.event?.required).length
    const requiredPresent = records.filter(r => r.event?.required && (r.status === 'present' || r.status === 'late')).length
    const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0
    const reqPct = required > 0 ? Math.round((requiredPresent / required) * 100) : 0

    const filtered = records.filter(r => filter === 'all' || r.status === filter)

    return (
        <AppShell title="My Attendance">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">My Attendance</h1>
                <p className="text-white/40 text-sm mt-0.5">{records.length} events logged</p>
            </div>

            {/* Summary cards */}
            {!loading && records.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                        <p className={cn('text-3xl font-heading font-bold', pct >= 80 ? 'text-[#C8F000]' : pct >= 70 ? 'text-[#F4A261]' : 'text-[#FF4444]')}>
                            {pct}%
                        </p>
                        <p className="text-white/40 text-xs mt-1">Overall Rate</p>
                        <ProgressBar value={pct} max={100} className="mt-2" variant={pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'error'} />
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                        <p className={cn('text-3xl font-heading font-bold', reqPct >= 80 ? 'text-[#C8F000]' : reqPct >= 70 ? 'text-[#F4A261]' : 'text-[#FF4444]')}>
                            {required > 0 ? `${reqPct}%` : '—'}
                        </p>
                        <p className="text-white/40 text-xs mt-1">Required Events</p>
                        {required > 0 && <ProgressBar value={reqPct} max={100} className="mt-2" variant={reqPct >= 80 ? 'success' : reqPct >= 70 ? 'warning' : 'error'} />}
                    </div>
                </div>
            )}

            {/* Stat chips */}
            {!loading && records.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                    {(['present', 'late', 'excused', 'absent'] as const).map(s => {
                        const count = records.filter(r => r.status === s).length
                        return (
                            <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full">
                                {STATUS_ICON[s]}
                                <span className="text-white/70 text-xs capitalize">{s}</span>
                                <span className="font-heading font-bold text-white text-xs">{count}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
                {(['all', 'present', 'late', 'excused', 'absent'] as const).map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                            filter === s ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Records list */}
            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">{filter !== 'all' ? 'No records for this filter' : 'No attendance records yet'}</p>
                </div>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                    <div className="divide-y divide-[#2A2A2A]">
                        {filtered.map(r => (
                            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                                {STATUS_ICON[r.status]}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{r.event?.title ?? 'Unknown Event'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-white/40 text-xs">{r.event?.date ? format(parseISO(r.event.date), 'EEE, MMM d') : '—'}</p>
                                        {r.event?.type && <span className="text-white/20 text-xs">· {r.event.type}</span>}
                                        {r.event?.required && <Badge variant="warning" className="text-[10px]">Required</Badge>}
                                    </div>
                                </div>
                                <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : r.status === 'excused' ? 'info' : 'error'}>
                                    {STATUS_LABEL[r.status]}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
