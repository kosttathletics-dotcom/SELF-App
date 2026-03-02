import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard, Users, Dumbbell, GraduationCap,
    MessageCircle, Calendar, Apple, Trophy,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const coachBottomNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/athletes', icon: Users, label: 'Roster' },
    { to: '/training', icon: Dumbbell, label: 'Training' },
    { to: '/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
]

const athleteBottomNav = [
    { to: '/athlete/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/athlete/training', icon: Dumbbell, label: 'Training' },
    { to: '/athlete/nutrition', icon: Apple, label: 'Nutrition' },
    { to: '/athlete/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/athlete/messages', icon: MessageCircle, label: 'Chat' },
]

const parentBottomNav = [
    { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/parent/grades', icon: GraduationCap, label: 'Grades' },
    { to: '/parent/eligibility', icon: Trophy, label: 'NCAA' },
    { to: '/parent/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/parent/calendar', icon: Calendar, label: 'Calendar' },
]

export function BottomNav() {
    const { role } = useAuth()
    const navItems = role === 'coach' ? coachBottomNav : role === 'athlete' ? athleteBottomNav : parentBottomNav

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[#2A2A2A]">
            <div className="flex items-center justify-around pb-safe">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center gap-1 pt-3 pb-2 px-3 min-w-[56px] transition-all',
                                isActive ? 'text-[#C8F000]' : 'text-white/40 hover:text-white/70'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
