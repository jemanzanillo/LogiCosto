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
}: Props) {
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
    'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60'
  const btnPrimario =
    'rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-marino-900 disabled:opacity-60'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-marino-900"
        >
          + Crear nueva versión
        </button>
      </div>

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
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-gray-300 bg-white')
                  }
                />
                {!ultima && <span className="mt-1 w-px flex-1 bg-gray-200" />}
              </div>

              {/* Card */}
              <div className="mb-1 flex-1 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">v{v.version_number}</span>
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
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        Reemplazada
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{fmtFechaHora(v.created_at)}</span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Creado por {v.created_by_name || '—'}
                  {v.created_by_role ? ` · ${v.created_by_role}` : ''}
                </p>

                {v.nota && (
                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Nota de la versión
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">{v.nota}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {esActual && status === 'exportada' && (
                    <button type="button" onClick={handleAprobar} disabled={pendiente} className={btnPrimario}>
                      Marcar como aprobada
                    </button>
                  )}
                  {esActual && status === 'finalizada' && (
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
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Crear nueva versión</h3>
            <p className="mt-1 text-sm text-gray-500">
              Se copiará la versión actual a una nueva (Borrador) para corregirla. El historial se
              conserva.
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-600">
              Nota de la versión <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Motivo de la corrección…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-marino-900 disabled:opacity-60"
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
