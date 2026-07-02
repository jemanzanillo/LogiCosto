import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Avisa una sola vez por documento+destinatario cuando el vencimiento de
// parqueo entra en esta ventana (no es un recordatorio diario — ver el
// índice único parcial notifications_vencimiento_dedupe_idx).
const DIAS_AVISO_VENCIMIENTO = 3

// Cron diario (ver vercel.json) que revisa documentos.vencimiento_parqueo y
// notifica a todo el equipo de la organización cuando entra en la ventana de
// aviso. Usa el cliente service-role: corre sin sesión de usuario y cruza
// organizaciones (mismo cliente que ya usa Ajustes para invitar usuarios).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  const hoy = new Date().toISOString().slice(0, 10)
  const limiteDate = new Date()
  limiteDate.setDate(limiteDate.getDate() + DIAS_AVISO_VENCIMIENTO)
  const limite = limiteDate.toISOString().slice(0, 10)

  const { data: docs, error: docsErr } = await supabase
    .from('documents')
    .select('id, org_id')
    .gte('vencimiento_parqueo', hoy)
    .lte('vencimiento_parqueo', limite)

  if (docsErr) {
    console.error('cron/vencimientos: error consultando documentos:', docsErr.message)
    return Response.json({ error: docsErr.message }, { status: 500 })
  }
  if (!docs || docs.length === 0) {
    return Response.json({ documentosRevisados: 0, notificacionesCreadas: 0 })
  }

  const orgIds = Array.from(new Set(docs.map((d) => d.org_id)))
  const { data: miembros } = await supabase.from('profiles').select('id, org_id').in('org_id', orgIds)
  const miembrosPorOrg = new Map<string, string[]>()
  for (const m of miembros ?? []) {
    const lista = miembrosPorOrg.get(m.org_id) ?? []
    lista.push(m.id)
    miembrosPorOrg.set(m.org_id, lista)
  }

  const docIds = docs.map((d) => d.id)
  const { data: existentes } = await supabase
    .from('notifications')
    .select('document_id, recipient_id')
    .eq('tipo', 'vencimiento_proximo')
    .in('document_id', docIds)

  const yaNotificados = new Set((existentes ?? []).map((n) => `${n.document_id}:${n.recipient_id}`))

  const filas: {
    org_id: string
    recipient_id: string
    tipo: 'vencimiento_proximo'
    document_id: string
  }[] = []

  for (const doc of docs) {
    const org = miembrosPorOrg.get(doc.org_id) ?? []
    for (const recipientId of org) {
      const clave = `${doc.id}:${recipientId}`
      if (yaNotificados.has(clave)) continue
      filas.push({ org_id: doc.org_id, recipient_id: recipientId, tipo: 'vencimiento_proximo', document_id: doc.id })
    }
  }

  if (filas.length > 0) {
    const { error: insertErr } = await supabase.from('notifications').insert(filas)
    if (insertErr) {
      console.error('cron/vencimientos: error insertando notificaciones:', insertErr.message)
      return Response.json({ error: insertErr.message }, { status: 500 })
    }
  }

  return Response.json({ documentosRevisados: docs.length, notificacionesCreadas: filas.length })
}
