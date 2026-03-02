import { cn } from '@/lib/utils'

interface ProgressBarProps {
    value: number      // 0–100
    max?: number
    label?: string
    showValue?: boolean
    variant?: 'accent' | 'success' | 'warning' | 'error'
    className?: string
}

const variantColors = {
    accent: 'bg-[#C8F000]',
    success: 'bg-[#C8F000]',
    warning: 'bg-[#F4A261]',
    error: 'bg-[#FF4444]',
}

export function ProgressBar({ value, max = 100, label, showValue = false, variant = 'accent', className }: ProgressBarProps) {
    const pct = Math.min(100, Math.round((value / max) * 100))

    return (
        <div className={cn('space-y-1.5', className)}>
            {(label || showValue) && (
                <div className="flex items-center justify-between text-xs">
                    {label && <span className="text-white/60">{label}</span>}
                    {showValue && <span className="text-white/80 font-medium">{pct}%</span>}
                </div>
            )}
            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all duration-500', variantColors[variant])}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
