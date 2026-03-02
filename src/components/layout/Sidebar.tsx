import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, Dumbbell, GraduationCap,
    MessageCircle, Calendar, Settings, Zap, LogOut,
    Trophy, ClipboardList, Apple,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const coachNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/athletes', icon: Users, label: 'Roster' },
    { to: '/training', icon: Dumbbell, label: 'Training' },
    { to: '/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

const athleteNav = [
    { to: '/athlete/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/athlete/training', icon: Dumbbell, label: 'Training' },
    { to: '/athlete/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/athlete/nutrition', icon: Apple, label: 'Nutrition' },
    { to: '/athlete/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/athlete/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/athlete/profile', icon: Settings, label: 'Profile' },
]

const parentNav = [
    { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/parent/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/parent/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/parent/eligibility', icon: Trophy, label: 'Eligibility' },
    { to: '/parent/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/parent/calendar', icon: Calendar, label: 'Calendar' },
]

export function Sidebar() {
    const { role, user, signOut } = useAuth()
    const navigate = useNavigate()

    const navItems = role === 'coach' ? coachNav : role === 'athlete' ? athleteNav : parentNav

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#0D0D0D] border-r border-[#2A2A2A] fixed left-0 top-0 bottom-0 z-30">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-[#2A2A2A]">
                <div className="w-8 h-8 rounded-lg bg-[#C8F000] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#0D0D0D]" strokeWidth={2.5} />
                </div>
                <span className="font-heading font-bold text-lg text-white tracking-tight">SELF</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-[#C8F000]/10 text-[#C8F000]'
                                    : 'text-white/50 hover:text-white hover:bg-[#1A1A1A]'
                            )
                        }
                    >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User + sign out */}
            <div className="px-3 py-4 border-t border-[#2A2A2A]">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-[#C8F000]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#C8F000] text-xs font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{user?.name ?? 'Set up profile'}</p>
                        <p className="text-white/30 text-[10px] capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-[#1A1A1A] transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    )
}
