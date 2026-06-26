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
    // Actualizar documento existente + snapshot de la versión 1.
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

    const { error: verErr } = await supabase
      .from('document_versions')
      .update({ data: dataJson })
      .eq('document_id', id)
      .eq('version_number', 1)
    if (verErr) return { ok: false, error: verErr.message }

    revalidatePath(`/documentos/${id}`)
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
  return { ok: true }
}
