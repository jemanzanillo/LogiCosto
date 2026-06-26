import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/lib/components/logout-button'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single() as unknown as { data: { full_name: string } | null, error: unknown }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center justify-between px-6 bg-brand-primary text-white shadow-md">
        <span className="font-bold tracking-wide text-sm">LogiCosto</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{profile?.full_name ?? user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
