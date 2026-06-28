'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { invitarUsuario, cambiarRol } from '@/app/(protected)/ajustes/actions'
import { ROLES, ROL_LABEL, type UsuarioFila } from './types'

const inputCls =
  'rounded-lg border border-border-strong px-3 py-2 text-sm ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary ' +
  'disabled:bg-surface-hover disabled:text-text-tertiary'

type Props = {
  usuarios: UsuarioFila[]
  currentUserId: string
  serviceRoleConfigurado: boolean
  esTitular: boolean
}

export default function UsuariosPanel({ usuarios, currentUserId, serviceRoleConfigurado, esTitular }: Props) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  // Form de invitación
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<string>('suplente')

  function handleCambiarRol(id: string, nuevoRol: string) {
    setMensaje(null)
    startTransition(async () => {
      const res = await cambiarRol(id, nuevoRol)
      if (!res.ok) setMensaje({ tipo: 'error', texto: res.error })
      else router.refresh()
    })
  }

  function handleInvitar() {
    setMensaje(null)
    startTransition(async () => {
      const res = await invitarUsuario(email, nombre, rol)
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: res.error })
        return
      }
      setMensaje({ tipo: 'ok', texto: `Invitación enviada a ${email.trim()}.` })
      setEmail('')
      setNombre('')
      setRol('suplente')
      router.refresh()
    })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Equipo</h2>
        <p className="text-sm text-text-secondary">
          Usuarios con acceso al panel. Los roles son informativos (titular / suplente).
        </p>
      </div>

      {!serviceRoleConfigurado && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La gestión de usuarios requiere <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
          en el entorno (.env.local y Vercel). Sin ella puedes ver el equipo pero no invitar ni
          cambiar roles.
        </div>
      )}

      {serviceRoleConfigurado && !esTitular && (
        <div className="rounded-lg border border-border bg-surface-hover px-4 py-3 text-sm text-text-secondary">
          Solo el <span className="font-medium">titular</span> puede invitar usuarios y cambiar roles.
        </div>
      )}

      {mensaje && (
        <p
          className={
            'rounded-lg px-3 py-2 text-sm ' +
            (mensaje.tipo === 'ok'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700')
          }
        >
          {mensaje.texto}
        </p>
      )}

      {/* Lista de usuarios */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usuarios.map((u) => (
              <tr key={u.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-text-primary">
                  {u.full_name}
                  {u.id === currentUserId && (
                    <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      Tú
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={ROLES.includes(u.role as (typeof ROLES)[number]) ? u.role : ''}
                    disabled={!serviceRoleConfigurado || !esTitular || pendiente}
                    onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                    className={inputCls + ' py-1.5'}
                    aria-label={`Rol de ${u.full_name}`}
                  >
                    {!ROLES.includes(u.role as (typeof ROLES)[number]) && (
                      <option value="">{ROL_LABEL[u.role] ?? u.role}</option>
                    )}
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROL_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invitar */}
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-text-primary">Invitar usuario</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Se enviará un correo para que establezca su contraseña.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Nombre</label>
            <input
              className={inputCls + ' w-full'}
              value={nombre}
              disabled={!serviceRoleConfigurado || !esTitular || pendiente}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Correo</label>
            <input
              type="email"
              className={inputCls + ' w-full'}
              value={email}
              disabled={!serviceRoleConfigurado || !esTitular || pendiente}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Rol</label>
            <select
              className={inputCls + ' w-full py-2'}
              value={rol}
              disabled={!serviceRoleConfigurado || !esTitular || pendiente}
              onChange={(e) => setRol(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleInvitar}
            disabled={!serviceRoleConfigurado || !esTitular || pendiente}
            className="rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60"
          >
            {pendiente ? 'Enviando…' : 'Invitar'}
          </button>
        </div>
      </div>
    </section>
  )
}
