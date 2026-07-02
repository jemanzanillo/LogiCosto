import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import type { NotificacionTipo } from './tipos'

// Notifica a todo el equipo de la organización excepto al autor de la acción
// (broadcast — coherente con la filosofía de paridad ya usada en notas
// internas: un equipo pequeño donde todos ven todo). Usa el cliente
// autenticado normal: RLS permite el insert porque actor y destinatarios
// comparten organización (org_id = my_org_id()).
export async function notificarEquipo(
  supabase: SupabaseClient<Database>,
  orgId: string,
  actorId: string,
  tipo: NotificacionTipo,
  documentId: string,
): Promise<void> {
  const { data: miembros } = await supabase
    .from('profiles')
    .select('id')
    .eq('org_id', orgId)
    .neq('id', actorId)
  if (!miembros?.length) return

  await supabase.from('notifications').insert(
    miembros.map((m) => ({
      org_id: orgId,
      recipient_id: m.id,
      actor_id: actorId,
      tipo,
      document_id: documentId,
    })),
  )
}
