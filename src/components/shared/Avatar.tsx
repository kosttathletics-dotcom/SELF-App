import { cn } from '@/lib/utils'

interface AvatarProps {
    name?: string | null
    photoUrl?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
}

export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name ?? 'Avatar'}
                className={cn('rounded-full object-cover flex-shrink-0', sizeMap[size], className)}
            />
        )
    }

    return (
        <div className={cn(
            'rounded-full bg-[#C8F000]/15 border border-[#C8F000]/20 flex items-center justify-center flex-shrink-0 font-bold text-[#C8F000]',
            sizeMap[size],
            className
        )}>
            {initials}
        </div>
    )
}
