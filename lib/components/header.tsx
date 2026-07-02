import { createClient } from '@/lib/supabase/server'
import { contarNoLeidas } from '@/app/(protected)/notificaciones/actions'
import LcLogo from './lc-logo'
import SidebarToggle from './sidebar-toggle'
import NotificationBell from './notification-bell'

// Cabecera superior a todo el ancho (hi-fi Panel de inicio, frame Cabecera 88px):
// lockup de marca + campana de notificaciones.
export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const count = user ? await contarNoLeidas() : 0

  return (
    <header className="h-[72px] shrink-0 flex items-center justify-between px-4 sm:px-6 bg-surface-raised border-b border-border">
      <div className="flex items-center">
        <SidebarToggle />
        <LcLogo withWordmark size={40} />
      </div>
      {user && <NotificationBell initialCount={count} />}
    </header>
  )
}
