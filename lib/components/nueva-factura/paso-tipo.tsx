'use client'

import { Car, Container } from 'lucide-react'
import type { DocumentoTipo } from '@/lib/documentos/types'

// Paso 1 del flujo (hi-fi 150:3361): "Elija el tipo de factura".
export default function PasoTipo({ onElegir }: { onElegir: (tipo: DocumentoTipo) => void }) {
  return (
    <div className="mx-auto max-w-2xl pt-10 text-center">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Elija el tipo de factura
      </h1>
      {/* Vehículo primero: es el tipo más frecuente del negocio (importación
          vehicular) → recibe el anclaje y la mayor atención (posición izquierda). */}
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Tarjeta
          icono={<Car size={34} className="text-action-primary" />}
          label="Vehículo"
          onClick={() => onElegir('vehiculo')}
        />
        <Tarjeta
          icono={<Container size={34} className="text-category-contenedor-dot" />}
          label="Contenedor"
          onClick={() => onElegir('contenedor')}
        />
      </div>
    </div>
  )
}

function Tarjeta({
  icono,
  label,
  onClick,
}: {
  icono: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-raised px-6 py-10 transition-all hover:border-action-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-action-primary/40"
    >
      <span className="grid h-20 w-20 place-items-center rounded-full bg-surface-hover transition-colors group-hover:bg-brand-electrico-50">
        {icono}
      </span>
      <span className="font-display text-xl font-semibold text-text-primary">{label}</span>
    </button>
  )
}
