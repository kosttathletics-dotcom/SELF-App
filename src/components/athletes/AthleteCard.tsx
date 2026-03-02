import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import type { Athlete } from '@/types/database'

interface AthleteCardProps {
    athlete: Athlete
    gpa?: number | null
    hasActiveInjury?: boolean
    complianceRate?: number | null
}

export function AthleteCard({ athlete, gpa, hasActiveInjury, complianceRate }: AthleteCardProps) {
    const statusVariant = athlete.status === 'active' ? 'success' : athlete.status === 'injured' ? 'error' : 'default'

    return (
        <Link
            to={`/athletes/${athlete.id}`}
            className="block bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 hover:border-[#C8F000]/30 hover:bg-[#1E1E1E] active:scale-[0.98] transition-all group"
        >
            <div className="flex items-start gap-3">
                <Avatar name={athlete.name} photoUrl={athlete.photo_url} size="lg" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold text-white text-sm leading-snug group-hover:text-[#C8F000] transition-colors truncate">
                            {athlete.name}
                        </h3>
                        <Badge variant={statusVariant} className="flex-shrink-0">
                            {athlete.status}
                        </Badge>
                    </div>

                    <p className="text-white/50 text-xs mt-0.5">
                        {[athlete.sport, athlete.position].filter(Boolean).join(' · ')}
                        {athlete.grade ? ` · ${athlete.grade}` : ''}
                    </p>

                    {/* Metrics row */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {gpa !== null && gpa !== undefined && (
                            <div className="flex items-center gap-1">
                                <span className={`text-xs font-medium ${gpa < 2.5 ? 'text-[#FF4444]' : 'text-white/60'}`}>
                                    GPA {gpa.toFixed(2)}
                                </span>
                                {gpa < 2.5 && <AlertTriangle className="w-3 h-3 text-[#FF4444]" />}
                            </div>
                        )}
                        {complianceRate !== null && complianceRate !== undefined && (
                            <span className={`text-xs font-medium ${complianceRate < 70 ? 'text-[#FF4444]' : 'text-white/60'}`}>
                                {complianceRate}% comply
                            </span>
                        )}
                        {hasActiveInjury && (
                            <Badge variant="error">Injured</Badge>
                        )}
                    </div>

                    {/* Measurables */}
                    {(athlete.height || athlete.weight) && (
                        <p className="text-white/30 text-xs mt-1.5">
                            {[athlete.height, athlete.weight ? `${athlete.weight} lbs` : null].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}
