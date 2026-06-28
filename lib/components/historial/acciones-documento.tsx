'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  EllipsisVertical,
  ExternalLink,
  Printer,
  Copy,
  GitBranch,
  Trash2,
} from 'lucide-react'
import { duplicarDocumento, eliminarDocumento } from '@/app/(protected)/documentos/actions'

type Props = {
  docId: string
  nombre: string
  permisos: string[]
  // Se llama tras eliminar con éxito (p. ej. cerrar el panel de detalle).
  onEliminado?: () => void
}

// Menú de acciones por documento para el botón de tres puntos de las tablas.
// Ofrece las mismas acciones que el panel de detalle sin tener que abrirlo.
export default function AccionesDocumento({ docId, nombre, permisos, onEliminado }: Props) {
  const tiene = (a: string) => permisos.includes(a)
  const router = useRouter()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  // Cierra el menú al hacer scroll, redimensionar o presionar Escape (la posición
  // es fija respecto al viewport para escapar del overflow de la tabla).
  useEffect(() => {
    if (!abierto) return
    const cerrar = () => setAbierto(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (abierto) {
      setAbierto(false)
      return
    }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      const ANCHO = 192 // w-48
      const ALTO = 210 // alto estimado del menú
      const margen = 8
      // Alinear el borde derecho del menú al del botón, clampeado al viewport.
      const left = Math.min(
        Math.max(r.right - ANCHO, margen),
        window.innerWidth - ANCHO - margen,
      )
      // Abrir hacia arriba si no cabe debajo.
      const abajo = r.bottom + 4
      const top = abajo + ALTO > window.innerHeight ? Math.max(margen, r.top - ALTO - 4) : abajo
      setPos({ top, left })
    }
    setError(null)
    setAbierto(true)
  }

  function handleDuplicar(e: React.MouseEvent) {
    e.stopPropagation()
    setAbierto(false)
    setError(null)
    startTransition(async () => {
      const res = await duplicarDocumento(docId)
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
      const res = await eliminarDocumento(docId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setConfirmar(false)
      onEliminado?.()
      router.refresh()
    })
  }

  const itemCls =
    'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors'

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Acciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="grid h-7 w-7 place-items-center rounded-md text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
      >
        <EllipsisVertical size={16} />
      </button>

      {abierto && pos && (
        <>
          {/* Backdrop para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setAbierto(false) }} />
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 w-48 overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-lg"
          >
            <Link href={`/documentos/${docId}`} role="menuitem" className={itemCls}>
              <ExternalLink size={16} className="text-text-tertiary" /> Abrir
            </Link>
            <a
              href={`/api/documentos/${docId}/pdf`}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              className={itemCls}
            >
              <Printer size={16} className="text-text-tertiary" /> Reimprimir PDF
            </a>
            {tiene('documento.duplicar') && (
              <button type="button" role="menuitem" onClick={handleDuplicar} disabled={pendiente} className={itemCls}>
                <Copy size={16} className="text-text-tertiary" /> Duplicar
              </button>
            )}
            <Link href={`/documentos/${docId}/versiones`} role="menuitem" className={itemCls}>
              <GitBranch size={16} className="text-text-tertiary" /> Ver versiones
            </Link>
            {tiene('documento.eliminar') && (
              <button
                type="button"
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setAbierto(false); setError(null); setConfirmar(true) }}
                className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2 text-sm text-status-vencida-text hover:bg-status-vencida-bg transition-colors"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirmación de borrado */}
      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-xl bg-surface-raised p-5 shadow-xl">
            <h3 className="font-display text-base font-semibold text-text-primary">Eliminar documento</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Se eliminará <span className="font-medium text-text-primary">{nombre}</span> y todas sus
              versiones. Esta acción no se puede deshacer.
            </p>
            {error && <p className="mt-2 text-sm text-status-vencida-text">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                disabled={pendiente}
                className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={pendiente}
                className="rounded-lg bg-status-vencida-dot px-4 py-2 text-sm font-display font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
              >
                {pendiente ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error fuera del modal (p. ej. al duplicar) */}
      {error && !confirmar && (
        <span className="sr-only" role="alert">{error}</span>
      )}
    </>
  )
}
