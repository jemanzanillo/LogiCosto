import { createClient } from '@/lib/supabase/server'
import SidebarShell from './sidebar-shell'

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

  return <SidebarShell nombre={nombre} role={profile?.role ?? 'operador'} />
}
