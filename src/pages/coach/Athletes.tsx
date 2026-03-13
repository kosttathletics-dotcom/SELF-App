import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Upload, Mail } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AthleteCard } from '@/components/athletes/AthleteCard'
import { AthleteForm } from '@/components/athletes/AthleteForm'
import { InviteModal } from '@/components/athletes/InviteModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Athlete } from '@/types/database'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPORTS = ['All', 'Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball', 'Track', 'Wrestling', 'Other']
const STATUSES = ['All', 'active', 'inactive', 'injured']

export default function AthletesPage() {
    const { user } = useAuth()
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterSport, setFilterSport] = useState('All')
    const [filterStatus, setFilterStatus] = useState('All')
    const [showForm, setShowForm] = useState(false)
    const [showInvite, setShowInvite] = useState(false)
    const [gpaMap, setGpaMap] = useState<Record<string, number>>({})
    const [injurySet, setInjurySet] = useState<Set<string>>(new Set())

    const load = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data } = await supabase
            .from('athletes')
            .select('*')
            .eq('coach_id', user.id)
            .order('name')
        const list = (data ?? []) as Athlete[]
        setAthletes(list)

        if (list.length > 0) {
            const ids = list.map(a => a.id)
            const [gradesRes, injuriesRes] = await Promise.all([
                supabase.from('grades').select('athlete_id, gpa_points').in('athlete_id', ids),
                supabase.from('injuries').select('athlete_id').eq('status', 'active' as never).in('athlete_id', ids),
            ])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const grades = (gradesRes.data ?? []) as any[]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const injuries = (injuriesRes.data ?? []) as any[]

            const map: Record<string, number[]> = {}
            for (const g of grades) {
                if (!map[g.athlete_id as string]) map[g.athlete_id as string] = []
                map[g.athlete_id as string].push(g.gpa_points as number)
            }
            const gMap: Record<string, number> = {}
            for (const [id, pts] of Object.entries(map)) {
                gMap[id] = parseFloat((pts.reduce((a, b) => a + b, 0) / pts.length).toFixed(2))
            }
            setGpaMap(gMap)
            setInjurySet(new Set(injuries.map((i: { athlete_id: string }) => i.athlete_id)))
        }
        setLoading(false)
    }, [user])

    useEffect(() => { void load() }, [load])

    const filtered = athletes.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.sport ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (a.position ?? '').toLowerCase().includes(search.toLowerCase())
        const matchSport = filterSport === 'All' || a.sport === filterSport
        const matchStatus = filterStatus === 'All' || a.status === filterStatus
        return matchSearch && matchSport && matchStatus
    })

    return (
        <AppShell title="Roster">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white">Roster</h1>
                    <p className="text-white/40 text-sm mt-0.5">{athletes.length} athletes</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-white/70 font-heading font-bold rounded-xl text-sm hover:border-[#C8F000]/40 hover:text-white active:scale-95 transition-all"
                    >
                        <Mail className="w-4 h-4" strokeWidth={2} />
                        <span className="hidden sm:inline">Invite via Email</span>
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        <span className="hidden sm:inline">Add Athlete</span>
                    </button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-3 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, sport, position..."
                        className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <div className="flex-shrink-0">
                        <Filter className="w-4 h-4 text-white/30 mt-2 mx-1" />
                    </div>
                    {SPORTS.map(s => (
                        <button key={s} onClick={() => setFilterSport(s)}
                            className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                filterSport === s ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
                            {s}
                        </button>
                    ))}
                    <div className="w-px bg-[#2A2A2A] mx-1 flex-shrink-0" />
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                                filterStatus === s ? 'bg-[#C8F000] text-[#0D0D0D]' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80')}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Athlete Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={search || filterSport !== 'All' || filterStatus !== 'All' ? 'No athletes match your filters' : 'No athletes yet'}
                    description={search ? 'Try adjusting your search' : 'Add your first athlete to get started'}
                    action={
                        !search && filterSport === 'All' && filterStatus === 'All' ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Athlete
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(a => (
                        <AthleteCard
                            key={a.id}
                            athlete={a}
                            gpa={gpaMap[a.id]}
                            hasActiveInjury={injurySet.has(a.id)}
                        />
                    ))}
                </div>
            )}

            {/* CSV import hint */}
            {athletes.length === 0 && !loading && (
                <div className="mt-6 flex items-center justify-center">
                    <button className="flex items-center gap-2 text-white/30 text-xs hover:text-white/50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Or import from CSV
                    </button>
                </div>
            )}

            {showForm && (
                <AthleteForm
                    onClose={() => setShowForm(false)}
                    onSaved={() => { setShowForm(false); void load() }}
                />
            )}

            {showInvite && (
                <InviteModal
                    role="athlete"
                    onClose={() => { setShowInvite(false); void load() }}
                />
            )}
        </AppShell>
    )
}
