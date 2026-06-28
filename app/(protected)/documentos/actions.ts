'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { armarData, validar, type FormState, type ErroresValidacion } from '@/lib/documentos/types'
import type { Json } from '@/lib/types/database.types'

type GuardarResult =
  | { ok: true; id: string }
  | { ok: false; errores: ErroresValidacion }
  | { ok: false; error: string }

type ExportarResult = { ok: true } | { ok: false; error: string }

// Resuelve el perfil del usuario autenticado ({ id, org_id }) — mismo patrón
// que app/(protected)/layout.tsx.
async function getPerfil() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  return { supabase, profile }
}

// Crea (o actualiza) un documento en estado borrador con su versión 1.
// En Rev 1 no se crean versiones nuevas al editar (eso es Rev 2): se reescribe v1.
export async function guardarBorrador(form: FormState, id?: string): Promise<GuardarResult> {
  const errores = validar(form)
  if (Object.keys(errores).length > 0) return { ok: false, errores }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const data = armarData(form)
  const dataJson = data as unknown as Json

  if (id) {
    // Actualizar documento existente + snapshot de la versión vigente.
    // Solo aplica a borradores: una vez Pendiente/Aprobada el formulario se
    // bloquea y los cambios pasan por crearNuevaVersion().
    const { data: doc, error: readErr } = await supabase
      .from('documents')
      .select('current_version_id')
      .eq('id', id)
      .single()
    if (readErr || !doc) return { ok: false, error: readErr?.message ?? 'Documento no encontrado.' }

    const { error: docErr } = await supabase
      .from('documents')
      .update({
        tipo: data.tipo,
        importador_nombre: data.importador.nombre,
        importador_rnc: data.importador.rnc,
        vencimiento_parqueo: data.vencimiento_parqueo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (docErr) return { ok: false, error: docErr.message }

    // Apuntar a la versión vigente (current_version_id); fallback a la v1 para
    // documentos antiguos creados antes de fijar el puntero.
    const verUpdate = supabase.from('document_versions').update({ data: dataJson })
    const { error: verErr } = doc.current_version_id
      ? await verUpdate.eq('id', doc.current_version_id)
      : await verUpdate.eq('document_id', id).eq('version_number', 1)
    if (verErr) return { ok: false, error: verErr.message }

    revalidatePath(`/documentos/${id}`)
    revalidatePath('/historial')
    return { ok: true, id }
  }

  // Crear documento nuevo.
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      org_id: profile.org_id,
      created_by: profile.id,
      tipo: data.tipo,
      status: 'borrador',
      origen: 'app',
      importador_nombre: data.importador.nombre,
      importador_rnc: data.importador.rnc,
      vencimiento_parqueo: data.vencimiento_parqueo,
    })
    .select('id')
    .single()
  if (docErr || !doc) return { ok: false, error: docErr?.message ?? 'No se pudo crear el documento.' }

  const { data: version, error: verErr } = await supabase
    .from('document_versions')
    .insert({
      document_id: doc.id,
      version_number: 1,
      data: dataJson,
      created_by: profile.id,
    })
    .select('id')
    .single()
  if (verErr || !version) return { ok: false, error: verErr?.message ?? 'No se pudo crear la versión.' }

  await supabase.from('documents').update({ current_version_id: version.id }).eq('id', doc.id)

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: doc.id,
    actor_profile_id: profile.id,
    action: 'crear',
  })

  revalidatePath(`/documentos/${doc.id}`)
  revalidatePath('/historial')
  return { ok: true, id: doc.id }
}

// Marca el documento como exportado y registra la acción. El cliente dispara la
// descarga del PDF desde /api/documentos/[id]/pdf.
export async function exportar(id: string): Promise<ExportarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { error } = await supabase
    .from('documents')
    .update({ status: 'exportada', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: id,
    actor_profile_id: profile.id,
    action: 'exportar',
  })

  revalidatePath(`/documentos/${id}`)
  revalidatePath('/historial')
  return { ok: true }
}

