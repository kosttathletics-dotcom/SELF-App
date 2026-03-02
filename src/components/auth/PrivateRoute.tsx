import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/database'

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

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        if (role === 'coach') return <Navigate to="/dashboard" replace />
        if (role === 'athlete') return <Navigate to="/athlete/dashboard" replace />
        if (role === 'parent') return <Navigate to="/parent/dashboard" replace />
    }

    return <>{children}</>
}
