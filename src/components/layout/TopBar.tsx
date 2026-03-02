import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'

interface TopBarProps {
    title?: string
}

export function TopBar({ title }: TopBarProps) {
    const { user } = useAuth()
    const { unreadCount } = useNotifications()
    const [panelOpen, setPanelOpen] = useState(false)

    return (
        <>
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#2A2A2A] flex items-center px-4">
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-[#C8F000] flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-[#0D0D0D]" strokeWidth={2.5} />
                    </div>
                    <span className="font-heading font-bold text-white text-sm">SELF</span>
                </Link>

                {title && (
                    <h1 className="flex-1 text-center font-heading font-semibold text-white text-sm">{title}</h1>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setPanelOpen(true)}
                        className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center relative"
                        aria-label="Notifications"
                    >
                        <Bell className="w-4 h-4 text-white/60" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C8F000] rounded-full flex items-center justify-center text-[#0D0D0D] text-[9px] font-bold px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#C8F000]/20 flex items-center justify-center">
                        <span className="text-[#C8F000] text-xs font-bold">
                            {(user as { name?: string } | null)?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                </div>
            </header>

            <NotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </>
    )
}
