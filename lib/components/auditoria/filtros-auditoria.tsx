'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { ACCIONES, ACCION_LABEL } from './types'

const selectCls =
  'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 ' +
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'

type Usuario = { id: string; full_name: string }

export default function FiltrosAuditoria({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const set = useCallback(
    (clave: string, valor: string) => {
      const next = new URLSearchParams(params.toString())
      if (valor) next.set(clave, valor)
      else next.delete(clave)
      next.delete('page')
      startTransition(() => router.push('/auditoria?' + next.toString()))
    },
    [params, router],
  )

  const usuario = params.get('usuario') ?? ''
  const accion = params.get('accion') ?? ''
  const desde = params.get('desde') ?? ''
  const hasta = params.get('hasta') ?? ''
  const hayFiltros = usuario || accion || desde || hasta

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={usuario}
        onChange={(e) => set('usuario', e.target.value)}
        className={selectCls}
        aria-label="Filtrar por usuario"
      >
        <option value="">Usuario</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name}
          </option>
        ))}
      </select>

      <select
        value={accion}
        onChange={(e) => set('accion', e.target.value)}
        className={selectCls}
        aria-label="Filtrar por acción"
      >
        <option value="">Acción</option>
        {ACCIONES.map((a) => (
          <option key={a} value={a}>
            {ACCION_LABEL[a]}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={desde}
        onChange={(e) => set('desde', e.target.value)}
        className={selectCls}
        aria-label="Desde"
        title="Desde"
      />
      <span className="text-gray-400 text-xs">–</span>
      <input
        type="date"
        value={hasta}
        onChange={(e) => set('hasta', e.target.value)}
        className={selectCls}
        aria-label="Hasta"
        title="Hasta"
      />

      {hayFiltros && (
        <button
          onClick={() => startTransition(() => router.push('/auditoria'))}
          className="text-sm text-brand-electrico-600 hover:underline whitespace-nowrap"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
