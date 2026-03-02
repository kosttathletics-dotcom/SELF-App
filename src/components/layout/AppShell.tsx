import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
    children: React.ReactNode
    title?: string
}

export function AppShell({ children, title }: AppShellProps) {
    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Mobile top bar */}
            <TopBar title={title} />

            {/* Main content */}
            <main className="lg:ml-60 min-h-screen">
                <div className="pt-14 lg:pt-0 pb-20 lg:pb-0 px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile bottom nav */}
            <BottomNav />
        </div>
    )
}
