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

  const nombre = profile?.full_name ?? user?.email ?? ''

  return (
    <aside className="w-[248px] shrink-0 flex flex-col bg-surface-raised border-r border-border overflow-hidden">
      {/* Nav (el logo vive en la cabecera superior) */}
      <NavLinks />

      {/* Pie: tarjeta de usuario + cerrar sesión */}
      <div className="shrink-0 border-t border-border px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          {/* Logo del gestor/tenant actual (LM Aduanas) como imagen del usuario. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lm-aduanas-logo.png"
            alt="LM Aduanas"
            className="h-9 w-auto shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="font-display text-sm font-medium text-text-primary truncate">
              {nombre}
            </div>
            <div className="text-[11px] text-text-secondary capitalize truncate">
              {profile?.role ?? 'operador'}
            </div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
