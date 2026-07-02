'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NotificacionFila } from '@/lib/notificaciones/tipos'

// Conteo rápido de no leídas — usado para el badge y su polling ligero.
export async function contarNoLeidas(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('leida', false)

  return count ?? 0
}

// Lista las notificaciones más recientes del usuario (carga perezosa al abrir
// el dropdown), con los datos necesarios para armar el mensaje legible.
export async function listarRecientes(limit = 20): Promise<NotificacionFila[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select(
      `id, tipo, leida, created_at, document_id,
       documents (importador_nombre, vencimiento_parqueo),
       profiles!notifications_actor_id_fkey (full_name)`,
    )
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((n) => {
    const doc = n.documents as { importador_nombre: string; vencimiento_parqueo: string | null } | null
    const actor = n.profiles as { full_name: string } | null
    return {
      id: n.id,
      tipo: n.tipo,
      leida: n.leida,
      created_at: n.created_at,
      document_id: n.document_id,
      importador: doc?.importador_nombre ?? null,
      vencimiento: doc?.vencimiento_parqueo ?? null,
      actor_nombre: actor?.full_name ?? null,
    }
  })
}

export async function marcarLeida(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('notifications').update({ leida: true }).eq('id', id).eq('recipient_id', user.id)
  revalidatePath('/', 'layout')
}

export async function marcarTodasLeidas(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ leida: true })
    .eq('recipient_id', user.id)
    .eq('leida', false)
  revalidatePath('/', 'layout')
}
