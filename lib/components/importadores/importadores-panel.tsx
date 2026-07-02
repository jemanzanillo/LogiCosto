'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Building2, X } from 'lucide-react'
import { crearImportador, editarImportador, eliminarImportador } from '@/app/(protected)/importadores/actions'

export type ImportadorFila = {
  id: string
  nombre: string
  rnc: string
  usos: number
  created_at: string
}

type Props = {
  importadores: ImportadorFila[]
  puedeGestionar: boolean
}

const inputCls =
  'w-full rounded-lg border border-border-strong px-3 py-2 text-sm text-text-primary ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary'
const labelCls = 'block text-xs font-display font-medium text-text-secondary mb-1'

function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ImportadoresPanel({ importadores, puedeGestionar }: Props) {
  // Modal de crear/editar: null = cerrado, { id? } = abierto.
  const [modal, setModal] = useState<{ id?: string; nombre: string; rnc: string } | null>(null)
  const [aEliminar, setAEliminar] = useState<ImportadorFila | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function abrirNuevo() {
    setError(null)
    setModal({ nombre: '', rnc: '' })
  }
  function abrirEditar(f: ImportadorFila) {
    setError(null)
    setModal({ id: f.id, nombre: f.nombre, rnc: f.rnc })
  }

  function guardar() {
    if (!modal) return
    setError(null)
    start(async () => {
      const res = modal.id
        ? await editarImportador(modal.id, modal.nombre, modal.rnc)
        : await crearImportador(modal.nombre, modal.rnc)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setModal(null)
    })
  }

  function confirmarEliminar() {
    if (!aEliminar) return
    setError(null)
    start(async () => {
      const res = await eliminarImportador(aEliminar.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setAEliminar(null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Importadores</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Presets reutilizables para autocompletar el importador al capturar facturas.
          </p>
        </div>
        {puedeGestionar && (
          <button
            onClick={abrirNuevo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover"
          >
            <Plus size={16} /> Nuevo importador
          </button>
        )}
      </div>

      {importadores.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
          <Building2 size={26} className="text-text-tertiary" />
          <p className="text-sm text-text-secondary">Aún no hay importadores guardados.</p>
          <p className="max-w-sm text-xs text-text-tertiary">
            Se agregan al crear uno aquí o automáticamente al importar facturas históricas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-xs font-display font-semibold uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5">RNC</th>
                <th className="px-4 py-2.5">Facturas</th>
                <th className="px-4 py-2.5">Creado</th>
                {puedeGestionar && <th className="px-4 py-2.5 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {importadores.map((f) => (
                <tr key={f.id} className="bg-surface-raised">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{f.nombre}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text-secondary">{f.rnc || '—'}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text-secondary">{f.usos}</td>
                  <td className="px-4 py-2.5 text-text-tertiary">{formatoFecha(f.created_at)}</td>
                  {puedeGestionar && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => abrirEditar(f)}
                          className="text-text-tertiary transition-colors hover:text-action-primary"
                          aria-label={`Editar ${f.nombre}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setError(null); setAEliminar(f) }}
                          className="text-text-tertiary transition-colors hover:text-status-vencida-dot"
                          aria-label={`Eliminar ${f.nombre}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !pending && setModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-surface-raised p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {modal.id ? 'Editar importador' : 'Nuevo importador'}
              </h2>
              <button onClick={() => !pending && setModal(null)} className="text-text-tertiary hover:text-text-primary" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls}>Nombre / razón social</label>
                <input
                  autoFocus
                  className={inputCls}
                  value={modal.nombre}
                  onChange={(e) => setModal((m) => (m ? { ...m, nombre: e.target.value } : m))}
                  onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
                />
              </div>
              <div>
                <label className={labelCls}>RNC</label>
                <input
                  className={inputCls}
                  value={modal.rnc}
                  onChange={(e) => setModal((m) => (m ? { ...m, rnc: e.target.value } : m))}
                  onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={pending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={pending}
                className="rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60"
              >
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !pending && setAEliminar(null)}>
          <div className="w-full max-w-md rounded-xl bg-surface-raised p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold text-text-primary">Eliminar importador</h2>
            <p className="mt-2 text-sm text-text-secondary">
              ¿Eliminar <span className="font-medium text-text-primary">{aEliminar.nombre}</span> del catálogo?
              {aEliminar.usos > 0 && (
                <> Las {aEliminar.usos} factura(s) que lo usan conservan su nombre y RNC; solo se quita del catálogo de presets.</>
              )}
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAEliminar(null)}
                disabled={pending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={pending}
                className="rounded-lg bg-status-vencida-dot px-4 py-2 text-sm font-display font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
