'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { invitarUsuario, cambiarRol } from '@/app/(protected)/ajustes/actions'
import { ROLES, ROL_LABEL, type UsuarioFila } from './types'

const inputCls =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

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
        <h2 className="text-base font-semibold text-gray-900">Equipo</h2>
        <p className="text-sm text-gray-500">
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
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
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
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usuarios.map((u) => (
              <tr key={u.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.full_name}
                  {u.id === currentUserId && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      Tú
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email ?? '—'}</td>
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
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-800">Invitar usuario</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Se enviará un correo para que establezca su contraseña.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              className={inputCls + ' w-full'}
              value={nombre}
              disabled={!serviceRoleConfigurado || !esTitular || pendiente}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
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
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-marino-900 disabled:opacity-60"
          >
            {pendiente ? 'Enviando…' : 'Invitar'}
          </button>
        </div>
      </div>
    </section>
  )
}
