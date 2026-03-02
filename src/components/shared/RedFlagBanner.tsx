import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RedFlagBannerProps {
    message: string
    dismissable?: boolean
    variant?: 'error' | 'warning'
    className?: string
}

export function RedFlagBanner({ message, dismissable = false, variant = 'error', className }: RedFlagBannerProps) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null

    return (
        <div className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
            variant === 'error'
                ? 'bg-[#FF4444]/10 border-[#FF4444]/20 text-[#FF4444]'
                : 'bg-[#F4A261]/10 border-[#F4A261]/20 text-[#F4A261]',
            className
        )}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1 leading-snug">{message}</p>
            {dismissable && (
                <button onClick={() => setDismissed(true)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
