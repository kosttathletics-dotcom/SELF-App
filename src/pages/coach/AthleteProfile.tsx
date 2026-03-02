import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Edit2, FileText, Trash2, ExternalLink,
    Instagram, Twitter, Youtube, Link as LinkIcon, Zap,
    AlertTriangle, GraduationCap, Trophy, ClipboardList, Apple, StickyNote,
    Dumbbell
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AthleteForm } from '@/components/athletes/AthleteForm'
import { EligibilityTab } from '@/components/eligibility/EligibilityTab'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { supabase } from '@/lib/supabase'
import type { Athlete, Grade, Injury, PersonalRecord } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { calculateGPA } from '@/lib/gpa'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'training' | 'grades' | 'eligibility' | 'recruiting' | 'attendance' | 'nutrition' | 'notes'

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'training', label: 'Training', icon: Dumbbell },
    { id: 'grades', label: 'Grades', icon: GraduationCap },
    { id: 'eligibility', label: 'Eligibility', icon: Trophy },
    { id: 'recruiting', label: 'Recruiting', icon: Trophy },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'notes', label: 'Notes', icon: StickyNote },
]

export default function AthleteProfilePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [athlete, setAthlete] = useState<Athlete | null>(null)
    const [grades, setGrades] = useState<Grade[]>([])
    const [injuries, setInjuries] = useState<Injury[]>([])
    const [prs, setPrs] = useState<PersonalRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('overview')
    const [showEdit, setShowEdit] = useState(false)

    const load = useCallback(async () => {
        if (!id) return
        const [athRes, gradesRes, injuriesRes, prsRes] = await Promise.all([
            supabase.from('athletes').select('*').eq('id', id).single(),
            supabase.from('grades').select('*').eq('athlete_id', id).order('created_at', { ascending: false }),
            supabase.from('injuries').select('*').eq('athlete_id', id).order('date', { ascending: false }),
            supabase.from('personal_records').select('*, exercises(name)').eq('athlete_id', id).eq('is_pr', true).order('created_at', { ascending: false }),
        ])
        setAthlete((athRes.data as unknown as Athlete) ?? null)
        setGrades((gradesRes.data as unknown as Grade[]) ?? [])
        setInjuries((injuriesRes.data as unknown as Injury[]) ?? [])
        setPrs((prsRes.data as unknown as PersonalRecord[]) ?? [])
        setLoading(false)
    }, [id])

    useEffect(() => { void load() }, [load])

    const handleDelete = async () => {
        if (!athlete) return
        if (!confirm(`Delete ${athlete.name}? This cannot be undone.`)) return
        await supabase.from('athletes').delete().eq('id', athlete.id)
        navigate('/athletes')
    }

    if (loading) {
        return (
            <AppShell title="Athlete">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 w-32 bg-[#2A2A2A] rounded-lg" />
                    <div className="h-40 bg-[#1A1A1A] rounded-2xl" />
                </div>
            </AppShell>
        )
    }

    if (!athlete) {
        return (
            <AppShell title="Not Found">
                <div className="text-center py-20">
                    <p className="text-white/40">Athlete not found</p>
                    <Link to="/athletes" className="text-[#C8F000] text-sm mt-2 inline-block">← Back to Roster</Link>
                </div>
            </AppShell>
        )
    }

    const gpa = grades.length > 0 ? calculateGPA(grades.map(g => ({ gpa_points: g.gpa_points }))) : null
    const activeInjury = injuries.find(i => i.status === 'active')

    return (
        <AppShell title={athlete.name}>
            {/* Back */}
            <Link to="/athletes" className="inline-flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 mb-4 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Roster
            </Link>

            {/* Hero card */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-4">
                    <Avatar name={athlete.name} photoUrl={athlete.photo_url} size="xl" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h1 className="text-xl font-heading font-bold text-white">{athlete.name}</h1>
                                <p className="text-white/50 text-sm">
                                    {[athlete.sport, athlete.position, athlete.grade].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowEdit(true)}
                                    className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5 text-white/60" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center hover:bg-[#FF4444]/20 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-white/60" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant={athlete.status === 'active' ? 'success' : athlete.status === 'injured' ? 'error' : 'default'}>
                                {athlete.status}
                            </Badge>
                            {gpa !== null && (
                                <Badge variant={gpa < 2.5 ? 'error' : 'success'}>
                                    GPA {gpa.toFixed(2)}
                                </Badge>
                            )}
                            {activeInjury && <Badge variant="error">🤕 {activeInjury.body_part ?? 'Injured'}</Badge>}
                            {athlete.age_group && <Badge>{athlete.age_group}</Badge>}
                        </div>

                        {/* Measurables */}
                        {(athlete.height || athlete.weight) && (
                            <div className="flex gap-4 mt-3">
                                {athlete.height && (
                                    <div>
                                        <p className="text-white/30 text-xs">Height</p>
                                        <p className="text-white font-medium text-sm">{athlete.height}</p>
                                    </div>
                                )}
                                {athlete.weight && (
                                    <div>
                                        <p className="text-white/30 text-xs">Weight</p>
                                        <p className="text-white font-medium text-sm">{athlete.weight} lbs</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Report buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#2A2A2A]">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#C8F000]/10 border border-[#C8F000]/20 text-[#C8F000] rounded-lg text-xs font-medium hover:bg-[#C8F000]/15 transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                        Recruiting Report
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#2A2A2A] text-white/70 rounded-lg text-xs font-medium hover:bg-[#3A3A3A] transition-colors">
                        <Trophy className="w-3.5 h-3.5" />
                        Eligibility Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn('flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                            tab === t.id ? 'bg-[#C8F000]/10 text-[#C8F000]' : 'text-white/40 hover:text-white/70 hover:bg-[#1A1A1A]')}>
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && <OverviewTab athlete={athlete} grades={grades} injuries={injuries} prs={prs} gpa={gpa} />}
            {tab === 'training' && <TrainingTab athleteId={athlete.id} prs={prs} />}
            {tab === 'grades' && <GradesTab grades={grades} athleteId={athlete.id} onRefresh={load} />}
            {tab === 'eligibility' && <EligibilityTab athleteId={athlete.id} sport={athlete.sport} />}
            {tab === 'recruiting' && <RecruitingTab athlete={athlete} />}
            {tab === 'attendance' && <AttendanceTab athleteId={athlete.id} />}
            {tab === 'nutrition' && <NutritionTab athleteId={athlete.id} />}
            {tab === 'notes' && <NotesTab athlete={athlete} onSaved={load} />}

            {showEdit && (
                <AthleteForm
                    athlete={athlete}
                    onClose={() => setShowEdit(false)}
                    onSaved={() => { setShowEdit(false); void load() }}
                />
            )}
        </AppShell>
    )
}

/* ─── Overview Tab ─── */
function OverviewTab({ athlete, grades: _grades, injuries, prs, gpa }: {
    athlete: Athlete; grades: Grade[]; injuries: Injury[]; prs: PersonalRecord[]; gpa: number | null
}) {
    const socialLinks = [
        { key: 'hudl_url', label: 'HUDL', icon: Youtube, value: athlete.hudl_url },
        { key: 'instagram', label: 'Instagram', icon: Instagram, value: athlete.instagram },
        { key: 'twitter', label: 'Twitter/X', icon: Twitter, value: athlete.twitter },
        { key: 'tiktok', label: 'TikTok', icon: LinkIcon, value: athlete.tiktok },
        { key: 'recruiting_url', label: 'Recruiting', icon: ExternalLink, value: athlete.recruiting_url },
    ].filter(s => s.value)

    const active = injuries.filter(i => i.status === 'active')

    return (
        <div className="space-y-5">
            {/* Stat overview */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-heading font-bold', gpa !== null && gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                        {gpa !== null ? gpa.toFixed(2) : '—'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">GPA</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className="text-2xl font-heading font-bold text-white">{prs.length}</p>
                    <p className="text-white/40 text-xs mt-1">PRs</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-heading font-bold', active.length > 0 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                        {active.length > 0 ? active.length : '✓'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{active.length > 0 ? 'Injuries' : 'Healthy'}</p>
                </div>
            </div>

            {/* Active Injuries */}
            {active.length > 0 && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-[#FF4444]" />
                        <h3 className="text-[#FF4444] font-heading font-semibold text-sm">Active Injuries</h3>
                    </div>
                    <div className="space-y-2">
                        {active.map(inj => (
                            <div key={inj.id} className="flex items-center justify-between text-sm">
                                <span className="text-white">{inj.body_part ?? 'Unknown'} — {inj.type}</span>
                                <Badge variant="error">{inj.severity}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Digital presence */}
            {socialLinks.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                    <h3 className="font-heading font-semibold text-white text-sm mb-3">Digital Presence</h3>
                    <div className="flex flex-wrap gap-2">
                        {socialLinks.map(({ key, label, icon: Icon, value }) => (
                            <a key={key} href={value!.startsWith('http') ? value! : `https://${value}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] rounded-lg text-white/70 text-xs hover:text-[#C8F000] hover:bg-[#2A2A2A]/70 transition-colors">
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent PRs */}
            {prs.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A2A]">
                        <Zap className="w-3.5 h-3.5 text-[#C8F000]" />
                        <h3 className="font-heading font-semibold text-white text-sm">Personal Records</h3>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {prs.slice(0, 5).map(pr => (
                            <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                                <span className="text-white text-sm">{(pr as unknown as { exercises?: { name: string } }).exercises?.name ?? 'Exercise'}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#C8F000] font-heading font-bold text-sm">{pr.weight} lbs</span>
                                    <span className="text-white/30 text-xs">1RM: {pr.estimated_1rm}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Training Tab ─── */
function TrainingTab({ athleteId, prs }: { athleteId: string; prs: PersonalRecord[] }) {
    const [logs, setLogs] = useState<{ date: string; completed: boolean }[]>([])
    useEffect(() => {
        supabase.from('workout_logs').select('date, completed').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(20)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(({ data }) => setLogs((data ?? []) as any[]))
    }, [athleteId])

    const completed = logs.filter(l => l.completed).length
    const compliance = logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0

    return (
        <div className="space-y-5">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-white text-sm">Compliance Rate</h3>
                    <span className={cn('text-lg font-heading font-bold', compliance >= 70 ? 'text-[#C8F000]' : 'text-[#FF4444]')}>{compliance}%</span>
                </div>
                <ProgressBar value={compliance} variant={compliance >= 70 ? 'accent' : 'error'} showValue />
                <p className="text-white/30 text-xs mt-2">{completed} of {logs.length} workouts completed (last 20)</p>
            </div>

            {prs.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A2A]">
                        <Zap className="w-3.5 h-3.5 text-[#C8F000]" />
                        <h3 className="font-heading font-semibold text-white text-sm">All PRs</h3>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {prs.map(pr => (
                            <div key={pr.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <span className="text-white">{(pr as unknown as { exercises?: { name: string } }).exercises?.name ?? 'Exercise'}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 text-xs">{format(parseISO(pr.date), 'MMM d, yyyy')}</span>
                                    <span className="text-[#C8F000] font-heading font-bold">{pr.weight} lbs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Grades Tab ─── */
function GradesTab({ grades, athleteId, onRefresh }: { grades: Grade[]; athleteId: string; onRefresh: () => void }) {
    const [showAdd, setShowAdd] = useState(false)
    const { user } = useAuth()
    const [form, setForm] = useState({ subject: '', quarter: 'Q1', school_year: '2025-2026', grade_value: '' })
    const [saving, setSaving] = useState(false)

    const gpa = grades.length > 0 ? calculateGPA(grades.map(g => ({ gpa_points: g.gpa_points }))) : null

    const letterToPoints = (v: number) => v >= 90 ? 4.0 : v >= 80 ? 3.0 : v >= 70 ? 2.0 : v >= 60 ? 1.0 : 0.0
    const letterFromValue = (v: number) => v >= 90 ? 'A' : v >= 80 ? 'B' : v >= 70 ? 'C' : v >= 60 ? 'D' : 'F'

    const saveGrade = async () => {
        if (!form.subject || !form.grade_value || !user) return
        setSaving(true)
        const val = parseFloat(form.grade_value)
        await supabase.from('grades').insert({
            athlete_id: athleteId, coach_id: user.id,
            subject: form.subject, quarter: form.quarter as Grade['quarter'],
            school_year: form.school_year, grade_value: val,
            letter_grade: letterFromValue(val), gpa_points: letterToPoints(val),
        } as never)
        setSaving(false)
        setShowAdd(false)
        onRefresh()
    }

    const inputCls = 'w-full px-3 py-2 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm'

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/50 text-xs">Cumulative GPA</p>
                    <p className={cn('text-3xl font-heading font-bold', gpa !== null && gpa < 2.5 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>
                        {gpa !== null ? gpa.toFixed(2) : '—'}
                    </p>
                    {gpa !== null && gpa < 2.5 && (
                        <p className="text-[#FF4444] text-xs mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Below 2.5 threshold</p>
                    )}
                </div>
                <button onClick={() => setShowAdd(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#C8F000]/10 border border-[#C8F000]/20 text-[#C8F000] rounded-lg text-xs font-medium hover:bg-[#C8F000]/15 transition-colors">
                    + Add Grade
                </button>
            </div>

            {showAdd && (
                <div className="bg-[#1A1A1A] border border-[#C8F000]/20 rounded-xl p-4 space-y-3">
                    <h3 className="font-heading font-semibold text-white text-sm">Add Grade</h3>
                    <input className={inputCls} placeholder="Subject (e.g. English, Math)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-2">
                        <select className={inputCls} value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}>
                            {['Q1', 'Q2', 'Q3', 'Q4', 'Semester 1', 'Semester 2', 'Final'].map(q => <option key={q}>{q}</option>)}
                        </select>
                        <input className={inputCls} placeholder="Year" value={form.school_year} onChange={e => setForm(f => ({ ...f, school_year: e.target.value }))} />
                        <input className={inputCls} type="number" min="0" max="100" placeholder="Grade (0-100)" value={form.grade_value} onChange={e => setForm(f => ({ ...f, grade_value: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={saveGrade} disabled={saving || !form.subject || !form.grade_value}
                            className="flex-1 py-2 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-[#2A2A2A] text-white/70 rounded-lg text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {grades.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No grades logged yet</p>
            ) : (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-4 px-4 py-2 border-b border-[#2A2A2A] text-white/30 text-xs">
                        <span>Subject</span><span>Quarter</span><span>Grade</span><span className="text-right">GPA Pts</span>
                    </div>
                    <div className="divide-y divide-[#2A2A2A]">
                        {grades.map(g => (
                            <div key={g.id} className="grid grid-cols-4 px-4 py-3 text-sm items-center">
                                <span className="text-white">{g.subject}</span>
                                <span className="text-white/50 text-xs">{g.quarter}</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn('font-heading font-bold', (g.gpa_points) < 2.0 ? 'text-[#FF4444]' : 'text-white')}>{g.letter_grade}</span>
                                    <span className="text-white/30 text-xs">{g.grade_value}</span>
                                </div>
                                <span className={cn('text-right font-medium', g.gpa_points < 2.0 ? 'text-[#FF4444]' : 'text-[#C8F000]')}>{g.gpa_points.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


/* ─── Recruiting Tab ─── */
function RecruitingTab({ athlete }: { athlete: Athlete }) {
    return (
        <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                <h3 className="font-heading font-semibold text-white text-sm mb-3">Measurables</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Height', value: athlete.height ?? '—' },
                        { label: 'Weight', value: athlete.weight ? `${athlete.weight} lbs` : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[#0D0D0D] rounded-lg p-3">
                            <p className="text-white/40 text-xs">{label}</p>
                            <p className="text-white font-medium text-sm mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
                <Trophy className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Division fit comparison and benchmark tables are built in Phase 4.</p>
            </div>
        </div>
    )
}

/* ─── Attendance Tab (placeholder) ─── */
function AttendanceTab({ athleteId: _ }: { athleteId: string }) {
    return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
            <ClipboardList className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-white mb-1">Attendance Records</h3>
            <p className="text-white/40 text-sm">Built in Phase 5 with event check-in tracking.</p>
        </div>
    )
}

/* ─── Nutrition Tab (placeholder) ─── */
function NutritionTab({ athleteId: _ }: { athleteId: string }) {
    return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
            <Apple className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-white mb-1">Nutrition Log</h3>
            <p className="text-white/40 text-sm">Athlete nutrition logs will appear here once they start logging meals.</p>
        </div>
    )
}

/* ─── Notes Tab ─── */
function NotesTab({ athlete, onSaved }: { athlete: Athlete; onSaved: () => void }) {
    const [notes, setNotes] = useState(athlete.notes ?? '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const saveNotes = async () => {
        setSaving(true)
        await supabase.from('athletes').update({ notes } as never).eq('id', athlete.id)
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSaved()
    }

    return (
        <div className="space-y-3">
            <h3 className="font-heading font-semibold text-white text-sm">Coach Notes</h3>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={12}
                placeholder="Add private coach notes about this athlete..."
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm resize-none"
            />
            <button onClick={saveNotes} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-bold rounded-xl text-sm hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Notes'}
            </button>
        </div>
    )
}


