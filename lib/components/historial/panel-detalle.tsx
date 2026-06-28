'use client'

import Link from 'next/link'
import { formatoMoneda } from '@/lib/pdf/formato'
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
  doc: DocumentoFila
  onCerrar: () => void
}

export default function PanelDetalle({ doc, onCerrar }: Props) {
  const estado = estadoUI(doc)

  return (
    <aside className="w-[380px] shrink-0 flex flex-col bg-white border-l border-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div className="space-y-1.5 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {doc.importador_nombre}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                ESTADO_CLASE[estado]
              }
            >
              {ESTADO_LABEL[estado]}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-brand-marino-50 text-brand-marino-800 border border-brand-marino-100">
              v{doc.version_number}
            </span>
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
          </div>
        </div>
        <button
          onClick={onCerrar}
          className="ml-3 shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-5 py-4 space-y-5 text-sm">
        {/* Sección tipo-específica */}
        {doc.tipo === 'vehiculo' && doc.data.vehiculo ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Vehículo
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <dt className="text-[11px] text-gray-400">Marca</dt>
                <dd className="font-medium text-gray-800">{doc.data.vehiculo.marca || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-400">Modelo</dt>
                <dd className="font-medium text-gray-800">{doc.data.vehiculo.modelo || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-400">Año</dt>
                <dd className="font-medium text-gray-800">{doc.data.vehiculo.anio || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-400">Chasis</dt>
                <dd className="font-medium text-gray-800 truncate" title={doc.data.vehiculo.chasis}>
                  {doc.data.vehiculo.chasis || '—'}
                </dd>
              </div>
            </dl>
          </section>
        ) : doc.data.contenedor ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Contenedor
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <dt className="text-[11px] text-gray-400">BL</dt>
                <dd className="font-medium text-gray-800">{doc.data.contenedor.bl || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-400">Contenedor</dt>
                <dd className="font-medium text-gray-800 truncate">
                  {doc.data.contenedor.numero_contenedor || '—'}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {/* Detalle */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Detalle
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-400">Importador</dt>
              <dd className="font-medium text-gray-800 text-right max-w-[55%] truncate">
                {doc.importador_nombre}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">RNC</dt>
              <dd className="font-medium text-gray-800">{doc.importador_rnc || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Creado por</dt>
              <dd className="font-medium text-gray-800">{doc.created_by_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Origen</dt>
              <dd className="font-medium text-gray-800">{ORIGEN_LABEL[doc.origen]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Versión</dt>
              <dd className="font-medium text-gray-800">v{doc.version_number}</dd>
            </div>
          </dl>
        </section>

        {/* Fechas */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Fechas
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-400">Creada</dt>
              <dd className="font-medium text-gray-800">{fmt(doc.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Última edición</dt>
              <dd className="font-medium text-gray-800">{fmt(doc.updated_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Vencimiento</dt>
              <dd
                className={
                  'font-medium ' +
                  (estado === 'vencida' ? 'text-red-600' : 'text-gray-800')
                }
              >
                {fmt(doc.vencimiento_parqueo)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t border-gray-100 pt-4">
          <span className="text-gray-500">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatoMoneda(doc.data.total)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="shrink-0 px-5 py-4 border-t border-gray-100 space-y-2">
        <Link
          href={`/documentos/${doc.id}`}
          className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-marino-900 transition-colors"
        >
          Abrir
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/api/documentos/${doc.id}/pdf`}
            target="_blank"
            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reimprimir PDF
          </Link>
          <button
            disabled
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-400 cursor-not-allowed"
            title="Próximamente"
          >
            Duplicar
          </button>
          <Link
            href={`/documentos/${doc.id}/versiones`}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ver versiones
          </Link>
          <button
            disabled
            className="rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-300 cursor-not-allowed"
            title="Próximamente"
          >
            Eliminar
          </button>
        </div>
      </div>
    </aside>
  )
}
