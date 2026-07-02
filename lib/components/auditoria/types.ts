import type { Database } from '@/lib/types/database.types'

export type AuditAction = Database['public']['Enums']['audit_action']

export type AuditoriaFila = {
  id: string
  action: AuditAction
  detail: Record<string, unknown> | null
  created_at: string
  actor_nombre: string
  actor_rol: string
  documento_id: string | null
  documento_importador: string | null
}

// Etiqueta legible por acción (en pasado, desde la perspectiva del usuario).
export const ACCION_LABEL: Record<AuditAction, string> = {
  crear: 'Creó',
  editar: 'Nueva versión',
  revisar: 'Revirtió a pendiente',
  exportar: 'Exportó',
  finalizar: 'Aprobó',
  importar: 'Importó',
  eliminar: 'Eliminó',
  preset_crear: 'Creó preset',
  preset_editar: 'Editó preset',
}

// Clase de badge por acción.
export const ACCION_CLASE: Record<AuditAction, string> = {
  crear: 'bg-brand-electrico-50 text-brand-electrico-700',
  editar: 'bg-brand-marino-50 text-brand-marino-800',
  revisar: 'bg-amber-50 text-amber-700',
  exportar: 'bg-gray-100 text-gray-600',
  finalizar: 'bg-status-aprobado-bg text-status-aprobado-text',
  importar: 'bg-teal-50 text-teal-700',
  eliminar: 'bg-red-50 text-red-600',
  preset_crear: 'bg-gray-100 text-gray-600',
  preset_editar: 'bg-gray-100 text-gray-600',
}

// Orden de opciones para el filtro de acción.
export const ACCIONES: AuditAction[] = [
  'crear',
  'editar',
  'exportar',
  'finalizar',
  'revisar',
  'eliminar',
  'importar',
  'preset_crear',
  'preset_editar',
]

// Resumen legible del campo `detail` (jsonb) según la acción.
export function resumenDetalle(fila: AuditoriaFila): string {
  const d = fila.detail ?? {}
  switch (fila.action) {
    case 'crear':
      return d.duplicado_de ? 'Duplicado de otro documento' : ''
    case 'editar': {
      const v = d.version ? `v${d.version}` : ''
      const nota = typeof d.nota === 'string' && d.nota ? ` · ${d.nota}` : ''
      return `${v}${nota}`.trim()
    }
    case 'revisar':
      return 'Aprobada → Pendiente'
    case 'eliminar':
      return typeof d.importador === 'string' ? d.importador : ''
    case 'importar':
      return typeof d.importador === 'string' ? d.importador : ''
    case 'preset_crear':
    case 'preset_editar': {
      const nombre = typeof d.nombre === 'string' ? d.nombre : ''
      const acc = d.accion === 'eliminar' ? ' (eliminado)' : ''
      return `${nombre}${acc}`.trim()
    }
    default:
      return ''
  }
}
