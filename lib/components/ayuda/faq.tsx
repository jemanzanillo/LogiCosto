'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQ } from './contenido'

// Acordeón de preguntas frecuentes agrupadas por categoría. Cada pregunta se
// abre/cierra de forma independiente. La clave "cat:idx" identifica el ítem.
export default function Faq() {
  const [abierto, setAbierto] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {FAQ.map((cat) => (
        <div key={cat.id}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            {cat.titulo}
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-white divide-y divide-border">
            {cat.items.map((item, idx) => {
              const clave = `${cat.id}:${idx}`
              const activo = abierto === clave
              return (
                <div key={clave}>
                  <button
                    type="button"
                    onClick={() => setAbierto(activo ? null : clave)}
                    aria-expanded={activo}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span className="text-sm font-medium text-text-primary">{item.pregunta}</span>
                    <ChevronDown
                      size={18}
                      className={
                        'shrink-0 text-text-tertiary transition-transform ' +
                        (activo ? 'rotate-180' : '')
                      }
                    />
                  </button>
                  {activo && (
                    <div className="px-4 pb-4 -mt-1 text-sm leading-relaxed text-text-secondary">
                      {item.respuesta}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
