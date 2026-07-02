'use client'

import { useState, useTransition } from 'react'
import { Inbox } from 'lucide-react'
import { actualizarEstadoTicket } from '@/app/(protected)/ayuda/actions'
import { CATEGORIA_LABEL } from './contenido'

export type TicketFila = {
  id: string
  categoria: string | null
  asunto: string
  estado: string
  created_at: string
  autor_nombre: string
}

type Props = {
  tickets: TicketFila[]
  esTitular: boolean
}

const ESTADO_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  resuelta: 'Resuelta',
}
const ESTADO_CLASE: Record<string, string> = {
  abierta: 'bg-amber-50 text-amber-700 border border-amber-100',
  resuelta: 'bg-green-50 text-green-700 border border-green-100',
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MisSolicitudes({ tickets, esTitular }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pendiente, start] = useTransition()

  function cambiarEstado(id: string, estado: 'abierta' | 'resuelta') {
    setError(null)
    start(async () => {
      const res = await actualizarEstadoTicket(id, estado)
      if (!res.ok) setError(res.error)
    })
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
        <Inbox size={26} className="text-text-tertiary" />
        <p className="text-sm text-text-secondary">
          {esTitular ? 'Aún no hay solicitudes de soporte.' : 'Aún no has enviado solicitudes.'}
        </p>
        <p className="max-w-sm text-xs text-text-tertiary">
          Cada solicitud que envíes desde el formulario de contacto quedará registrada aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-sunken text-left text-xs font-display font-semibold uppercase tracking-wide text-text-tertiary">
            <tr>
              <th className="px-4 py-2.5">Fecha</th>
              {esTitular && <th className="px-4 py-2.5">Solicitante</th>}
              <th className="px-4 py-2.5">Categoría</th>
              <th className="px-4 py-2.5">Asunto</th>
              <th className="px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tickets.map((t) => {
              const estado = t.estado in ESTADO_LABEL ? t.estado : 'abierta'
              return (
                <tr key={t.id} className="bg-surface-raised">
                  <td className="px-4 py-2.5 whitespace-nowrap text-text-tertiary">{fmtFecha(t.created_at)}</td>
                  {esTitular && (
                    <td className="px-4 py-2.5 text-text-secondary">{t.autor_nombre || '—'}</td>
                  )}
                  <td className="px-4 py-2.5 text-text-secondary">
                    {t.categoria ? CATEGORIA_LABEL[t.categoria] ?? t.categoria : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary max-w-[280px] truncate" title={t.asunto}>
                    {t.asunto}
                  </td>
                  <td className="px-4 py-2.5">
                    {esTitular ? (
                      <select
                        value={estado}
                        disabled={pendiente}
                        onChange={(e) => cambiarEstado(t.id, e.target.value as 'abierta' | 'resuelta')}
                        className="rounded-lg border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text-primary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary disabled:opacity-60"
                      >
                        <option value="abierta">Abierta</option>
                        <option value="resuelta">Resuelta</option>
                      </select>
                    ) : (
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                          (ESTADO_CLASE[estado] ?? ESTADO_CLASE.abierta)
                        }
                      >
                        {ESTADO_LABEL[estado]}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
