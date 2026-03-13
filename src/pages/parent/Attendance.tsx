import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/shared/Badge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface AttendanceRecord {
    id: string
    status: 'present' | 'absent' | 'late'
    event: { id: string; title: string; date: string; type: string }
}

const STATUS_ICON = {
    present: <CheckCircle2 className="w-4 h-4 text-[#C8F000]" />,
    late: <Clock className="w-4 h-4 text-[#F4A261]" />,
    absent: <XCircle className="w-4 h-4 text-[#FF4444]" />,
}

export default function ParentAttendance() {
    const { user } = useAuth()
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [athleteName, setAthleteName] = useState<string>('')
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!user) return
        const { data: linkData } = await supabase.from('parent_athlete_links').select('athlete_id').eq('parent_id', user.id).single()
        const link = linkData as unknown as { athlete_id: string } | null
        if (!link) return setLoading(false)

        const [nameRes, attRes] = await Promise.all([
            supabase.from('athletes').select('name').eq('id', link.athlete_id).single(),
            supabase.from('attendance_records').select('id, status, attendance_events(id, title, date, type)')
                .eq('athlete_id', link.athlete_id).order('created_at', { ascending: false }),
        ])

        setAthleteName((nameRes.data as unknown as { name: string } | null)?.name ?? '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (attRes.data ?? []) as any[]
        setRecords(raw.map(r => ({ id: r.id, status: r.status, event: r.attendance_events })))
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const present = records.filter(r => r.status === 'present' || r.status === 'late').length
    const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0
    const absences = records.filter(r => r.status === 'absent').length

    return (
        <AppShell title="Attendance">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white">Attendance</h1>
                {athleteName && <p className="text-white/40 text-sm mt-0.5">{athleteName}'s record</p>}
            </div>

            {absences >= 3 && (
                <div className="flex items-start gap-3 px-4 py-3 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl mb-5">
                    <AlertTriangle className="w-4 h-4 text-[#FF4444] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{absences} absences logged — contact coach if any should be excused.</p>
                </div>
            )}

            {!loading && records.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                        <p className={cn('text-3xl font-heading font-bold', pct >= 80 ? 'text-[#C8F000]' : pct >= 70 ? 'text-[#F4A261]' : 'text-[#FF4444]')}>{pct}%</p>
                        <p className="text-white/40 text-xs mt-1">Attendance Rate</p>
                        <ProgressBar value={pct} max={100} className="mt-2" variant={pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'error'} />
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                        <p className={cn('text-3xl font-heading font-bold', absences === 0 ? 'text-[#C8F000]' : absences < 3 ? 'text-[#F4A261]' : 'text-[#FF4444]')}>{absences}</p>
                        <p className="text-white/40 text-xs mt-1">Absences</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
            ) : records.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No attendance records yet</p>
                </div>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                    <div className="divide-y divide-[#2A2A2A]">
                        {records.map(r => (
                            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                                {STATUS_ICON[r.status]}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{r.event?.title}</p>
                                    <p className="text-white/40 text-xs mt-0.5">{r.event?.date ? format(parseISO(r.event.date), 'EEE, MMM d') : '—'} · {r.event?.type}</p>
                                </div>
                                <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'error'} className="capitalize">
                                    {r.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
