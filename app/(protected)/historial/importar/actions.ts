'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { armarData, validar, type FormState, type ErroresValidacion } from '@/lib/documentos/types'
import type { Json } from '@/lib/types/database.types'
import { puede } from '@/lib/auth/permisos'
import { parsearFacturaWord } from '@/lib/documentos/importar-word'

// Resuelve el perfil del usuario autenticado ({ id, org_id, role }).
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

export type ExtraerResult =
  | { ok: true; form: FormState; advertencias: string[]; archivo: string }
  | { ok: false; error: string }

// Paso 1 de la migración: recibe el .docx, extrae los datos y los devuelve a la
// pantalla de revisión. NO escribe en la base de datos.
export async function extraerHistorico(formData: FormData): Promise<ExtraerResult> {
  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const permitido = await puede(ctx.supabase, ctx.profile.role, ctx.profile.org_id, 'documento.importar')
  if (!permitido) return { ok: false, error: 'No tienes permiso para importar históricos.' }

  const file = formData.get('archivo')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Selecciona un archivo Word (.docx).' }
  }
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return { ok: false, error: 'El archivo debe ser un documento Word (.docx). El formato .doc antiguo no es compatible.' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { form, advertencias } = await parsearFacturaWord(buffer)
    return { ok: true, form, advertencias, archivo: file.name }
  } catch {
    return { ok: false, error: 'No se pudo leer el documento. Verifica que sea un .docx válido.' }
  }
}

export type ImportarResult =
  | { ok: true; id: string }
  | { ok: false; errores: ErroresValidacion }
  | { ok: false; error: string }

// Paso 2: confirma la importación tras la revisión humana. Inserta el documento
// como HISTÓRICO FINALIZADO (origen='historico', status='finalizada') con su
// versión 1, siembra el importador como preset y registra la acción 'importar'.
export async function importarHistorico(
  form: FormState,
  archivo?: string,
): Promise<ImportarResult> {
  const errores = validar(form)
  if (Object.keys(errores).length > 0) return { ok: false, errores }

  const ctx = await getPerfil()
  if (!ctx) return { ok: false, error: 'Sesión no válida.' }
  const { supabase, profile } = ctx

  const permitido = await puede(supabase, profile.role, profile.org_id, 'documento.importar')
  if (!permitido) return { ok: false, error: 'No tienes permiso para importar históricos.' }

  const data = armarData(form)
  const dataJson = data as unknown as Json

  // Preset de importador (los históricos migrados alimentan el catálogo, ver
  // bloque 5). Best-effort: si algo falla, el documento igual se importa.
  const importadorId = await upsertImportador(
    supabase,
    profile.org_id,
    profile.id,
    data.importador.nombre,
    data.importador.rnc,
  )

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      org_id: profile.org_id,
      created_by: profile.id,
      tipo: data.tipo,
      status: 'finalizada',
      origen: 'historico',
      importador_id: importadorId,
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
    action: 'importar',
    detail: { archivo: archivo ?? null, importador: data.importador.nombre },
  })

  revalidatePath('/historial')
  revalidatePath(`/documentos/${doc.id}`)
  return { ok: true, id: doc.id }
}

// Inserta el importador en el catálogo si aún no existe (match por nombre,
// case-insensitive, dentro de la org). Devuelve el id del preset o null.
async function upsertImportador(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  profileId: string,
  nombre: string,
  rnc: string,
): Promise<string | null> {
  const limpio = nombre.trim()
  if (!limpio) return null
  try {
    const { data: existente } = await supabase
      .from('importadores')
      .select('id')
      .eq('org_id', orgId)
      .ilike('nombre', limpio)
      .maybeSingle()
    if (existente) return existente.id

    const { data: nuevo } = await supabase
      .from('importadores')
      .insert({ org_id: orgId, nombre: limpio, rnc: rnc.trim(), created_by: profileId })
      .select('id')
      .single()
    if (nuevo) {
      await supabase.from('audit_log').insert({
        org_id: orgId,
        actor_profile_id: profileId,
        action: 'preset_crear',
        detail: { nombre: limpio, origen: 'importacion' },
      })
      return nuevo.id
    }
  } catch {
    // Best-effort: no bloquear la importación por el preset.
  }
  return null
}
