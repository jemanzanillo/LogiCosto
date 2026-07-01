import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/lib/components/sidebar'
import Header from '@/lib/components/header'
import { SidebarProvider } from '@/lib/components/sidebar-context'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-surface-page">
        <Header />
        <div className="relative flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
