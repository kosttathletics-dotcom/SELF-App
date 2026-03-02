import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface Notification {
    id: string
    type: string
    title: string
    body: string | null
    related_id: string | null
    read: boolean
    created_at: string
}

export function useNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const load = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        const notifs = (data ?? []) as unknown as Notification[]
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read).length)
    }, [user])

    const markRead = useCallback(async (id: string) => {
        await supabase.from('notifications').update({ read: true } as never).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }, [])

    const markAllRead = useCallback(async () => {
        if (!user) return
        await supabase.from('notifications')
            .update({ read: true } as never)
            .eq('user_id', user.id)
            .eq('read', false as never)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }, [user])

    useEffect(() => {
        void load()

        if (!user) return

        // Real-time subscription for new notifications
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, payload => {
                const n = payload.new as unknown as Notification
                setNotifications(prev => [n, ...prev])
                setUnreadCount(prev => prev + 1)
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                void supabase.removeChannel(channelRef.current)
            }
        }
    }, [user, load])

    return { notifications, unreadCount, markRead, markAllRead, reload: load }
}
