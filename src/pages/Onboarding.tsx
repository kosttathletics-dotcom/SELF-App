import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Zap, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
    const { user, role } = useAuth()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim()) return
        setLoading(true)

        const { error: updateError } = await supabase
            .from('users')
            .update({ name: name.trim() } as never)
            .eq('id', user.id)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        if (role === 'coach') navigate('/dashboard')
        else if (role === 'athlete') navigate('/athlete/dashboard')
        else if (role === 'parent') navigate('/parent/dashboard')
        else navigate('/dashboard')
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C8F000]/5 blur-[100px]" />
            </div>
            <div className="relative w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C8F000] mb-4">
                        <Zap className="w-7 h-7 text-[#0D0D0D]" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-white">Set up your profile</h1>
                    <p className="text-white/50 text-sm mt-1">
                        You're joining as a <span className="text-[#C8F000] capitalize">{role}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border-2 border-dashed border-[#2A2A2A] flex flex-col items-center justify-center cursor-pointer hover:border-[#C8F000]/50 transition-colors">
                            <Camera className="w-6 h-6 text-white/30" />
                            <span className="text-[10px] text-white/30 mt-1">Photo</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                            Your full name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Johnson"
                            className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C8F000] focus:ring-1 focus:ring-[#C8F000] transition-colors text-sm"
                        />
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
                        <p className="text-white/40 text-xs">Email</p>
                        <p className="text-white text-sm mt-0.5">{user?.email}</p>
                    </div>

                    {error && (
                        <p className="text-[#FF4444] text-sm bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full py-3.5 bg-[#C8F000] text-[#0D0D0D] font-heading font-semibold rounded-xl hover:bg-[#d4f520] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            "Let's go →"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
