'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { FileText, Upload, Loader2 } from 'lucide-react'
import type { FormState } from '@/lib/documentos/types'
import { extraerHistorico } from '@/app/(protected)/historial/importar/actions'
import RevisionForm from './revision-form'

type Extraido = { form: FormState; advertencias: string[]; archivo: string }

export default function ImportarWizard() {
  const [extraido, setExtraido] = useState<Extraido | null>(null)
  const [archivoNombre, setArchivoNombre] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAnalizar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('Selecciona un archivo Word (.docx).')
      return
    }
    const formData = new FormData()
    formData.set('archivo', file)
    start(async () => {
      const res = await extraerHistorico(formData)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setExtraido({ form: res.form, advertencias: res.advertencias, archivo: res.archivo })
    })
  }

  if (extraido) {
    return (
      <RevisionForm
        initialForm={extraido.form}
        advertencias={extraido.advertencias}
        archivo={extraido.archivo}
      />
    )
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleAnalizar} className="space-y-4">
        <label
          htmlFor="archivo"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-raised px-6 py-10 text-center transition hover:border-action-primary hover:bg-surface-hover"
        >
          <FileText size={28} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">
            {archivoNombre || 'Selecciona la factura en Word (.docx)'}
          </span>
          <span className="text-xs text-text-tertiary">
            Se extraerán solo los datos; el diseño adopta la plantilla actual.
          </span>
          <input
            ref={inputRef}
            id="archivo"
            name="archivo"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              setArchivoNombre(e.target.files?.[0]?.name ?? '')
              setError(null)
            }}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {pending ? 'Analizando…' : 'Analizar documento'}
          </button>
          <Link
            href="/historial"
            className="text-sm font-display font-medium text-text-secondary transition hover:text-text-primary"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
