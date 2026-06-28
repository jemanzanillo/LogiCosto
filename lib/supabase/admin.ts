import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

// Cliente con service-role: omite RLS y habilita la admin API (listar/invitar
// usuarios). SOLO debe usarse en el servidor — nunca exponer la clave al cliente.
// Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno (local y Vercel).

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY. Agrégala al entorno (.env.local y Vercel) para gestionar usuarios.',
    )
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
