import type { DocumentoData } from '@/lib/documentos/types'

export type EstadoUI = 'borrador' | 'pendiente' | 'aprobada' | 'vencida'

export type DocumentoFila = {
  id: string
  tipo: 'vehiculo' | 'contenedor'
  status: 'borrador' | 'exportada' | 'finalizada'
  origen: 'app' | 'respaldo_offline' | 'historico'
  importador_nombre: string
  importador_rnc: string
  vencimiento_parqueo: string | null
  updated_at: string
  created_at: string
  version_number: number
  data: DocumentoData
  created_by_name: string
}

// Nota interna de un documento (hilo colaborativo en el panel de detalle).
export type NotaFila = {
  id: string
  contenido: string
  created_at: string
  created_by: string
  autor_nombre: string
}

export function estadoUI(d: Pick<DocumentoFila, 'status' | 'vencimiento_parqueo'>): EstadoUI {
  const hoy = new Date().toISOString().slice(0, 10)
  if (d.vencimiento_parqueo && d.vencimiento_parqueo < hoy) return 'vencida'
  if (d.status === 'finalizada') return 'aprobada'
  if (d.status === 'exportada') return 'pendiente'
  return 'borrador'
}

export const ESTADO_LABEL: Record<EstadoUI, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  vencida: 'Vencida',
}

export const ESTADO_CLASE: Record<EstadoUI, string> = {
  borrador:
    'bg-status-borrador-bg text-status-borrador-text border border-status-borrador-border',
  pendiente:
    'bg-status-pendiente-bg text-status-pendiente-text border border-status-pendiente-border',
  aprobada:
    'bg-status-aprobado-bg text-status-aprobado-text border border-status-aprobado-border',
  vencida:
    'bg-status-vencida-bg text-status-vencida-text border border-status-vencida-border',
}

export const ORIGEN_LABEL: Record<DocumentoFila['origen'], string> = {
  app: 'App',
  respaldo_offline: 'Offline',
  historico: 'Histórico',
}

// Mapea el estado UI al valor de la columna `status` en la DB.
// Vencida se maneja por separado (filtro de fecha, no de status).
export function estadoUIaDB(estado: string): 'borrador' | 'exportada' | 'finalizada' | null {
  if (estado === 'borrador') return 'borrador'
  if (estado === 'pendiente') return 'exportada'
  if (estado === 'aprobada') return 'finalizada'
  return null
}
