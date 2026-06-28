import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

// Catálogo de permisos de LogiCosto.
// ------------------------------------------------------------------
// El TITULAR siempre tiene acceso total (no se almacena en BD: se resuelve aquí).
// Los permisos de los roles NO-titular (suplente/operador) viven en la tabla
// `role_permissions` (org_id, role, action, allowed) y los configura el titular
// en Ajustes. Falla cerrado: ausencia de fila = denegado.
//
// La gestión de equipo (invitar / cambiar rol / editar permisos) NO está en este
// catálogo: es exclusiva del titular y no es delegable (frontera de seguridad).

export type Accion =
  | 'documento.crear'
  | 'documento.editar'
  | 'documento.exportar'
  | 'documento.version_crear'
  | 'documento.aprobar'
  | 'documento.revertir'
  | 'documento.duplicar'
  | 'documento.eliminar'
  | 'documento.importar' // reservada (bloque 4/7)
  | 'importador.gestionar' // reservada (bloque 5)

export type AccionDef = {
  key: Accion
  label: string
  descripcion: string
  grupo: 'Documentos' | 'Ciclo de estados' | 'Datos maestros'
  // false = reservada para un bloque futuro: se muestra en la matriz pero
  // deshabilitada y aún no se aplica en ninguna acción del servidor.
  disponible: boolean
}

export const ACCIONES: AccionDef[] = [
  {
    key: 'documento.crear',
    label: 'Crear documento',
    descripcion: 'Registrar una factura nueva.',
    grupo: 'Documentos',
    disponible: true,
  },
  {
    key: 'documento.editar',
    label: 'Editar borrador',
    descripcion: 'Modificar un documento en estado Borrador.',
    grupo: 'Documentos',
    disponible: true,
  },
  {
    key: 'documento.duplicar',
    label: 'Duplicar',
    descripcion: 'Crear una copia de un documento existente.',
    grupo: 'Documentos',
    disponible: true,
  },
  {
    key: 'documento.exportar',
    label: 'Exportar PDF',
    descripcion: 'Generar el PDF y pasar el documento a Pendiente.',
    grupo: 'Ciclo de estados',
    disponible: true,
  },
  {
    key: 'documento.version_crear',
    label: 'Crear nueva versión',
    descripcion: 'Reabrir un documento Pendiente/Aprobado para corregirlo.',
    grupo: 'Ciclo de estados',
    disponible: true,
  },
  {
    key: 'documento.aprobar',
    label: 'Aprobar',
    descripcion: 'Marcar un documento como Aprobado.',
    grupo: 'Ciclo de estados',
    disponible: true,
  },
  {
    key: 'documento.revertir',
    label: 'Revertir a pendiente',
    descripcion: 'Devolver un documento Aprobado a Pendiente.',
    grupo: 'Ciclo de estados',
    disponible: true,
  },
  {
    key: 'documento.eliminar',
    label: 'Eliminar',
    descripcion: 'Borrar un documento y todas sus versiones.',
    grupo: 'Documentos',
    disponible: true,
  },
  {
    key: 'documento.importar',
    label: 'Importar históricos',
    descripcion: 'Cargar facturas desde Excel / respaldo offline.',
    grupo: 'Datos maestros',
    disponible: false,
  },
  {
    key: 'importador.gestionar',
    label: 'Gestionar importadores',
    descripcion: 'Crear y editar presets de importador.',
    grupo: 'Datos maestros',
    disponible: false,
  },
]

// Acciones aplicables hoy (las reservadas aún no se aplican en el servidor).
export const ACCIONES_DISPONIBLES: Accion[] = ACCIONES.filter((a) => a.disponible).map(
  (a) => a.key,
)

// Roles cuyos permisos configura el titular. El titular no aparece: tiene todo.
export const ROLES_CONFIGURABLES = ['suplente', 'operador'] as const
export type RolConfigurable = (typeof ROLES_CONFIGURABLES)[number]

// Defaults usados para sembrar la matriz cuando un (rol, acción) no tiene fila.
// Coinciden con el seed de la migración: todos crean/editan/exportan/duplican;
// aprobar/revertir/eliminar/crear-versión quedan al titular hasta que lo cambie.
export const DEFAULT_PERMISOS: Record<RolConfigurable, Accion[]> = {
  suplente: ['documento.crear', 'documento.editar', 'documento.exportar', 'documento.duplicar'],
  operador: ['documento.crear', 'documento.editar', 'documento.exportar', 'documento.duplicar'],
}

type DB = SupabaseClient<Database>

// Resuelve el set de permisos efectivos de un rol dentro de su organización.
// titular → todas las acciones disponibles. Otros → según role_permissions.
export async function resolverPermisos(
  supabase: DB,
  role: string,
  orgId: string,
): Promise<Set<Accion>> {
  if (role === 'titular') return new Set(ACCIONES_DISPONIBLES)

  const { data } = await supabase
    .from('role_permissions')
    .select('action, allowed')
    .eq('org_id', orgId)
    .eq('role', role)

  const set = new Set<Accion>()
  for (const row of data ?? []) {
    if (row.allowed) set.add(row.action as Accion)
  }
  return set
}

// Comprobación puntual de un permiso (enforcement en server actions).
// Falla cerrado: cualquier rol no-titular sin fila allowed=true → false.
export async function puede(
  supabase: DB,
  role: string,
  orgId: string,
  accion: Accion,
): Promise<boolean> {
  if (role === 'titular') return true

  const { data } = await supabase
    .from('role_permissions')
    .select('allowed')
    .eq('org_id', orgId)
    .eq('role', role)
    .eq('action', accion)
    .maybeSingle()

  return data?.allowed === true
}
