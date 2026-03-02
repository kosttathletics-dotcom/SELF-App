import { useRef, useEffect } from 'react'
import { X, Bell, CheckCheck, AlertTriangle, GraduationCap, Dumbbell, MessageCircle, UserPlus, Info, Calendar } from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNotifications, type Notification } from '@/hooks/useNotifications'

interface NotificationsPanelProps {
    open: boolean
    onClose: () => void
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    gpa_red_flag: { icon: GraduationCap, color: 'text-[#FF4444]', bg: 'bg-[#FF4444]/10' },
    injury_logged: { icon: AlertTriangle, color: 'text-[#F4A261]', bg: 'bg-[#F4A261]/10' },
    workout_missed: { icon: Dumbbell, color: 'text-[#F4A261]', bg: 'bg-[#F4A261]/10' },
    invite_accepted: { icon: UserPlus, color: 'text-[#C8F000]', bg: 'bg-[#C8F000]/10' },
    attendance_alert: { icon: Calendar, color: 'text-[#F4A261]', bg: 'bg-[#F4A261]/10' },
    message_received: { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    general: { icon: Info, color: 'text-white/50', bg: 'bg-[#2A2A2A]' },
}

function NotifCard({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.general
    const Icon = cfg.icon

    return (
        <button
            onClick={() => !n.read && onRead(n.id)}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#2A2A2A]/30 border-b border-[#2A2A2A] last:border-0',
                !n.read && 'bg-[#C8F000]/3'
            )}
        >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                <Icon className={cn('w-4 h-4', cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium leading-tight', n.read ? 'text-white/60' : 'text-white')}>
                        {n.title}
                    </p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-[#C8F000] flex-shrink-0 mt-1.5" />}
                </div>
                {n.body && <p className="text-white/40 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                <p className="text-white/25 text-[10px] mt-1">
                    {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </p>
            </div>
        </button>
    )
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
    const panelRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, onClose])

    // Group by date
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayNotifs = notifications.filter(n => n.created_at.startsWith(today))
    const olderNotifs = notifications.filter(n => !n.created_at.startsWith(today))

    return (
        <>
            {/* Backdrop */}
            {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />}

            {/* Panel */}
            <div
                ref={panelRef}
                className={cn(
                    'fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#0D0D0D] border-l border-[#2A2A2A] flex flex-col transition-transform duration-300 ease-out',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#2A2A2A] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#C8F000]" />
                        <h2 className="font-heading font-bold text-white">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="w-5 h-5 bg-[#C8F000] text-[#0D0D0D] text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={() => void markAllRead()}
                                className="flex items-center gap-1 text-white/40 hover:text-[#C8F000] text-xs transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                All read
                            </button>
                        )}
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
                            <X className="w-3.5 h-3.5 text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Notification list */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mb-4">
                                <Bell className="w-6 h-6 text-white/20" />
                            </div>
                            <p className="font-heading font-semibold text-white/40 text-sm">All caught up</p>
                            <p className="text-white/25 text-xs mt-1 text-center px-8">
                                Alerts for GPA flags, injuries, messages, and more will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            {todayNotifs.length > 0 && (
                                <div>
                                    <p className="px-4 py-2 text-[10px] text-white/30 font-medium uppercase tracking-wider bg-[#0D0D0D] sticky top-0">Today</p>
                                    {todayNotifs.map(n => <NotifCard key={n.id} n={n} onRead={(id) => void markRead(id)} />)}
                                </div>
                            )}
                            {olderNotifs.length > 0 && (
                                <div>
                                    <p className="px-4 py-2 text-[10px] text-white/30 font-medium uppercase tracking-wider bg-[#0D0D0D] sticky top-0">Earlier</p>
                                    {olderNotifs.map(n => <NotifCard key={n.id} n={n} onRead={(id) => void markRead(id)} />)}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-[#2A2A2A] flex-shrink-0">
                        <p className="text-white/25 text-xs text-center">
                            Showing last {notifications.length} notifications · Auto-alerts are generated by the system
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}
