import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/shared/Avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'

interface Thread {
    id: string
    participant_id: string
    participant_name: string
    participant_photo: string | null
    participant_role: string
    last_message: string | null
    last_message_at: string | null
    unread: number
}

interface Message {
    id: string
    thread_id: string
    sender_id: string
    content: string
    created_at: string
    is_mine?: boolean
}

function formatDate(ts: string) {
    const d = parseISO(ts)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
}

export default function MessagesPage() {
    const { user } = useAuth()
    const [threads, setThreads] = useState<Thread[]>([])
    const [selected, setSelected] = useState<Thread | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMsg, setNewMsg] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const loadThreads = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('message_threads')
            .select('*')
            .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
            .order('last_message_at', { ascending: false })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (data ?? []) as any[]
        const threadList: Thread[] = await Promise.all(raw.map(async t => {
            const otherId = t.participant_a === user.id ? t.participant_b : t.participant_a
            const { data: profile } = await supabase.from('profiles').select('name, photo_url, role').eq('id', otherId).single()
            const p = (profile as unknown as { name: string; photo_url: string | null; role: string } | null)
            return {
                id: t.id as string,
                participant_id: otherId as string,
                participant_name: p?.name ?? 'Unknown',
                participant_photo: p?.photo_url ?? null,
                participant_role: p?.role ?? 'user',
                last_message: t.last_message as string | null,
                last_message_at: t.last_message_at as string | null,
                unread: 0,
            }
        }))
        setThreads(threadList)
        setLoading(false)
    }, [user])

    const loadMessages = useCallback(async (threadId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msgs = (data ?? []) as any[]
        setMessages(msgs.map(m => ({ ...m, is_mine: m.sender_id === user?.id } as Message)))
    }, [user])

    useEffect(() => { void loadThreads() }, [loadThreads])

    useEffect(() => {
        if (!selected) return
        void loadMessages(selected.id)

        // Real-time subscription
        const channel = supabase
            .channel(`thread-${selected.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `thread_id=eq.${selected.id}`,
            }, payload => {
                const msg = payload.new as Message
                setMessages(prev => [...prev, { ...msg, is_mine: msg.sender_id === user?.id }])
            })
            .subscribe()

        return () => { void supabase.removeChannel(channel) }
    }, [selected, loadMessages, user])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!newMsg.trim() || !selected || !user) return
        setSending(true)
        const content = newMsg.trim()
        setNewMsg('')
        await supabase.from('messages').insert({
            thread_id: selected.id, sender_id: user.id, content,
        } as never)
        await supabase.from('message_threads').update({
            last_message: content, last_message_at: new Date().toISOString(),
        } as never).eq('id', selected.id)
        setSending(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() }
    }

    return (
        <AppShell title="Messages">
            <div className="flex gap-0 h-[calc(100vh-10rem)] min-h-[400px]">
                {/* Thread list */}
                <div className={cn('flex flex-col border-r border-[#2A2A2A] transition-all',
                    selected ? 'hidden lg:flex lg:w-80' : 'w-full lg:w-80')}>
                    <div className="p-4 border-b border-[#2A2A2A] flex-shrink-0">
                        <h1 className="text-xl font-heading font-bold text-white">Messages</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-[#2A2A2A]">
                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map(i => <div key={i} className="flex gap-3 items-center"><div className="w-10 h-10 rounded-full bg-[#2A2A2A] animate-pulse" /><div className="flex-1 space-y-1"><div className="h-4 bg-[#2A2A2A] rounded animate-pulse" /><div className="h-3 bg-[#2A2A2A] rounded w-2/3 animate-pulse" /></div></div>)}
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <MessageCircle className="w-10 h-10 text-white/20 mb-3" />
                                <p className="text-white/50 text-sm font-heading font-semibold">No messages yet</p>
                                <p className="text-white/30 text-xs mt-1">Conversations with your athletes and parents appear here</p>
                            </div>
                        ) : (
                            threads.map(t => (
                                <button key={t.id} onClick={() => setSelected(t)}
                                    className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2A2A]/30 transition-colors text-left',
                                        selected?.id === t.id ? 'bg-[#C8F000]/5 border-r-2 border-[#C8F000]' : '')}>
                                    <div className="relative flex-shrink-0">
                                        <Avatar name={t.participant_name} photoUrl={t.participant_photo} size="md" />
                                        <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0D0D0D]',
                                            t.participant_role === 'coach' ? 'bg-[#C8F000]' : t.participant_role === 'parent' ? 'bg-blue-400' : 'bg-[#F4A261]')} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <p className="font-medium text-white text-sm truncate">{t.participant_name}</p>
                                            {t.last_message_at && <span className="text-white/30 text-[10px] flex-shrink-0">{formatDate(t.last_message_at)}</span>}
                                        </div>
                                        <p className="text-white/40 text-xs truncate mt-0.5">{t.last_message ?? 'No messages yet'}</p>
                                    </div>
                                    {t.unread > 0 && <span className="flex-shrink-0 w-5 h-5 bg-[#C8F000] text-[#0D0D0D] text-[10px] font-bold rounded-full flex items-center justify-center">{t.unread}</span>}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Message pane */}
                {selected ? (
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A2A] flex-shrink-0">
                            <button onClick={() => setSelected(null)} className="lg:hidden text-white/40 hover:text-white/70 mr-1">←</button>
                            <Avatar name={selected.participant_name} photoUrl={selected.participant_photo} size="sm" />
                            <div>
                                <p className="font-heading font-semibold text-white text-sm">{selected.participant_name}</p>
                                <p className="text-white/40 text-xs capitalize">{selected.participant_role}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-white/30 text-sm">Send a message to start the conversation</p>
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const showDate = i === 0 || format(parseISO(messages[i - 1].created_at), 'yyyy-MM-dd') !== format(parseISO(msg.created_at), 'yyyy-MM-dd')
                                return (
                                    <div key={msg.id}>
                                        {showDate && (
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-[#2A2A2A]" />
                                                <span className="text-white/25 text-xs flex-shrink-0">{formatDate(msg.created_at)}</span>
                                                <div className="flex-1 h-px bg-[#2A2A2A]" />
                                            </div>
                                        )}
                                        <div className={cn('flex gap-2', msg.is_mine ? 'justify-end' : 'justify-start')}>
                                            {!msg.is_mine && <Avatar name={selected.participant_name} photoUrl={selected.participant_photo} size="xs" />}
                                            <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                                                msg.is_mine
                                                    ? 'bg-[#C8F000] text-[#0D0D0D] rounded-br-md'
                                                    : 'bg-[#2A2A2A] text-white rounded-bl-md')}>
                                                {msg.content}
                                                <p className={cn('text-[10px] mt-1', msg.is_mine ? 'text-[#0D0D0D]/50 text-right' : 'text-white/30')}>
                                                    {format(parseISO(msg.created_at), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-[#2A2A2A] flex-shrink-0 flex gap-3 items-end">
                            <textarea
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                placeholder={`Message ${selected.participant_name}...`}
                                className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] transition-colors text-sm resize-none max-h-32"
                                style={{ height: 'auto', minHeight: '48px' }}
                            />
                            <button
                                onClick={() => void sendMessage()}
                                disabled={!newMsg.trim() || sending}
                                className="w-10 h-10 bg-[#C8F000] text-[#0D0D0D] rounded-xl flex items-center justify-center hover:bg-[#d4f520] active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                            <p className="text-white/40">Select a conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
