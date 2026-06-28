'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin'
import { esRolValido } from '@/lib/components/ajustes/types'
import {
  ACCIONES_DISPONIBLES,
  ROLES_CONFIGURABLES,
  type Accion,
  type RolConfigurable,
} from '@/lib/auth/permisos'

type Result = { ok: true } | { ok: false; error: string }

// Resuelve { id, org_id } del usuario autenticado.
async function getPerfil() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, org_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  return { profile }
}

// Cambia el rol de un usuario del mismo equipo. Usa el cliente service-role
// porque `profiles` no tiene política de UPDATE para usuarios normales.
export async function cambiarRol(profileId: string, role: string): Promise<Result> {
  if (!esRolValido(role)) return { ok: false, error: 'Rol no válido.' }
  if (!hasServiceRole()) {
    return { ok: false, error: 'Configura SUPABASE_SERVICE_ROLE_KEY para gestionar usuarios.' }
  }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  if (ctx.profile.role !== 'titular') return { ok: false, error: 'Solo el titular puede cambiar roles.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .eq('org_id', ctx.profile.org_id) // solo dentro del propio equipo
  if (error) return { ok: false, error: error.message }

  revalidatePath('/ajustes')
  return { ok: true }
}

// Invita a un usuario nuevo por correo y crea su perfil en el equipo.
export async function invitarUsuario(
  email: string,
  fullName: string,
  role: string,
): Promise<Result> {
  const correo = email.trim().toLowerCase()
  const nombre = fullName.trim()
  if (!correo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, error: 'Correo no válido.' }
  }
  if (!nombre) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!esRolValido(role)) return { ok: false, error: 'Rol no válido.' }
  if (!hasServiceRole()) {
    return { ok: false, error: 'Configura SUPABASE_SERVICE_ROLE_KEY para invitar usuarios.' }
  }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  if (ctx.profile.role !== 'titular') return { ok: false, error: 'Solo el titular puede invitar usuarios.' }

  const admin = createAdminClient()

  // Crea el usuario en auth y envía el correo de invitación (set de contraseña).
  const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
    data: { full_name: nombre },
  })
  if (error || !data?.user) {
    return { ok: false, error: error?.message ?? 'No se pudo invitar al usuario.' }
  }

  // No hay trigger en auth.users → creamos el perfil explícitamente.
  const { error: perfErr } = await admin.from('profiles').insert({
    id: data.user.id,
    org_id: ctx.profile.org_id,
    full_name: nombre,
    role,
  })
  if (perfErr) return { ok: false, error: perfErr.message }

  revalidatePath('/ajustes')
  return { ok: true }
}

// Activa/desactiva un permiso de un rol configurable (suplente/operador) dentro
// de la organización del titular. Exclusiva del titular; escritura vía
// service-role porque role_permissions no tiene política de UPDATE/INSERT para
// usuarios normales (igual patrón que cambiarRol).
export async function actualizarPermiso(
  role: string,
  action: string,
  allowed: boolean,
): Promise<Result> {
  if (!ROLES_CONFIGURABLES.includes(role as RolConfigurable)) {
    return { ok: false, error: 'Rol no configurable.' }
  }
  if (!ACCIONES_DISPONIBLES.includes(action as Accion)) {
    return { ok: false, error: 'Acción no válida.' }
  }
  if (!hasServiceRole()) {
    return { ok: false, error: 'Configura SUPABASE_SERVICE_ROLE_KEY para gestionar permisos.' }
  }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  if (ctx.profile.role !== 'titular') {
    return { ok: false, error: 'Solo el titular puede cambiar permisos.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('role_permissions').upsert({
    org_id: ctx.profile.org_id,
    role,
    action,
    allowed,
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/ajustes')
  return { ok: true }
}
