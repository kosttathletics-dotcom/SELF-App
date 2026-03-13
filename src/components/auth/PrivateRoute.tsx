import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/database'
import { Zap } from 'lucide-react'

interface PrivateRouteProps {
    children: React.ReactNode
    allowedRoles?: Role[]
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
    const { user, role, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#C8F000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/60 text-sm font-body">Loading SELF...</p>
                </div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    // Approval gate: non-coach, non-pending users must be approved
    if (user && !user.approved && role !== 'coach' && role !== 'pending') {
        return <PendingApprovalScreen />
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        if (role === 'coach') return <Navigate to="/dashboard" replace />
        if (role === 'athlete') return <Navigate to="/athlete/dashboard" replace />
        if (role === 'parent') return <Navigate to="/parent/dashboard" replace />
    }

    return <>{children}</>
}

function PendingApprovalScreen() {
    const { signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C8F000]/5 blur-[100px]" />
            </div>
            <div className="relative w-full max-w-sm text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8F000] mb-6">
                    <Zap className="w-8 h-8 text-[#0D0D0D]" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-heading font-bold text-white mb-2">
                    Account Pending Approval
                </h1>
                <p className="text-white/50 text-sm leading-relaxed mb-8">
                    Your coach will approve your access shortly.<br />
                    You'll be able to use SELF once approved.
                </p>
                <button
                    onClick={() => void handleSignOut()}
                    className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white/70 rounded-xl text-sm hover:border-[#C8F000]/40 hover:text-white transition-all"
                >
                    Sign out
                </button>
            </div>
        </div>
    )
}
