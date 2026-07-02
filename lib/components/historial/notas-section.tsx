'use client'

import { useEffect, useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { crearNota, eliminarNota, listarNotas } from '@/app/(protected)/documentos/actions'
import type { NotaFila } from './types'

function fmtFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  documentId: string
  miPerfilId: string
}

export default function NotasSection({ documentId, miPerfilId }: Props) {
  const [notas, setNotas] = useState<NotaFila[]>([])
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendiente, start] = useTransition()

  async function refrescar() {
    const res = await listarNotas(documentId)
    if (res.ok) setNotas(res.notas)
    else setError(res.error)
  }

  useEffect(() => {
    let vivo = true
    setCargando(true)
    listarNotas(documentId).then((res) => {
      if (!vivo) return
      if (res.ok) setNotas(res.notas)
      else setError(res.error)
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [documentId])

  function agregar() {
    const limpio = texto.trim()
    if (!limpio) return
    setError(null)
    start(async () => {
      const res = await crearNota(documentId, limpio)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setTexto('')
      await refrescar()
    })
  }

  function borrar(id: string) {
    setError(null)
    start(async () => {
      const res = await eliminarNota(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      await refrescar()
    })
  }

  return (
    <section>
      <h3 className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase mb-2">
        Notas internas
      </h3>

      {cargando ? (
        <p className="text-xs text-text-tertiary">Cargando notas…</p>
      ) : notas.length === 0 ? (
        <p className="text-xs text-text-tertiary">
          Aún no hay notas. Deja un comentario para el equipo sobre este documento.
        </p>
      ) : (
        <ul className="space-y-3">
          {notas.map((n) => (
            <li key={n.id} className="rounded-lg bg-surface-sunken px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-text-secondary truncate">
                  {n.autor_nombre || 'Usuario'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-tertiary">{fmtFechaHora(n.created_at)}</span>
                  {n.created_by === miPerfilId && (
                    <button
                      onClick={() => borrar(n.id)}
                      disabled={pendiente}
                      className="text-text-tertiary transition-colors hover:text-red-500 disabled:opacity-50"
                      aria-label="Eliminar nota"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{n.contenido}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={texto}
          disabled={pendiente}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Escribe una nota para el equipo…"
          className="w-full resize-y rounded-lg border border-border-strong px-3 py-2 text-sm text-text-primary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary disabled:opacity-60"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={agregar}
            disabled={pendiente || !texto.trim()}
            className="rounded-lg bg-action-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pendiente ? 'Guardando…' : 'Agregar nota'}
          </button>
        </div>
      </div>
    </section>
  )
}
