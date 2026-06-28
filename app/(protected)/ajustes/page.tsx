import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin'
import UsuariosPanel from '@/lib/components/ajustes/usuarios-panel'
import type { UsuarioFila } from '@/lib/components/ajustes/types'

export default async function AjustesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name')

  // Correos vía admin API (requiere service-role). Sin la clave, se omiten.
  const serviceRoleConfigurado = hasServiceRole()
  const emailPorId = new Map<string, string>()
  if (serviceRoleConfigurado) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
      for (const u of data?.users ?? []) {
        if (u.email) emailPorId.set(u.id, u.email)
      }
    } catch {
      // Si falla la admin API, seguimos sin correos.
    }
  }

  const usuarios: UsuarioFila[] = (perfiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    email: emailPorId.get(p.id) ?? null,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">Configuración del equipo y la cuenta.</p>
      </div>

      <UsuariosPanel
        usuarios={usuarios}
        currentUserId={user?.id ?? ''}
        serviceRoleConfigurado={serviceRoleConfigurado}
      />
    </div>
  )
}
