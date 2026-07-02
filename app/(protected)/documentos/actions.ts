'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { armarData, validar, type FormState, type ErroresValidacion } from '@/lib/documentos/types'
import type { Json } from '@/lib/types/database.types'
import { puede, type Accion } from '@/lib/auth/permisos'
import type { NotaFila } from '@/lib/components/historial/types'
import { notificarEquipo } from '@/lib/notificaciones/servicio'

const MAX_NOTA = 2000

// Atajo de enforcement: resuelve el permiso del usuario actual y devuelve un
// error uniforme si no lo tiene. El titular siempre pasa (ver resolverPermisos).
async function exigir(
  ctx: { supabase: Awaited<ReturnType<typeof createClient>>; profile: { org_id: string; role: string } },
  accion: Accion,
  mensaje: string,
): Promise<{ ok: false; error: string } | null> {
  const ok = await puede(ctx.supabase, ctx.profile.role, ctx.profile.org_id, accion)
  return ok ? null : { ok: false, error: mensaje }
}

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
    .select('id, org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  return { supabase, profile }
}

// Crea (o actualiza) un documento en estado borrador con su versión 1.
// `opts.parcial` = guardado parcial (autosave / "Guardar borrador"): no exige el
// formulario completo, solo un nombre de importador, para que el trabajo no se
// pierda ante una interrupción. La validación completa se aplica al exportar.
export async function guardarBorrador(
  form: FormState,
  id?: string,
  opts?: { parcial?: boolean },
): Promise<GuardarResult> {
  if (opts?.parcial) {
    if (!form.importador.nombre.trim()) {
      return { ok: false, error: 'Escribe al menos el nombre del importador para guardar.' }
    }
  } else {
    const errores = validar(form)
    if (Object.keys(errores).length > 0) return { ok: false, errores }
  }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const denegado = await exigir(
    ctx,
    id ? 'documento.editar' : 'documento.crear',
    id ? 'No tienes permiso para editar documentos.' : 'No tienes permiso para crear documentos.',
  )
  if (denegado) return denegado

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
    // `.select('id')` permite detectar un update de 0 filas (p. ej. bloqueado por
    // RLS) y fallar de forma explícita en vez de perder los datos en silencio.
    const verUpdate = supabase.from('document_versions').update({ data: dataJson }).select('id')
    const { data: filas, error: verErr } = doc.current_version_id
      ? await verUpdate.eq('id', doc.current_version_id)
      : await verUpdate.eq('document_id', id).eq('version_number', 1)
    if (verErr) return { ok: false, error: verErr.message }
    if (!filas || filas.length === 0) {
      return { ok: false, error: 'No se pudo actualizar la versión del documento.' }
    }

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

  const denegado = await exigir(ctx, 'documento.exportar', 'No tienes permiso para exportar documentos.')
  if (denegado) return denegado

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

  try {
    await notificarEquipo(supabase, profile.org_id, profile.id, 'documento_pendiente', id)
  } catch (e) {
    console.error('No se pudo notificar al equipo (documento_pendiente):', e)
  }

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

  const denegado = await exigir(ctx, 'documento.version_crear', 'No tienes permiso para crear una nueva versión.')
  if (denegado) return denegado

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

  try {
    await notificarEquipo(supabase, profile.org_id, profile.id, 'version_nueva', id)
  } catch (e) {
    console.error('No se pudo notificar al equipo (version_nueva):', e)
  }

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

  const denegado = await exigir(ctx, 'documento.aprobar', 'No tienes permiso para aprobar documentos.')
  if (denegado) return denegado

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

  try {
    await notificarEquipo(supabase, profile.org_id, profile.id, 'documento_aprobado', id)
  } catch (e) {
    console.error('No se pudo notificar al equipo (documento_aprobado):', e)
  }

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

  const denegado = await exigir(ctx, 'documento.revertir', 'No tienes permiso para revertir el estado.')
  if (denegado) return denegado

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

  try {
    await notificarEquipo(supabase, profile.org_id, profile.id, 'documento_revertido', id)
  } catch (e) {
    console.error('No se pudo notificar al equipo (documento_revertido):', e)
  }

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

  const denegado = await exigir(ctx, 'documento.duplicar', 'No tienes permiso para duplicar documentos.')
  if (denegado) return denegado

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

  const denegado = await exigir(ctx, 'documento.eliminar', 'No tienes permiso para eliminar documentos.')
  if (denegado) return denegado

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

// ---------------------------------------------------------------------------
// Notas internas por documento (hilo colaborativo del panel de detalle).
// Libres para todos los roles (sin enforcement de permiso): la transparencia
// entre titular/suplente/operador es justamente el objetivo. RLS aísla por
// organización; la propiedad de la nota se valida a nivel aplicación.
// ---------------------------------------------------------------------------

type NotasResult = { ok: true; notas: NotaFila[] } | { ok: false; error: string }
type NotaMutResult = { ok: true } | { ok: false; error: string }

// Lista las notas de un documento (más antiguas primero), con el nombre del autor.
export async function listarNotas(documentId: string): Promise<NotasResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase } = ctx

  const { data, error } = await supabase
    .from('document_notes')
    .select('id, contenido, created_at, created_by, profiles!document_notes_created_by_fkey (full_name)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
  if (error) return { ok: false, error: error.message }

  const notas: NotaFila[] = (data ?? []).map((n) => {
    const perfil = n.profiles as { full_name: string } | null
    return {
      id: n.id,
      contenido: n.contenido,
      created_at: n.created_at,
      created_by: n.created_by,
      autor_nombre: perfil?.full_name ?? '',
    }
  })
  return { ok: true, notas }
}

// Agrega una nota al hilo del documento y la registra en auditoría.
export async function crearNota(documentId: string, contenido: string): Promise<NotaMutResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const limpio = contenido.trim()
  if (!limpio) return { ok: false, error: 'Escribe una nota antes de agregarla.' }
  if (limpio.length > MAX_NOTA) {
    return { ok: false, error: `La nota no puede superar los ${MAX_NOTA} caracteres.` }
  }

  // Verifica que el documento exista dentro de la organización (RLS lo aísla).
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .single()
  if (docErr || !doc) return { ok: false, error: docErr?.message ?? 'Documento no encontrado.' }

  const { error } = await supabase.from('document_notes').insert({
    org_id: profile.org_id,
    document_id: documentId,
    created_by: profile.id,
    contenido: limpio,
  })
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: documentId,
    actor_profile_id: profile.id,
    action: 'nota_crear',
    detail: { extracto: limpio.slice(0, 80) },
  })

  revalidatePath('/historial')
  revalidatePath(`/documentos/${documentId}`)
  return { ok: true }
}

// Elimina una nota. Solo el autor puede borrar la suya (falla cerrado).
export async function eliminarNota(notaId: string): Promise<NotaMutResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const { data: nota, error: readErr } = await supabase
    .from('document_notes')
    .select('id, document_id, created_by, contenido')
    .eq('id', notaId)
    .single()
  if (readErr || !nota) return { ok: false, error: readErr?.message ?? 'Nota no encontrada.' }
  if (nota.created_by !== profile.id) {
    return { ok: false, error: 'Solo puedes eliminar tus propias notas.' }
  }

  const { error } = await supabase.from('document_notes').delete().eq('id', notaId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    org_id: profile.org_id,
    document_id: nota.document_id,
    actor_profile_id: profile.id,
    action: 'nota_eliminar',
    detail: { extracto: nota.contenido.slice(0, 80) },
  })

  revalidatePath('/historial')
  revalidatePath(`/documentos/${nota.document_id}`)
  return { ok: true }
}
