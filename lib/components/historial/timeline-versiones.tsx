'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  crearNuevaVersion,
  marcarAprobada,
  revertirPendiente,
} from '@/app/(protected)/documentos/actions'
import {
  ESTADO_LABEL,
  ESTADO_CLASE,
  type EstadoUI,
} from './types'

type DbStatus = 'borrador' | 'exportada' | 'finalizada'

export type VersionFila = {
  id: string
  version_number: number
  created_at: string
  nota: string | null
  created_by_name: string
  created_by_role: string
}

type Props = {
  docId: string
  status: DbStatus
  estadoActual: EstadoUI
  currentVersionId: string | null
  versiones: VersionFila[]
  permisos: string[]
}

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TimelineVersiones({
  docId,
  status,
  estadoActual,
  currentVersionId,
  versiones,
  permisos,
}: Props) {
  const tiene = (a: string) => permisos.includes(a)
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nota, setNota] = useState('')

  function handleCrear() {
    setError(null)
    startTransition(async () => {
      const res = await crearNuevaVersion(docId, nota)
      if (!res.ok) {
        setError('error' in res ? res.error : 'No se pudo crear la versión.')
        return
      }
      setModalAbierto(false)
      setNota('')
      // La nueva versión es un borrador editable.
      router.push(`/documentos/${docId}`)
    })
  }

  function handleAprobar() {
    setError(null)
    startTransition(async () => {
      const res = await marcarAprobada(docId)
      if (!res.ok) { setError(res.error); return }
      router.refresh()
    })
  }

  function handleRevertir() {
    setError(null)
    startTransition(async () => {
      const res = await revertirPendiente(docId)
      if (!res.ok) { setError(res.error); return }
      router.refresh()
    })
  }

  const btnSecundario =
    'rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60'
  const btnPrimario =
    'rounded-lg bg-action-primary px-3 py-1.5 text-xs font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60'

  return (
    <div className="space-y-4">
      {tiene('documento.version_crear') && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover"
          >
            + Crear nueva versión
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Timeline */}
      <ol className="relative space-y-3">
        {versiones.map((v, idx) => {
          const esActual = v.id === currentVersionId
          const ultima = idx === versiones.length - 1

          return (
            <li key={v.id} className="relative flex gap-4">
              {/* Dot + conector */}
              <div className="flex flex-col items-center pt-5">
                <span
                  className={
                    'h-3 w-3 shrink-0 rounded-full border-2 ' +
                    (esActual
                      ? 'border-action-primary bg-action-primary'
                      : 'border-border-strong bg-surface-raised')
                  }
                />
                {!ultima && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>

              {/* Card */}
              <div className="mb-1 flex-1 rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">v{v.version_number}</span>
                    {esActual ? (
                      <>
                        <span
                          className={
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                            ESTADO_CLASE[estadoActual]
                          }
                        >
                          {ESTADO_LABEL[estadoActual]}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-brand-marino-100 bg-brand-marino-50 px-2 py-0.5 text-[11px] font-medium text-brand-marino-800">
                          Versión actual
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                        Reemplazada
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-text-tertiary">{fmtFechaHora(v.created_at)}</span>
                </div>

                <p className="mt-2 text-xs text-text-secondary">
                  Creado por {v.created_by_name || '—'}
                  {v.created_by_role ? ` · ${v.created_by_role}` : ''}
                </p>

                {v.nota && (
                  <div className="mt-3 rounded-lg bg-surface-sunken px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                      Nota de la versión
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">{v.nota}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {esActual && status === 'exportada' && tiene('documento.aprobar') && (
                    <button type="button" onClick={handleAprobar} disabled={pendiente} className={btnPrimario}>
                      Marcar como aprobada
                    </button>
                  )}
                  {esActual && status === 'finalizada' && tiene('documento.revertir') && (
                    <button type="button" onClick={handleRevertir} disabled={pendiente} className={btnSecundario}>
                      Revertir a pendiente
                    </button>
                  )}
                  {esActual && status === 'borrador' && (
                    <Link href={`/documentos/${docId}`} className={btnPrimario}>
                      Abrir para editar
                    </Link>
                  )}
                  <a
                    href={`/api/documentos/${docId}/pdf?version=${v.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnSecundario}
                  >
                    Reimprimir PDF
                  </a>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Modal: nueva versión con nota opcional */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-raised p-5 shadow-xl">
            <h3 className="text-base font-semibold text-text-primary">Crear nueva versión</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Se copiará la versión actual a una nueva (Borrador) para corregirla. El historial se
              conserva.
            </p>
            <label className="mt-4 block text-xs font-medium text-text-secondary">
              Nota de la versión <span className="text-text-tertiary">(opcional)</span>
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Motivo de la corrección…"
              className="mt-1 w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-primary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setModalAbierto(false); setError(null) }}
                disabled={pendiente}
                className={btnSecundario + ' px-4 py-2 text-sm'}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrear}
                disabled={pendiente}
                className="rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60"
              >
                {pendiente ? 'Creando…' : 'Crear versión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
