import { Car, Container } from 'lucide-react'
import { formatoMoneda } from '@/lib/pdf/formato'
import AccionesDocumento from '@/lib/components/historial/acciones-documento'
import {
  estadoUI,
  ESTADO_LABEL,
  ESTADO_CLASE,
  type DocumentoFila,
} from '@/lib/components/historial/types'

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Tabla de documentos recientes del Panel de inicio (hi-fi 150:2976, sección
// "Recientes"). Presentacional y de solo lectura; reutiliza los helpers de estado
// y el tipo de la tabla de Historial.
export default function TablaRecientes({
  filas,
  permisos,
}: {
  filas: DocumentoFila[]
  permisos: string[]
}) {
  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center text-sm text-text-tertiary">
        Aún no hay documentos. Crea el primero desde “+ Agregar”.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-table-header text-left text-xs font-display font-semibold uppercase tracking-wider text-text-secondary">
            <th className="px-4 py-3">Importador</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Identificador</th>
            <th className="px-4 py-3">Vencimiento</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Creación</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {filas.map((doc, idx) => {
            const estado = estadoUI(doc)
            const identificador =
              doc.tipo === 'vehiculo' ? doc.data.vehiculo?.chasis : doc.data.contenedor?.bl
            return (
              <tr
                key={doc.id}
                className={
                  'border-t border-border/60 ' + (idx % 2 === 1 ? 'bg-table-zebra' : 'bg-surface-raised')
                }
              >
                <td className="px-4 py-3 font-medium text-text-primary max-w-[180px] truncate">
                  {doc.importador_nombre}
                </td>
                <td className="px-4 py-3">
                  {doc.tipo === 'vehiculo' ? (
                    <Car size={20} className="text-action-primary" aria-label="Vehículo" />
                  ) : (
                    <Container size={20} className="text-category-contenedor-dot" aria-label="Contenedor" />
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate font-mono text-xs">
                  {identificador || '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {fmt(doc.vencimiento_parqueo)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-display font-medium ' +
                      ESTADO_CLASE[estado]
                    }
                  >
                    {ESTADO_LABEL[estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap text-xs">
                  {fmt(doc.created_at)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap tabular-nums">
                  {formatoMoneda(doc.data.total)}
                </td>
                <td className="px-4 py-3">
                  <AccionesDocumento
                    docId={doc.id}
                    nombre={doc.importador_nombre}
                    permisos={permisos}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