// Crea una versión nueva (v+1) copiando el snapshot de la versión vigente y
// devuelve el documento a estado borrador para corregirlo sin perder el
// historial. Es la única vía de edición cuando el documento ya está
// Pendiente/Aprobada (ver bloqueo en captura-form).
export async function crearNuevaVersion(id: string, nota?: string): Promise<GuardarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('current_version_id')
    .eq('id', id)
    .single()
  if (docErr || !doc) return { ok: false, error: docErr?.message ?? 'Documento no encontrado.' }

  // Snapshot vigente + número de versión máximo.
  const verQuery = supabase.from('document_versions').select('data').eq('document_id', id)
  const { data: actual, error: actualErr } = doc.current_version_id
    ? await verQuery.eq('id', doc.current_version_id).single()
    : await verQuery.eq('version_number', 1).single()
  if (actualErr || !actual) return { ok: false, error: actualErr?.message ?? 'No se encontró la versión vigente.' }

  const { data: max } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()
  const nextVersion = (max?.version_number ?? 0) + 1

  const notaLimpia = nota?.trim() || null

  const { data: version, error: verErr } = await supabase
    .from('document_versions')
    .insert({
      document_id: id,
      version_number: nextVersion,
      data: actual.data,
      nota: notaLimpia,
      created_by: profile.id,
    })
    .select('id')
    .single()
  if (verErr || !version) return { ok: false, error: verErr?.message ?? 'No se pudo crear la versión.' }

  const { error: updErr } = await supabase
    .from('documents')
    .update({
      current_version_id: version.id,
      status: 'borrador',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updErr) return { ok: false, error: updErr.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: id,
    actor_profile_id: profile.id,
    action: 'editar',
    detail: { version: nextVersion, nota: notaLimpia },
  })

  revalidatePath(`/documentos/${id}`)
  revalidatePath(`/documentos/${id}/versiones`)
  revalidatePath('/historial')
  return { ok: true, id }
}

// Transición Pendiente → Aprobada (exportada → finalizada).
export async function marcarAprobada(id: string): Promise<ExportarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { error } = await supabase
    .from('documents')
    .update({ status: 'finalizada', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: id,
    actor_profile_id: profile.id,
    action: 'finalizar',
  })

  revalidatePath(`/documentos/${id}`)
  revalidatePath(`/documentos/${id}/versiones`)
  revalidatePath('/historial')
  return { ok: true }
}

// Transición Aprobada → Pendiente (finalizada → exportada).
export async function revertirPendiente(id: string): Promise<ExportarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { error } = await supabase
    .from('documents')
    .update({ status: 'exportada', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: id,
    actor_profile_id: profile.id,
    action: 'revisar',
    detail: { de: 'finalizada', a: 'exportada' },
  })

  revalidatePath(`/documentos/${id}`)
  revalidatePath(`/documentos/${id}/versiones`)
  revalidatePath('/historial')
  return { ok: true }
}

// Duplica un documento: crea uno nuevo en borrador con el snapshot vigente del
// original como su versión 1. Devuelve el id del nuevo para abrirlo y editarlo.
export async function duplicarDocumento(id: string): Promise<GuardarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { data: orig, error: origErr } = await supabase
    .from('documents')
    .select('tipo, origen, importador_id, importador_nombre, importador_rnc, vencimiento_parqueo, current_version_id')
    .eq('id', id)
    .single()
  if (origErr || !orig) return { ok: false, error: origErr?.message ?? 'Documento no encontrado.' }

  const verQuery = supabase.from('document_versions').select('data').eq('document_id', id)
  const { data: actual, error: actualErr } = orig.current_version_id
    ? await verQuery.eq('id', orig.current_version_id).single()
    : await verQuery.eq('version_number', 1).single()
  if (actualErr || !actual) return { ok: false, error: actualErr?.message ?? 'No se encontró la versión a duplicar.' }

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      org_id: profile.org_id,
      created_by: profile.id,
      tipo: orig.tipo,
      status: 'borrador',
      origen: 'app',
      importador_id: orig.importador_id,
      importador_nombre: orig.importador_nombre,
      importador_rnc: orig.importador_rnc,
      vencimiento_parqueo: orig.vencimiento_parqueo,
    })
    .select('id')
    .single()
  if (docErr || !doc) return { ok: false, error: docErr?.message ?? 'No se pudo crear la copia.' }

  const { data: version, error: verErr } = await supabase
    .from('document_versions')
    .insert({
      document_id: doc.id,
      version_number: 1,
      data: actual.data,
      created_by: profile.id,
    })
    .select('id')
    .single()
  if (verErr || !version) return { ok: false, error: verErr?.message ?? 'No se pudo crear la versión.' }

  await supabase.from('documents').update({ current_version_id: version.id }).eq('id', doc.id)

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: doc.id,
    actor_profile_id: profile.id,
    action: 'crear',
    detail: { duplicado_de: id },
  })

  revalidatePath('/historial')
  revalidatePath(`/documentos/${doc.id}`)
  return { ok: true, id: doc.id }
}

// Elimina un documento. Las versiones se borran en cascada (FK CASCADE) y las
// entradas de audit_log quedan con document_id null (FK SET NULL); se registra
// la acción 'eliminar' antes de borrar (su document_id se anula al hacerlo).
export async function eliminarDocumento(id: string): Promise<ExportarResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { data: doc } = await supabase
    .from('documents')
    .select('importador_nombre, tipo')
    .eq('id', id)
    .single()

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: id,
    actor_profile_id: profile.id,
    action: 'eliminar',
    detail: { importador: doc?.importador_nombre ?? null, tipo: doc?.tipo ?? null },
  })

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/historial')
  return { ok: true }
}
