import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TimelineVersiones, {
  type VersionFila,
} from '@/lib/components/historial/timeline-versiones'
import { estadoUI, ESTADO_LABEL, ESTADO_CLASE, type EstadoUI } from '@/lib/components/historial/types'
import type { DocumentoData } from '@/lib/documentos/types'
import { resolverPermisos } from '@/lib/auth/permisos'

const CICLO: EstadoUI[] = ['borrador', 'pendiente', 'aprobada']

export default async function VersionesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: doc } = await supabase
    .from('documents')
    .select('id, tipo, status, importador_nombre, vencimiento_parqueo, current_version_id')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  const { data: rows } = await supabase
    .from('document_versions')
    .select(
      `id, version_number, created_at, nota, data,
       profiles!document_versions_created_by_fkey (full_name, role)`,
    )
    .eq('document_id', id)
    .order('version_number', { ascending: false })

  const versiones: VersionFila[] = (rows ?? []).map((r) => {
    const perfil = r.profiles as { full_name: string; role: string } | null
    return {
      id: r.id,
      version_number: r.version_number,
      created_at: r.created_at,
      nota: r.nota,
      created_by_name: perfil?.full_name ?? '',
      created_by_role: perfil?.role ?? '',
    }
  })

  // Identificador (chasis/BL) desde el snapshot de la versión vigente.
  const actual = (rows ?? []).find((r) => r.id === doc.current_version_id) ?? rows?.[0]
  const data = actual?.data as unknown as DocumentoData | undefined
  const identificador =
    doc.tipo === 'vehiculo' ? data?.vehiculo?.chasis : data?.contenedor?.bl

  const estadoActual = estadoUI(doc)
  // El ciclo resalta según el status del documento (Vencida es ortogonal).
  const cicloActivo: EstadoUI =
    doc.status === 'finalizada' ? 'aprobada' : doc.status === 'exportada' ? 'pendiente' : 'borrador'

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Link href="/dashboard" className="hover:text-text-secondary">Inicio</Link>
        <span>/</span>
        <Link href="/historial" className="hover:text-text-secondary">Historial</Link>
        <span>/</span>
        <span className="text-text-secondary">{doc.importador_nombre}</span>
        <span>/</span>
        <span className="text-text-secondary">Versiones</span>
      </nav>

      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Versiones</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {doc.importador_nombre} · {doc.tipo === 'vehiculo' ? 'Vehículo' : 'Contenedor'}
          {identificador ? ` · ${doc.tipo === 'vehiculo' ? 'Chasis' : 'BL'} ${identificador}` : ''}
        </p>
      </div>

      {/* Legend del ciclo */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">Ciclo:</span>
        {CICLO.map((paso, i) => (
          <span key={paso} className="flex items-center gap-2">
            <span
              className={
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ' +
                (paso === cicloActivo
                  ? ESTADO_CLASE[paso]
                  : 'bg-surface-sunken text-text-tertiary')
              }
            >
              {ESTADO_LABEL[paso]}
            </span>
            {i < CICLO.length - 1 && <span className="text-gray-300">→</span>}
          </span>
        ))}
      </div>

      <TimelineVersiones
        docId={doc.id}
        status={doc.status}
        estadoActual={estadoActual}
        currentVersionId={doc.current_version_id}
        versiones={versiones}
        permisos={permisos}
      />
    </div>
  )
}
