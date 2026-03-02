import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Role, User } from '@/types/database'

interface AuthContextValue {
    session: Session | null
    supabaseUser: SupabaseUser | null
    user: User | null
    role: Role | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<Role | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setSupabaseUser(session?.user ?? null)
            if (session?.user) {
                fetchUser(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session)
                setSupabaseUser(session?.user ?? null)
                if (session?.user) {
                    fetchUser(session.user.id)
                } else {
                    setUser(null)
                    setRole(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const fetchUser = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setUser(data)
            setRole(data.role as Role)
        }
        setLoading(false)
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setRole(null)
        setSession(null)
        setSupabaseUser(null)
    }

    return (
        <AuthContext.Provider value={{ session, supabaseUser, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside AuthProvider')
    return context
}
