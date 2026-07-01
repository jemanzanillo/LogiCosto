'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { formatoMoneda } from '@/lib/pdf/formato'
import { duplicarDocumento, eliminarDocumento } from '@/app/(protected)/documentos/actions'
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
  permisos: string[]
}

export default function PanelDetalle({ doc, onCerrar, permisos }: Props) {
  const tiene = (a: string) => permisos.includes(a)
  const estado = estadoUI(doc)
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDuplicar() {
    setError(null)
    startTransition(async () => {
      const res = await duplicarDocumento(doc.id)
      if (!res.ok) {
        setError('error' in res ? res.error : 'No se pudo duplicar.')
        return
      }
      router.push(`/documentos/${res.id}`)
    })
  }

  function handleEliminar() {
    setError(null)
    startTransition(async () => {
      const res = await eliminarDocumento(doc.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setConfirmarEliminar(false)
      onCerrar()
      router.refresh()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCerrar}
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col bg-white border-l border-border shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="space-y-1.5 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">
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
          className="ml-3 shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Cerrar panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-5 py-4 space-y-5 text-sm">
        {/* Sección tipo-específica */}
        {doc.tipo === 'vehiculo' && doc.data.vehiculo ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase mb-2">
              Vehículo
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <dt className="text-[11px] text-text-tertiary">Marca</dt>
                <dd className="font-medium text-text-primary">{doc.data.vehiculo.marca || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-text-tertiary">Modelo</dt>
                <dd className="font-medium text-text-primary">{doc.data.vehiculo.modelo || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-text-tertiary">Año</dt>
                <dd className="font-medium text-text-primary">{doc.data.vehiculo.anio || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-text-tertiary">Chasis</dt>
                <dd className="font-medium text-text-primary truncate" title={doc.data.vehiculo.chasis}>
                  {doc.data.vehiculo.chasis || '—'}
                </dd>
              </div>
            </dl>
          </section>
        ) : doc.data.contenedor ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase mb-2">
              Contenedor
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <dt className="text-[11px] text-text-tertiary">BL</dt>
                <dd className="font-medium text-text-primary">{doc.data.contenedor.bl || '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-text-tertiary">Contenedor</dt>
                <dd className="font-medium text-text-primary truncate">
                  {doc.data.contenedor.numero_contenedor || '—'}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {/* Detalle */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase mb-2">
            Detalle
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Importador</dt>
              <dd className="font-medium text-text-primary text-right max-w-[55%] truncate">
                {doc.importador_nombre}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">RNC</dt>
              <dd className="font-medium text-text-primary">{doc.importador_rnc || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Creado por</dt>
              <dd className="font-medium text-text-primary">{doc.created_by_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Origen</dt>
              <dd className="font-medium text-text-primary">{ORIGEN_LABEL[doc.origen]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Versión</dt>
              <dd className="font-medium text-text-primary">v{doc.version_number}</dd>
            </div>
          </dl>
        </section>

        {/* Fechas */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase mb-2">
            Fechas
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Creada</dt>
              <dd className="font-medium text-text-primary">{fmt(doc.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Última edición</dt>
              <dd className="font-medium text-text-primary">{fmt(doc.updated_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Vencimiento</dt>
              <dd
                className={
                  'font-medium ' +
                  (estado === 'vencida' ? 'text-red-600' : 'text-text-primary')
                }
              >
                {fmt(doc.vencimiento_parqueo)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-text-secondary">Total</span>
          <span className="text-xl font-bold text-text-primary">
            {formatoMoneda(doc.data.total)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="shrink-0 px-5 py-4 border-t border-border space-y-2">
        <Link
          href={`/documentos/${doc.id}`}
          className="flex w-full items-center justify-center rounded-lg bg-action-primary px-4 py-2.5 text-sm font-display font-semibold text-white hover:bg-action-primary-hover transition-colors"
        >
          Abrir
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/api/documentos/${doc.id}/pdf`}
            target="_blank"
            className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Reimprimir PDF
          </Link>
          {tiene('documento.duplicar') && (
            <button
              onClick={handleDuplicar}
              disabled={pendiente}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Duplicar
            </button>
          )}
          <Link
            href={`/documentos/${doc.id}/versiones`}
            className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Ver versiones
          </Link>
          {tiene('documento.eliminar') && (
            <button
              onClick={() => { setError(null); setConfirmarEliminar(true) }}
              disabled={pendiente}
              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Confirmación de borrado */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-text-primary">Eliminar documento</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Se eliminará <span className="font-medium text-text-secondary">{doc.importador_nombre}</span> y
              todas sus versiones. Esta acción no se puede deshacer.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmarEliminar(false)}
                disabled={pendiente}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={pendiente}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {pendiente ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  )
}
