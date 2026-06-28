import { createClient } from '@/lib/supabase/server'
import { resolverPermisos } from '@/lib/auth/permisos'
import type { DocumentoData, DocumentoTipo } from '@/lib/documentos/types'
import NuevaFacturaWizard from '@/lib/components/nueva-factura/wizard'
import type { FacturaPrevia } from '@/lib/components/nueva-factura/paso-origen'

export default async function NuevoDocumentoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role, org_id').eq('id', user.id).single()
    : { data: null }
  const permisos = miPerfil
    ? Array.from(await resolverPermisos(supabase, miPerfil.role, miPerfil.org_id))
    : []

  // Facturas recientes disponibles para "Desde factura anterior". Se incluye el
  // snapshot vigente para copiar secciones en el cliente (los montos se descartan).
  const { data: rows } = await supabase
    .from('documents')
    .select(
      `id, tipo, importador_nombre, created_at,
       document_versions!fk_current_version (data)`,
    )
    .order('updated_at', { ascending: false })
    .limit(25)

  const recientes: FacturaPrevia[] = (rows ?? []).map((r) => {
    const data = (r.document_versions as { data: unknown } | null)?.data as DocumentoData | undefined
    const tipo = r.tipo as DocumentoTipo
    const identificador =
      (tipo === 'vehiculo' ? data?.vehiculo?.chasis : data?.contenedor?.bl) ?? ''
    return {
      id: r.id,
      tipo,
      importador_nombre: r.importador_nombre,
      identificador,
      created_at: r.created_at,
      importador: {
        nombre: data?.importador?.nombre ?? r.importador_nombre,
        rnc: data?.importador?.rnc ?? '',
      },
      vehiculo: data?.vehiculo,
      contenedor: data?.contenedor,
      conceptos: (data?.conceptos ?? []).map((c) => ({ concepto: c.concepto })),
    }
  })

  return <NuevaFacturaWizard recientes={recientes} permisos={permisos} />
}
