import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white/20" />
                </div>
            )}
            <h3 className="font-heading font-semibold text-white text-lg mb-1">{title}</h3>
            {description && <p className="text-white/40 text-sm max-w-xs leading-relaxed">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}
