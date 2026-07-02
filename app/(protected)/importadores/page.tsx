import { createClient } from '@/lib/supabase/server'
import { puede } from '@/lib/auth/permisos'
import ImportadoresPanel, { type ImportadorFila } from '@/lib/components/importadores/importadores-panel'

export default async function ImportadoresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role, org_id').eq('id', user.id).single()
    : { data: null }

  const puedeGestionar = miPerfil
    ? await puede(supabase, miPerfil.role, miPerfil.org_id, 'importador.gestionar')
    : false

  const { data: rows } = await supabase
    .from('importadores')
    .select('id, nombre, rnc, created_at')
    .order('nombre', { ascending: true })

  // Conteo de facturas por importador (volumen bajo; una sola pasada).
  const { data: docs } = await supabase.from('documents').select('importador_id')
  const conteo = new Map<string, number>()
  for (const d of docs ?? []) {
    if (d.importador_id) conteo.set(d.importador_id, (conteo.get(d.importador_id) ?? 0) + 1)
  }

  const importadores: ImportadorFila[] = (rows ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    rnc: r.rnc,
    usos: conteo.get(r.id) ?? 0,
    created_at: r.created_at,
  }))

  return <ImportadoresPanel importadores={importadores} puedeGestionar={puedeGestionar} />
}
