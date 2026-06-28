'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatoMoneda } from '@/lib/pdf/formato'
import PanelDetalle from './panel-detalle'
import {
  estadoUI,
  ESTADO_LABEL,
  ESTADO_CLASE,
  ORIGEN_LABEL,
  type DocumentoFila,
} from './types'

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type Props = {
  filas: DocumentoFila[]
  total: number
  page: number
  pageSize: number
  esTitular: boolean
}

export default function TablaHistorial({ filas, total, page, pageSize, esTitular }: Props) {
  const [seleccionado, setSeleccionado] = useState<DocumentoFila | null>(null)
  const router = useRouter()
  const params = useSearchParams()

  const totalPaginas = Math.ceil(total / pageSize)
  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  function irPagina(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push('/historial?' + next.toString())
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
        No hay documentos con los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="flex gap-0 min-h-0">
      {/* Tabla */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Importador</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Identificador</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Versión</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Última edición ↓</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filas.map((doc, idx) => {
                const estado = estadoUI(doc)
                const activo = seleccionado?.id === doc.id
                const identificador =
                  doc.tipo === 'vehiculo'
                    ? doc.data.vehiculo?.chasis
                    : doc.data.contenedor?.bl

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSeleccionado(activo ? null : doc)}
                    className={
                      'cursor-pointer transition-colors ' +
                      (activo
                        ? 'bg-brand-electrico-50/30 border-l-2 border-l-brand-electrico-400'
                        : idx % 2 === 0
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50/60 hover:bg-gray-50')
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">
                      {doc.importador_nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                          (doc.tipo === 'vehiculo'
                            ? 'bg-category-vehiculo-bg text-category-vehiculo-text'
                            : 'bg-category-contenedor-bg text-category-contenedor-text')
                        }
                      >
                        {doc.tipo === 'vehiculo' ? 'Vehículo' : 'Contenedor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate font-mono text-xs">
                      {identificador || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmt(doc.vencimiento_parqueo)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                          ESTADO_CLASE[estado]
                        }
                      >
                        {ESTADO_LABEL[estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-brand-marino-50 text-brand-marino-800 border border-brand-marino-100">
                        v{doc.version_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {ORIGEN_LABEL[doc.origen]}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {fmt(doc.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap tabular-nums">
                      {formatoMoneda(doc.data.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/documentos/${doc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-brand-primary transition-colors text-base leading-none"
                        aria-label="Abrir documento"
                      >
                        ⋯
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between pt-3 text-sm text-gray-500">
          <span>
            Mostrando {desde}–{hasta} de {total} documentos
          </span>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => irPagina(page - 1)}
                disabled={page <= 1}
                className="rounded-lg px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={'e' + i} className="px-1 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => irPagina(p as number)}
                      className={
                        'rounded-lg px-3 py-1.5 border text-sm transition-colors ' +
                        (p === page
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50')
                      }
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => irPagina(page + 1)}
                disabled={page >= totalPaginas}
                className="rounded-lg px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de detalle */}
      {seleccionado && (
        <PanelDetalle doc={seleccionado} onCerrar={() => setSeleccionado(null)} esTitular={esTitular} />
      )}
    </div>
  )
}
