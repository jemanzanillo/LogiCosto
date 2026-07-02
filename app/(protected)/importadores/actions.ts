'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { puede } from '@/lib/auth/permisos'

type Result = { ok: true; id?: string } | { ok: false; error: string }

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
  return { supabase, profile }
}

// Busca un importador con el mismo nombre en la org (case-insensitive),
// opcionalmente excluyendo un id (para la edición). Evita duplicados.
async function existeNombre(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  nombre: string,
  excluirId?: string,
): Promise<boolean> {
  let q = supabase.from('importadores').select('id').eq('org_id', orgId).ilike('nombre', nombre)
  if (excluirId) q = q.neq('id', excluirId)
  const { data } = await q.maybeSingle()
  return !!data
}

export async function crearImportador(nombre: string, rnc: string): Promise<Result> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx
  if (!(await puede(supabase, profile.role, profile.org_id, 'importador.gestionar')))
    return { ok: false, error: 'No tienes permiso para gestionar importadores.' }

  const limpio = nombre.trim()
  if (!limpio) return { ok: false, error: 'El nombre del importador es obligatorio.' }
  if (await existeNombre(supabase, profile.org_id, limpio))
    return { ok: false, error: 'Ya existe un importador con ese nombre.' }

  const { data, error } = await supabase
    .from('importadores')
    .insert({ org_id: profile.org_id, nombre: limpio, rnc: rnc.trim(), created_by: profile.id })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear el importador.' }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    actor_profile_id: profile.id,
    action: 'preset_crear',
    detail: { nombre: limpio },
  })

  revalidatePath('/importadores')
  return { ok: true, id: data.id }
}

export async function editarImportador(id: string, nombre: string, rnc: string): Promise<Result> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx
  if (!(await puede(supabase, profile.role, profile.org_id, 'importador.gestionar')))
    return { ok: false, error: 'No tienes permiso para gestionar importadores.' }

  const limpio = nombre.trim()
  if (!limpio) return { ok: false, error: 'El nombre del importador es obligatorio.' }
  if (await existeNombre(supabase, profile.org_id, limpio, id))
    return { ok: false, error: 'Ya existe otro importador con ese nombre.' }

  // Nota: no se propaga el cambio a los documentos existentes. Cada documento
  // conserva el nombre/RNC con que se emitió (es un registro de un momento dado).
  const { error } = await supabase
    .from('importadores')
    .update({ nombre: limpio, rnc: rnc.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    actor_profile_id: profile.id,
    action: 'preset_editar',
    detail: { nombre: limpio },
  })

  revalidatePath('/importadores')
  return { ok: true }
}

export async function eliminarImportador(id: string): Promise<Result> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx
  if (!(await puede(supabase, profile.role, profile.org_id, 'importador.gestionar')))
    return { ok: false, error: 'No tienes permiso para gestionar importadores.' }

  const { data: imp } = await supabase.from('importadores').select('nombre').eq('id', id).single()

  // Los documentos que lo referencian quedan con importador_id NULL (FK SET NULL);
  // conservan su nombre/RNC denormalizado, así que no se pierde información.
  const { error } = await supabase.from('importadores').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    actor_profile_id: profile.id,
    action: 'preset_editar',
    detail: { nombre: imp?.nombre ?? null, accion: 'eliminar' },
  })

  revalidatePath('/importadores')
  return { ok: true }
}
