import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/shared/Avatar'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
    currentUrl: string | null
    name: string
    bucket?: string
    onUploaded: (url: string) => void
    size?: 'md' | 'lg' | 'xl'
    className?: string
}

export function PhotoUpload({
    currentUrl,
    name,
    bucket = 'avatars',
    onUploaded,
    size = 'lg',
    className,
}: PhotoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            setError('Please select a JPG, PNG, or WebP image.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.')
            return
        }

        setError(null)
        setUploading(true)

        // Show local preview immediately
        const reader = new FileReader()
        reader.onload = (ev) => setPreview(ev.target?.result as string)
        reader.readAsDataURL(file)

        try {
            const ext = file.name.split('.').pop() ?? 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const filePath = `public/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true, contentType: file.type })

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
            onUploaded(data.publicUrl)
        } catch (err) {
            setError((err as Error).message ?? 'Upload failed')
            setPreview(null)
        } finally {
            setUploading(false)
            // Clear input so same file can be re-selected
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const sizeMap = { md: 'w-10 h-10', lg: 'w-20 h-20', xl: 'w-28 h-28' }
    const iconSize = { md: 'w-3.5 h-3.5', lg: 'w-4 h-4', xl: 'w-5 h-5' }
    const badgePos = { md: '-bottom-0.5 -right-0.5 w-5 h-5', lg: 'bottom-0 right-0 w-7 h-7', xl: 'bottom-1 right-1 w-8 h-8' }

    const displayUrl = preview ?? currentUrl

    return (
        <div className={cn('relative inline-block', className)}>
            <div
                className={cn('relative cursor-pointer group', sizeMap[size])}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                {/* Avatar / image */}
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt={name}
                        className={cn('rounded-full object-cover w-full h-full ring-2 ring-[#C8F000]/20 transition-all group-hover:ring-[#C8F000]/60', uploading && 'opacity-50')}
                    />
                ) : (
                    <Avatar name={name} size={size} />
                )}

                {/* Overlay on hover */}
                <div className={cn(
                    'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
                    uploading && 'opacity-100'
                )}>
                    {uploading
                        ? <Loader2 className={cn('text-white animate-spin', iconSize[size])} />
                        : <Camera className={cn('text-white', iconSize[size])} />
                    }
                </div>

                {/* Camera badge */}
                {!uploading && (
                    <div className={cn(
                        'absolute bg-[#C8F000] rounded-full flex items-center justify-center border-2 border-[#0D0D0D] transition-transform group-hover:scale-110',
                        badgePos[size]
                    )}>
                        <Camera className="w-2.5 h-2.5 text-[#0D0D0D]" />
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="absolute top-full left-0 mt-2 flex items-center gap-1.5 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-2.5 py-1.5 whitespace-nowrap">
                    <X className="w-3 h-3 text-[#FF4444] flex-shrink-0" />
                    <span className="text-[#FF4444] text-xs">{error}</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
            />
        </div>
    )
}
