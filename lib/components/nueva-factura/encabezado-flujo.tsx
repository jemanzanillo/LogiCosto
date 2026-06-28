'use client'

import { ArrowLeft, Check } from 'lucide-react'

export type PasoFlujo = 'tipo' | 'origen' | 'datos'

const PASOS: { key: PasoFlujo; label: string }[] = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'origen', label: 'Origen' },
  { key: 'datos', label: 'Datos' },
]

// Cabecera del flujo de Nueva factura (hi-fi 150:3361 / 150:4093): breadcrumb +
// botón atrás a la izquierda, stepper de 3 pasos centrado.
export default function EncabezadoFlujo({
  paso,
  onBack,
}: {
  paso: PasoFlujo
  onBack: () => void
}) {
  const idxActual = PASOS.findIndex((p) => p.key === paso)
  const labelActual = PASOS[idxActual]?.label ?? ''

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {/* Breadcrumb + atrás */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Atrás"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-raised text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm text-text-secondary">
          <span className="text-text-tertiary">Inicio / Nueva factura / </span>
          <span className="font-display font-medium text-text-primary">{labelActual}</span>
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center">
        {PASOS.map((p, i) => {
          const completado = i < idxActual
          const activo = i === idxActual
          return (
            <li key={p.key} className="flex items-center">
              <span
                className={
                  'grid h-7 w-7 place-items-center rounded-full text-xs font-display font-semibold ' +
                  (completado
                    ? 'bg-action-primary text-white'
                    : activo
                      ? 'bg-action-primary text-white'
                      : 'border border-border-strong text-text-tertiary')
                }
              >
                {completado ? <Check size={15} /> : i + 1}
              </span>
              <span
                className={
                  'ml-2 text-sm font-display ' +
                  (activo || completado ? 'font-medium text-text-primary' : 'text-text-tertiary')
                }
              >
                {p.label}
              </span>
              {i < PASOS.length - 1 && (
                <span className="mx-3 h-px w-10 bg-border-strong" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
