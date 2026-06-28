import { createClient } from '@/lib/supabase/server'
import { resolverPermisos } from '@/lib/auth/permisos'
import CapturaForm from '@/lib/components/captura-form'

export default async function NuevoDocumentoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role, org_id').eq('id', user.id).single()
    : { data: null }
  const permisos = miPerfil
    ? Array.from(await resolverPermisos(supabase, miPerfil.role, miPerfil.org_id))
    : []

  return <CapturaForm permisos={permisos} />
}
