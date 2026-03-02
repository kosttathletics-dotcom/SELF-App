import { cn } from '@/lib/utils'

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    children: React.ReactNode
    className?: string
}

const variants = {
    default: 'bg-[#2A2A2A] text-white/60',
    success: 'bg-[#C8F000]/15 text-[#C8F000]',
    warning: 'bg-[#F4A261]/15 text-[#F4A261]',
    error: 'bg-[#FF4444]/15 text-[#FF4444]',
    info: 'bg-blue-500/15 text-blue-400',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            variants[variant],
            className
        )}>
            {children}
        </span>
    )
}
