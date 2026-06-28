import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin'
import UsuariosPanel from '@/lib/components/ajustes/usuarios-panel'
import PermisosPanel from '@/lib/components/ajustes/permisos-panel'
import type { UsuarioFila } from '@/lib/components/ajustes/types'
import { DEFAULT_PERMISOS, ROLES_CONFIGURABLES } from '@/lib/auth/permisos'

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

  const miPerfil = (perfiles ?? []).find((p) => p.id === user?.id)
  const esTitular = miPerfil?.role === 'titular'

  const usuarios: UsuarioFila[] = (perfiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    email: emailPorId.get(p.id) ?? null,
  }))

  // Permisos vigentes por rol configurable (RLS limita a la propia org).
  // Si un rol no tiene filas, se muestran los defaults hasta el primer guardado.
  const { data: permRows } = await supabase
    .from('role_permissions')
    .select('role, action, allowed')

  const permisos: Record<string, string[]> = {}
  for (const r of ROLES_CONFIGURABLES) {
    const filas = (permRows ?? []).filter((p) => p.role === r)
    permisos[r] =
      filas.length === 0
        ? [...DEFAULT_PERMISOS[r]]
        : filas.filter((p) => p.allowed).map((p) => p.action)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">Configuración del equipo y la cuenta.</p>
      </div>

      <UsuariosPanel
        usuarios={usuarios}
        currentUserId={user?.id ?? ''}
        serviceRoleConfigurado={serviceRoleConfigurado}
        esTitular={esTitular}
      />

      <PermisosPanel
        permisos={permisos}
        serviceRoleConfigurado={serviceRoleConfigurado}
        esTitular={esTitular}
      />
    </div>
  )
}
