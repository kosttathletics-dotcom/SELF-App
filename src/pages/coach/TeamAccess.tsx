import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { ShieldCheck, CheckCircle2, XCircle, Clock, Users } from 'lucide-react'

interface TeamUser {
    id: string
    name: string | null
    email: string
    role: string
    approved: boolean
    created_at: string
    linked_athlete_name: string | null
}

export default function TeamAccess() {
    const { user } = useAuth()
    const [users, setUsers] = useState<TeamUser[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')

    const load = useCallback(async () => {
        if (!user) return

        // Fetch all non-coach, non-pending users
        const { data: allUsers } = await supabase
            .from('users')
            .select('id, name, email, role, approved, created_at')
            .in('role', ['athlete', 'parent', 'pending'])
            .order('created_at', { ascending: false })

        const raw = (allUsers ?? []) as TeamUser[]

        // Fetch athlete links (athlete user_id → athlete name)
        const { data: athleteLinks } = await supabase
            .from('athletes')
            .select('user_id, name')
            .not('user_id', 'is', null)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const athleteMap = new Map((athleteLinks ?? []).map((a: any) => [a.user_id as string, a.name as string]))

        // Fetch parent links (parent_id → athlete name)
        const { data: parentLinks } = await supabase
            .from('parent_athlete_links')
            .select('parent_id, athlete_id, athletes(name)')

        const parentMap = new Map<string, string>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const link of (parentLinks ?? []) as any[]) {
            parentMap.set(link.parent_id as string, link.athletes?.name as string ?? 'Unknown')
        }

        const enriched: TeamUser[] = raw.map(u => ({
            ...u,
            linked_athlete_name:
                u.role === 'athlete' ? (athleteMap.get(u.id) ?? null) :
                u.role === 'parent' ? (parentMap.get(u.id) ?? null) :
                null,
        }))

        setUsers(enriched)
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const approveUser = async (userId: string) => {
        await supabase.from('users').update({ approved: true } as never).eq('id', userId)
        void load()
    }

    const rejectUser = async (userId: string) => {
        await supabase.from('users').update({ approved: false } as never).eq('id', userId)
        void load()
    }

    const pendingCount = users.filter(u => !u.approved).length
    const filtered = users.filter(u => {
        if (filter === 'pending') return !u.approved
        if (filter === 'approved') return u.approved
        return true
    })

    return (
        <AppShell title="Team Access">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Team Access</h1>
                    <p className="text-white/40 text-sm mt-0.5">
                        {pendingCount > 0
                            ? <span className="text-[#F4A261]">{pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}</span>
                            : 'All users approved'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C8F000]/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#C8F000]" />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {(['pending', 'approved', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                            filter === f
                                ? 'bg-[#C8F000] text-[#0D0D0D]'
                                : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50')}>
                        {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : f === 'approved' ? `(${users.filter(u => u.approved).length})` : ''}
                    </button>
                ))}
            </div>

            {/* User list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-[#C8F000]/30 mx-auto mb-3" />
                    <p className="text-white font-heading font-semibold">
                        {filter === 'pending' ? 'No pending approvals' : 'No users in this category'}
                    </p>
                    <p className="text-white/30 text-sm mt-1">
                        {filter === 'pending' && 'All registered users have been approved.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(u => (
                        <div key={u.id}
                            className={cn(
                                'bg-[#1A1A1A] border rounded-2xl p-4',
                                !u.approved ? 'border-[#F4A261]/20' : 'border-[#2A2A2A]'
                            )}>
                            <div className="flex items-center gap-3">
                                <Avatar name={u.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="font-heading font-bold text-white text-sm">
                                            {u.name ?? 'No name'}
                                        </span>
                                        <Badge variant={u.role === 'athlete' ? 'info' : u.role === 'parent' ? 'default' : 'warning'}>
                                            {u.role === 'pending' ? 'Setup incomplete' : u.role}
                                        </Badge>
                                        {u.approved ? (
                                            <Badge variant="success">Approved</Badge>
                                        ) : (
                                            <Badge variant="warning">Pending</Badge>
                                        )}
                                    </div>
                                    <p className="text-white/30 text-xs truncate">{u.email}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                                        {u.linked_athlete_name && (
                                            <span className="text-white/50">
                                                {u.role === 'parent' ? `Parent of ${u.linked_athlete_name}` : `Roster: ${u.linked_athlete_name}`}
                                            </span>
                                        )}
                                        <span>Joined {format(parseISO(u.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {u.role !== 'pending' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        {!u.approved ? (
                                            <>
                                                <button
                                                    onClick={() => void approveUser(u.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8F000]/10 text-[#C8F000] border border-[#C8F000]/20 rounded-lg text-xs font-medium hover:bg-[#C8F000]/15 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => void rejectUser(u.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20 rounded-lg text-xs font-medium hover:bg-[#FF4444]/15 transition-colors"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                    Deny
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => void rejectUser(u.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] text-white/40 rounded-lg text-xs font-medium hover:text-white/60 transition-colors"
                                            >
                                                <Clock className="w-3 h-3" />
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    )
}
