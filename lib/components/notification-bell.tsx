'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import {
  contarNoLeidas,
  listarRecientes,
  marcarLeida,
  marcarTodasLeidas,
} from '@/app/(protected)/notificaciones/actions'
import { mensaje, type NotificacionFila } from '@/lib/notificaciones/tipos'

const POLL_MS = 60_000

function fmtRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} d`
}

type Props = {
  initialCount: number
}

export default function NotificationBell({ initialCount }: Props) {
  const router = useRouter()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [count, setCount] = useState(initialCount)
  const [items, setItems] = useState<NotificacionFila[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [, startTransition] = useTransition()

  // Polling ligero del contador — no hay infraestructura de realtime en el
  // proyecto, así que se refresca por intervalo (bajo costo, un count con head).
  useEffect(() => {
    const id = setInterval(() => {
      contarNoLeidas().then(setCount)
    }, POLL_MS)
    return () => clearInterval(id)
  }, [])

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

  function toggle() {
    if (abierto) {
      setAbierto(false)
      return
    }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
    }
    setAbierto(true)
    setCargando(true)
    listarRecientes().then((data) => {
      setItems(data)
      setCargando(false)
    })
  }

  function abrirNotificacion(n: NotificacionFila) {
    setAbierto(false)
    if (!n.leida) {
      setCount((c) => Math.max(0, c - 1))
      startTransition(() => {
        marcarLeida(n.id)
      })
    }
    if (n.document_id) router.push(`/documentos/${n.document_id}`)
  }

  function marcarTodas() {
    setCount(0)
    setItems((prev) => prev?.map((n) => ({ ...n, leida: true })) ?? null)
    startTransition(() => {
      marcarTodasLeidas()
    })
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Notificaciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
      >
        <Bell size={19} />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-vencida-dot px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {abierto && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div
            role="menu"
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-display font-semibold text-text-primary">Notificaciones</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="inline-flex items-center gap-1 text-xs font-medium text-action-primary hover:underline"
                >
                  <CheckCheck size={13} /> Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {cargando ? (
                <p className="px-3 py-6 text-center text-xs text-text-tertiary">Cargando…</p>
              ) : !items || items.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-text-tertiary">
                  No tienes notificaciones.
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => abrirNotificacion(n)}
                    className={
                      'flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-surface-hover ' +
                      (n.leida ? '' : 'bg-brand-electrico-50/40')
                    }
                  >
                    <span className="flex w-full items-start gap-2">
                      {!n.leida && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-action-primary" />
                      )}
                      <span className="text-xs text-text-primary">{mensaje(n)}</span>
                    </span>
                    <span className="pl-3.5 text-[10px] text-text-tertiary">{fmtRelativo(n.created_at)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
