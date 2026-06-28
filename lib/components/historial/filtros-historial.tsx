'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const selectCls =
  'rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display text-text-secondary ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary'

export default function FiltrosHistorial() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const set = useCallback(
    (clave: string, valor: string) => {
      const next = new URLSearchParams(params.toString())
      if (valor) {
        next.set(clave, valor)
      } else {
        next.delete(clave)
      }
      next.delete('page') // reset paginación al filtrar
      startTransition(() => {
        router.push('/historial?' + next.toString())
      })
    },
    [params, router],
  )

  function limpiar() {
    startTransition(() => {
      router.push('/historial')
    })
  }

  const tipo = params.get('tipo') ?? ''
  const estado = params.get('estado') ?? ''
  const rnc = params.get('rnc') ?? ''
  const desde = params.get('desde') ?? ''
  const hasta = params.get('hasta') ?? ''

  const hayFiltros = tipo || estado || rnc || desde || hasta || params.get('q')

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tipo */}
      <select
        value={tipo}
        onChange={(e) => set('tipo', e.target.value)}
        className={selectCls}
        aria-label="Filtrar por tipo"
      >
        <option value="">Tipo</option>
        <option value="vehiculo">Vehículo</option>
        <option value="contenedor">Contenedor</option>
      </select>

      {/* Estado */}
      <select
        value={estado}
        onChange={(e) => set('estado', e.target.value)}
        className={selectCls}
        aria-label="Filtrar por estado"
      >
        <option value="">Estado</option>
        <option value="borrador">Borrador</option>
        <option value="pendiente">Pendiente</option>
        <option value="aprobada">Aprobada</option>
        <option value="vencida">Vencida</option>
      </select>

      {/* Importador (search) — ya cubierto por la barra principal, pero disponible aquí */}

      {/* RNC */}
      <input
        type="text"
        placeholder="RNC"
        value={rnc}
        onChange={(e) => set('rnc', e.target.value)}
        className={selectCls + ' w-36'}
        aria-label="Filtrar por RNC"
      />

      {/* Fechas */}
      <input
        type="date"
        value={desde}
        onChange={(e) => set('desde', e.target.value)}
        className={selectCls}
        aria-label="Desde"
        title="Desde"
      />
      <span className="text-text-tertiary text-xs">–</span>
      <input
        type="date"
        value={hasta}
        onChange={(e) => set('hasta', e.target.value)}
        className={selectCls}
        aria-label="Hasta"
        title="Hasta"
      />

      {/* Limpiar */}
      {hayFiltros && (
        <button
          onClick={limpiar}
          className="text-sm font-display font-medium text-action-primary hover:underline whitespace-nowrap"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
