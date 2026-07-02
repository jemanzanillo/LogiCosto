import type { Database } from '@/lib/types/database.types'

export type NotificacionTipo = Database['public']['Enums']['notification_tipo']

export type NotificacionFila = {
  id: string
  tipo: NotificacionTipo
  leida: boolean
  created_at: string
  document_id: string | null
  importador: string | null
  vencimiento: string | null
  actor_nombre: string | null
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Texto legible por tipo de notificación (mismo espíritu que resumenDetalle()
// en lib/components/auditoria/types.ts).
export function mensaje(fila: NotificacionFila): string {
  const importador = fila.importador ?? 'un documento'
  const actor = fila.actor_nombre || 'Alguien'
  switch (fila.tipo) {
    case 'vencimiento_proximo':
      return `El parqueo de ${importador} vence el ${fila.vencimiento ? fmtFecha(fila.vencimiento) : 'pronto'}.`
    case 'documento_pendiente':
      return `${actor} exportó la factura de ${importador} — lista para aprobar.`
    case 'documento_aprobado':
      return `${actor} aprobó la factura de ${importador}.`
    case 'documento_revertido':
      return `${actor} revirtió a pendiente la factura de ${importador}.`
    case 'version_nueva':
      return `${actor} creó una nueva versión de ${importador}.`
    default:
      return 'Nueva notificación.'
  }
}
