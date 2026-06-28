'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarPermiso } from '@/app/(protected)/ajustes/actions'
import { ACCIONES, ROLES_CONFIGURABLES, type AccionDef } from '@/lib/auth/permisos'
import { ROL_LABEL } from './types'

type Props = {
  // Permisos vigentes por rol configurable: { suplente: ['documento.crear', …], … }
  permisos: Record<string, string[]>
  serviceRoleConfigurado: boolean
  esTitular: boolean
}

// Agrupa el catálogo por su campo `grupo`, conservando el orden de ACCIONES.
function porGrupo(): { grupo: string; acciones: AccionDef[] }[] {
  const orden: string[] = []
  const mapa = new Map<string, AccionDef[]>()
  for (const a of ACCIONES) {
    if (!mapa.has(a.grupo)) {
      mapa.set(a.grupo, [])
      orden.push(a.grupo)
    }
    mapa.get(a.grupo)!.push(a)
  }
  return orden.map((grupo) => ({ grupo, acciones: mapa.get(grupo)! }))
}

export default function PermisosPanel({ permisos, serviceRoleConfigurado, esTitular }: Props) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Clave en curso ("role:action") para deshabilitar solo ese checkbox.
  const [enCurso, setEnCurso] = useState<string | null>(null)

  const editable = serviceRoleConfigurado && esTitular

  function tiene(role: string, action: string) {
    return permisos[role]?.includes(action) ?? false
  }

  function toggle(role: string, action: string, allowed: boolean) {
    setError(null)
    setEnCurso(`${role}:${action}`)
    startTransition(async () => {
      const res = await actualizarPermiso(role, action, allowed)
      setEnCurso(null)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const grupos = porGrupo()

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Permisos por rol</h2>
        <p className="text-sm text-gray-500">
          Define qué puede hacer cada rol. El <span className="font-medium">titular</span> siempre
          tiene acceso total y es el único que administra estos permisos.
        </p>
      </div>

      {!esTitular && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Solo el <span className="font-medium">titular</span> puede modificar los permisos. Esta
          vista es de solo lectura.
        </div>
      )}

      {esTitular && !serviceRoleConfigurado && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configura <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> para poder cambiar
          los permisos.
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3 text-center">Titular</th>
              {ROLES_CONFIGURABLES.map((r) => (
                <th key={r} className="px-4 py-3 text-center">
                  {ROL_LABEL[r] ?? r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {grupos.map(({ grupo, acciones }) => (
              <GrupoFilas
                key={grupo}
                grupo={grupo}
                acciones={acciones}
                tiene={tiene}
                editable={editable}
                pendiente={pendiente}
                enCurso={enCurso}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Las acciones marcadas como <span className="font-medium">Próximamente</span> se activarán
        cuando se implemente su módulo.
      </p>
    </section>
  )
}

function GrupoFilas({
  grupo,
  acciones,
  tiene,
  editable,
  pendiente,
  enCurso,
  onToggle,
}: {
  grupo: string
  acciones: AccionDef[]
  tiene: (role: string, action: string) => boolean
  editable: boolean
  pendiente: boolean
  enCurso: string | null
  onToggle: (role: string, action: string, allowed: boolean) => void
}) {
  return (
    <>
      <tr className="bg-gray-50/60">
        <td
          colSpan={2 + ROLES_CONFIGURABLES.length}
          className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400"
        >
          {grupo}
        </td>
      </tr>
      {acciones.map((a) => (
        <tr key={a.key} className="bg-white">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{a.label}</span>
              {!a.disponible && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  Próximamente
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{a.descripcion}</p>
          </td>
          {/* Titular: siempre todo, bloqueado */}
          <td className="px-4 py-3 text-center">
            <input type="checkbox" checked readOnly disabled className="h-4 w-4 accent-brand-primary opacity-60" />
          </td>
          {ROLES_CONFIGURABLES.map((r) => {
            const clave = `${r}:${a.key}`
            return (
              <td key={r} className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={tiene(r, a.key)}
                  disabled={!editable || !a.disponible || (pendiente && enCurso === clave)}
                  onChange={(e) => onToggle(r, a.key, e.target.checked)}
                  className="h-4 w-4 accent-brand-primary disabled:opacity-40"
                  aria-label={`${a.label} para ${ROL_LABEL[r] ?? r}`}
                />
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
