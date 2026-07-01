'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, Paperclip, X } from 'lucide-react'
import { enviarSoporte } from '@/app/(protected)/ayuda/actions'
import { CATEGORIAS_SOPORTE } from './contenido'

const inputCls =
  'rounded-lg border border-border-strong px-3 py-2 text-sm ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary ' +
  'disabled:bg-surface-hover disabled:text-text-tertiary'

// Límite del adjunto opcional (captura). 5 MB es holgado para un PNG/JPG.
const MAX_ADJUNTO = 5 * 1024 * 1024

type Props = {
  nombreInicial: string
  correoInicial: string
}

export default function ContactoForm({ nombreInicial, correoInicial }: Props) {
  const [pendiente, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(nombreInicial)
  const [correo, setCorreo] = useState(correoInicial)
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_SOPORTE[0].value)
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [adjunto, setAdjunto] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const f = e.target.files?.[0] ?? null
    if (f && f.size > MAX_ADJUNTO) {
      setError('La captura no puede superar los 5 MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setAdjunto(f)
  }

  function quitarAdjunto() {
    setAdjunto(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleEnviar() {
    setError(null)
    if (!asunto.trim() || !mensaje.trim()) {
      setError('Indique el asunto y el mensaje.')
      return
    }
    const fd = new FormData()
    fd.set('nombre', nombre.trim())
    fd.set('correo', correo.trim())
    fd.set('categoria', categoria)
    fd.set('asunto', asunto.trim())
    fd.set('mensaje', mensaje.trim())
    if (adjunto) fd.set('adjunto', adjunto)

    startTransition(async () => {
      const res = await enviarSoporte(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEnviado(true)
    })
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <CheckCircle2 size={40} className="text-green-600" />
        <h3 className="text-base font-semibold text-green-900">Solicitud recibida</h3>
        <p className="max-w-md text-sm text-green-800">
          Gracias por escribirnos. Revisaremos su solicitud y le responderemos al correo{' '}
          <span className="font-medium">{correo}</span> lo antes posible.
        </p>
        <button
          type="button"
          onClick={() => {
            setEnviado(false)
            setAsunto('')
            setMensaje('')
            quitarAdjunto()
          }}
          className="mt-1 text-sm font-medium text-action-primary hover:underline"
        >
          Enviar otra solicitud
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <h3 className="text-base font-semibold text-text-primary">¿No encontró su respuesta?</h3>
      <p className="mt-0.5 text-sm text-text-secondary">
        Escríbanos y le responderemos por correo. Sus datos vienen precargados; puede cambiarlos si
        lo desea.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Nombre</label>
          <input
            className={inputCls + ' w-full'}
            value={nombre}
            disabled={pendiente}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Su nombre"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Correo</label>
          <input
            type="email"
            className={inputCls + ' w-full'}
            value={correo}
            disabled={pendiente}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Categoría</label>
          <select
            className={inputCls + ' w-full py-2'}
            value={categoria}
            disabled={pendiente}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS_SOPORTE.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Asunto</label>
          <input
            className={inputCls + ' w-full'}
            value={asunto}
            disabled={pendiente}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Resuma su consulta"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-text-secondary">Mensaje</label>
        <textarea
          className={inputCls + ' w-full resize-y'}
          rows={5}
          value={mensaje}
          disabled={pendiente}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Describa su consulta o el problema que encontró."
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          Adjuntar captura <span className="font-normal text-text-tertiary">(opcional)</span>
        </label>
        {adjunto ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-secondary">
            <Paperclip size={16} className="shrink-0 text-text-tertiary" />
            <span className="truncate">{adjunto.name}</span>
            <button
              type="button"
              onClick={quitarAdjunto}
              disabled={pendiente}
              className="ml-auto text-text-tertiary hover:text-text-primary"
              aria-label="Quitar adjunto"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover">
            <Paperclip size={16} className="text-text-tertiary" />
            <span>Seleccionar imagen (máx. 5 MB)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={pendiente}
              onChange={handleArchivo}
            />
          </label>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleEnviar}
          disabled={pendiente}
          className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60"
        >
          {pendiente ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </div>
  )
}
