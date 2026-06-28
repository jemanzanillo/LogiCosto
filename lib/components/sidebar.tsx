import { createClient } from '@/lib/supabase/server'
import NavLinks from './nav-links'
import LogoutButton from './logout-button'

export default async function Sidebar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
    : { data: null }

  return (
    <aside className="w-[237px] shrink-0 flex flex-col bg-brand-marino-800 overflow-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/10 shrink-0">
        <span className="font-bold tracking-wide text-sm text-white">LogiCosto</span>
      </div>

      {/* Nav */}
      <NavLinks />

      {/* Footer: perfil + salir */}
      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <div className="text-[11px] text-white/40 capitalize">
          {profile?.role ?? 'operador'}
        </div>
        <div className="text-sm font-medium text-white truncate mb-2">
          {profile?.full_name ?? user?.email ?? ''}
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
