import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalEvent {
    id: string
    title: string
    date: string
    type: string
    required: boolean
}

const TYPE_COLORS: Record<string, string> = {
    Practice: 'bg-[#C8F000]',
    Game: 'bg-blue-500',
    'Film Session': 'bg-purple-500',
    'Strength Training': 'bg-orange-500',
    Meeting: 'bg-pink-500',
    Other: 'bg-white/40',
}

interface CalendarWidgetProps {
    events: CalEvent[]
    onMonthChange?: (year: number, month: number) => void
}

export function CalendarWidget({ events, onMonthChange }: CalendarWidgetProps) {
    const [current, setCurrent] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)

    const changeMonth = (dir: number) => {
        const next = new Date(current.getFullYear(), current.getMonth() + dir, 1)
        setCurrent(next)
        onMonthChange?.(next.getFullYear(), next.getMonth() + 1)
    }

    const days = eachDayOfInterval({
        start: startOfMonth(current),
        end: endOfMonth(current),
    })

    // Pad start
    const startPad = startOfMonth(current).getDay()
    const paddedDays: (Date | null)[] = [...Array(startPad).fill(null), ...days]

    const eventsForDay = (day: Date) =>
        events.filter(e => {
            try { return isSameDay(parseISO(e.date), day) } catch { return false }
        })

    const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

    return (
        <div>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center hover:border-[#C8F000]/30 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <h2 className="font-heading font-bold text-white">{format(current, 'MMMM yyyy')}</h2>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center hover:border-[#C8F000]/30 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-white/30 text-xs py-1">{d}</div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {paddedDays.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />
                    const dayEvents = eventsForDay(day)
                    const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                    const inMonth = isSameMonth(day, current)
                    const todayDay = isToday(day)

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDay(isSelected ? null : day)}
                            className={cn(
                                'relative flex flex-col items-center py-0.5 rounded-lg transition-all aspect-square justify-center',
                                isSelected ? 'bg-[#C8F000] text-[#0D0D0D]' : todayDay ? 'bg-[#C8F000]/10 text-[#C8F000]' : 'hover:bg-[#2A2A2A]',
                                !inMonth && 'opacity-30'
                            )}
                        >
                            <span className={cn('text-xs font-medium', isSelected ? 'text-[#0D0D0D]' : todayDay ? 'text-[#C8F000]' : 'text-white')}>
                                {format(day, 'd')}
                            </span>
                            {dayEvents.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-0.5">
                                    {dayEvents.slice(0, 3).map(ev => (
                                        <div key={ev.id} className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-[#0D0D0D]/50' : (TYPE_COLORS[ev.type] ?? 'bg-white/40'))} />
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 px-1">
                {Object.entries(TYPE_COLORS).slice(0, 5).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                        <div className={cn('w-2 h-2 rounded-full', color)} />
                        <span className="text-white/40 text-[10px]">{type}</span>
                    </div>
                ))}
            </div>

            {/* Selected day events */}
            {selectedDay && (
                <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                    <p className="text-white/50 text-xs font-medium mb-2">{format(selectedDay, 'EEEE, MMMM d')}</p>
                    {selectedEvents.length === 0 ? (
                        <p className="text-white/25 text-sm py-2">No events this day</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedEvents.map(ev => (
                                <div key={ev.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0D0D0D] rounded-xl">
                                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', TYPE_COLORS[ev.type] ?? 'bg-white/30')} />
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">{ev.title}</p>
                                        <p className="text-white/40 text-xs">{ev.type}{ev.required && ' · Required'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Hooks for fetching events ────────────────────────────────────

export function useCalendarEvents(coachId?: string) {
    const [events, setEvents] = useState<CalEvent[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        let query = supabase.from('events').select('id, title, date, type, required').order('date')
        if (coachId) query = query.eq('coach_id', coachId)
        const { data } = await query
        setEvents((data ?? []) as unknown as CalEvent[])
        setLoading(false)
    }, [coachId])

    useEffect(() => { void load() }, [load])
    return { events, loading, reload: load }
}
