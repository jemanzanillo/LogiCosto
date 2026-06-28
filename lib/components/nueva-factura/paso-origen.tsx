'use client'

import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Search, Car, Container, ArrowLeft } from 'lucide-react'
import {
  formStateVacio,
  type DocumentoTipo,
  type FormState,
} from '@/lib/documentos/types'

export type FacturaPrevia = {
  id: string
  importador_nombre: string
  tipo: DocumentoTipo
  identificador: string
  created_at: string
  // Snapshot vigente para copiar secciones (los montos se descartan).
  importador: { nombre: string; rnc: string }
  vehiculo?: FormState['vehiculo']
  contenedor?: FormState['contenedor']
  conceptos: { concepto: string }[]
}

type Seccion = 'importador' | 'datos' | 'conceptos'

// Paso 2 del flujo (hi-fi 150:4093): "¿Cómo deseas empezar?".
export default function PasoOrigen({
  tipo,
  recientes,
  onNueva,
  onDesde,
}: {
  tipo: DocumentoTipo
  recientes: FacturaPrevia[]
  onNueva: () => void
  onDesde: (form: FormState) => void
}) {
  const [modo, setModo] = useState<'elegir' | 'selector'>('elegir')

  if (modo === 'elegir') {
    return (
      <div className="mx-auto max-w-2xl pt-10 text-center">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          ¿Cómo deseas empezar?
        </h1>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Tarjeta icono={<Plus size={32} className="text-action-primary" />} label="Factura nueva" onClick={onNueva} />
          <Tarjeta
            icono={<RotateCcw size={30} className="text-action-primary" />}
            label="Desde factura anterior"
            onClick={() => setModo('selector')}
          />
        </div>
      </div>
    )
  }

  return (
    <SelectorAnterior
      tipo={tipo}
      recientes={recientes}
      onVolver={() => setModo('elegir')}
      onUsar={onDesde}
    />
  )
}

function Tarjeta({ icono, label, onClick }: { icono: React.ReactNode; label: string; onClick: () => void }) {
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

function SelectorAnterior({
  tipo,
  recientes,
  onVolver,
  onUsar,
}: {
  tipo: DocumentoTipo
  recientes: FacturaPrevia[]
  onVolver: () => void
  onUsar: (form: FormState) => void
}) {
  const [q, setQ] = useState('')
  const [elegidaId, setElegidaId] = useState<string | null>(null)
  // Importador y conceptos siempre copiables; "datos del tipo" solo si coincide.
  const [secciones, setSecciones] = useState<Record<Seccion, boolean>>({
    importador: true,
    datos: true,
    conceptos: true,
  })

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return recientes
    return recientes.filter(
      (r) =>
        r.importador_nombre.toLowerCase().includes(t) ||
        r.identificador.toLowerCase().includes(t),
    )
  }, [q, recientes])

  const elegida = recientes.find((r) => r.id === elegidaId) ?? null
  const mismoTipo = elegida?.tipo === tipo

  function usar() {
    if (!elegida) return
    const form = formStateVacio()
    form.tipo = tipo
    if (secciones.importador) {
      form.importador = { nombre: elegida.importador.nombre, rnc: elegida.importador.rnc }
    }
    if (secciones.datos && mismoTipo) {
      if (tipo === 'vehiculo' && elegida.vehiculo) form.vehiculo = { ...elegida.vehiculo }
      if (tipo === 'contenedor' && elegida.contenedor) form.contenedor = { ...elegida.contenedor }
    }
    if (secciones.conceptos) {
      // Regla de dominio: NUNCA se copian los montos, solo los nombres de concepto.
      form.conceptos = elegida.conceptos.map((c) => ({ concepto: c.concepto, monto: 0 }))
    }
    onUsar(form)
  }

  return (
    <div className="mx-auto max-w-3xl pt-6">
      <button
        type="button"
        onClick={onVolver}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-display text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>
      <h2 className="font-display text-xl font-semibold text-text-primary">Desde factura anterior</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Elige una factura, marca qué copiar y continúa. Los montos de los conceptos no se
        copian: solo sus nombres.
      </p>

      {/* Buscador */}
      <div className="relative mt-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por importador o identificador…"
          className="w-full rounded-lg border border-border bg-surface-raised pl-11 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary"
        />
      </div>

      {/* Lista de facturas */}
      <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface-raised divide-y divide-border/60">
        {filtradas.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-tertiary">
            No hay facturas anteriores para copiar.
          </p>
        ) : (
          filtradas.map((r) => {
            const sel = r.id === elegidaId
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setElegidaId(r.id)}
                className={
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ' +
                  (sel ? 'bg-brand-electrico-50' : 'hover:bg-surface-hover')
                }
              >
                {r.tipo === 'vehiculo' ? (
                  <Car size={20} className="shrink-0 text-action-primary" />
                ) : (
                  <Container size={20} className="shrink-0 text-category-contenedor-dot" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-medium text-text-primary truncate">
                    {r.importador_nombre}
                  </span>
                  <span className="block font-mono text-xs text-text-tertiary truncate">
                    {r.identificador || '—'}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-text-tertiary">
                  {new Date(r.created_at).toLocaleDateString('es-DO')}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Secciones a copiar */}
      {elegida && (
        <fieldset className="mt-5 rounded-xl border border-border bg-surface-raised p-4">
          <legend className="px-1 font-display text-sm font-medium text-text-primary">
            ¿Qué quieres copiar?
          </legend>
          <div className="mt-2 space-y-2">
            <Checkbox
              label="Importador (nombre y RNC)"
              checked={secciones.importador}
              onChange={(v) => setSecciones((s) => ({ ...s, importador: v }))}
            />
            <Checkbox
              label={`Datos del ${tipo === 'vehiculo' ? 'vehículo' : 'contenedor'}`}
              checked={secciones.datos && mismoTipo}
              disabled={!mismoTipo}
              hint={!mismoTipo ? 'La factura elegida es de otro tipo' : undefined}
              onChange={(v) => setSecciones((s) => ({ ...s, datos: v }))}
            />
            <Checkbox
              label="Conceptos (solo nombres, sin montos)"
              checked={secciones.conceptos}
              onChange={(v) => setSecciones((s) => ({ ...s, conceptos: v }))}
            />
          </div>
        </fieldset>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={usar}
          disabled={!elegida}
          className="rounded-lg bg-action-primary px-5 py-2.5 text-sm font-display font-semibold text-white transition-colors hover:bg-action-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Usar selección
        </button>
      </div>
    </div>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <label
      className={
        'flex items-center gap-2.5 text-sm ' +
        (disabled ? 'text-text-tertiary cursor-not-allowed' : 'text-text-primary cursor-pointer')
      }
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border-strong text-action-primary focus:ring-action-primary/40"
      />
      <span>
        {label}
        {hint && <span className="ml-1 text-xs text-text-tertiary">· {hint}</span>}
      </span>
    </label>
  )
}
