import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string | number
    icon?: LucideIcon
    delta?: string
    deltaPositive?: boolean
    accent?: boolean
    className?: string
}

export function StatCard({ label, value, icon: Icon, delta, deltaPositive, accent, className }: StatCardProps) {
    return (
        <div className={cn(
            'bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col gap-3',
            accent && 'border-[#C8F000]/30 bg-[#C8F000]/5',
            className
        )}>
            <div className="flex items-center justify-between">
                <p className="text-white/50 text-sm font-medium">{label}</p>
                {Icon && (
                    <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        accent ? 'bg-[#C8F000]/20' : 'bg-[#2A2A2A]'
                    )}>
                        <Icon className={cn('w-4 h-4', accent ? 'text-[#C8F000]' : 'text-white/60')} />
                    </div>
                )}
            </div>
            <p className={cn(
                'text-3xl font-heading font-bold',
                accent ? 'text-[#C8F000]' : 'text-white'
            )}>{value}</p>
            {delta && (
                <p className={cn('text-xs font-medium', deltaPositive ? 'text-[#C8F000]' : 'text-[#FF4444]')}>
                    {delta}
                </p>
            )}
        </div>
    )
}
