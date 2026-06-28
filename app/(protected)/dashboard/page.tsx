import Link from 'next/link'
import { Search, Plus, Upload, Car, Container } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolverPermisos } from '@/lib/auth/permisos'
import TablaRecientes from '@/lib/components/dashboard/tabla-recientes'
import type { DocumentoFila } from '@/lib/components/historial/types'
import type { DocumentoData } from '@/lib/documentos/types'

type Kpi = {
  key: string
  label: string
  count: number
  href: string
  acento?: boolean
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().slice(0, 10)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role, org_id').eq('id', user.id).single()
    : { data: null }
  const permisos = miPerfil
    ? Array.from(await resolverPermisos(supabase, miPerfil.role, miPerfil.org_id))
    : []

  // Conteos por estado (cabeza, sin traer filas). Vencida y Pendiente derivan
  // ambas de `exportada` según la fecha de vencimiento (ver doc §4).
  const base = () => supabase.from('documents').select('id', { count: 'exact', head: true })
  const [borradores, aprobadas, pendientes, vencidas, recientes] = await Promise.all([
    base().eq('status', 'borrador'),
    base().eq('status', 'finalizada'),
    base().eq('status', 'exportada').or(`vencimiento_parqueo.is.null,vencimiento_parqueo.gte.${hoy}`),
    base().eq('status', 'exportada').lt('vencimiento_parqueo', hoy),
    supabase
      .from('documents')
      .select(
        `id, tipo, status, origen, importador_nombre, importador_rnc,
         vencimiento_parqueo, updated_at, created_at,
         document_versions!fk_current_version (version_number, data),
         profiles!documents_created_by_fkey (full_name)`,
      )
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  const kpis: Kpi[] = [
    { key: 'pendiente', label: 'Pendientes', count: pendientes.count ?? 0, href: '/historial?estado=pendiente' },
    { key: 'aprobada', label: 'Aprobadas', count: aprobadas.count ?? 0, href: '/historial?estado=aprobada' },
    { key: 'borrador', label: 'Borradores', count: borradores.count ?? 0, href: '/historial?estado=borrador' },
    { key: 'vencida', label: 'Vencidas', count: vencidas.count ?? 0, href: '/historial?estado=vencida', acento: true },
  ]

  const filas: DocumentoFila[] = (recientes.data ?? []).map((r) => {
    const ver = r.document_versions as { version_number: number; data: unknown } | null
    const perfil = r.profiles as { full_name: string } | null
    return {
      id: r.id,
      tipo: r.tipo as DocumentoFila['tipo'],
      status: r.status as DocumentoFila['status'],
      origen: r.origen as DocumentoFila['origen'],
      importador_nombre: r.importador_nombre,
      importador_rnc: r.importador_rnc,
      vencimiento_parqueo: r.vencimiento_parqueo,
      updated_at: r.updated_at,
      created_at: r.created_at,
      version_number: ver?.version_number ?? 1,
      data: (ver?.data ?? {
        tipo: r.tipo,
        importador: { nombre: r.importador_nombre, rnc: r.importador_rnc },
        conceptos: [],
        total: 0,
        vencimiento_parqueo: r.vencimiento_parqueo,
      }) as DocumentoData,
      created_by_name: perfil?.full_name ?? '',
    }
  })

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/historial" method="GET" className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            name="q"
            type="search"
            placeholder="Buscar factura, importador o chasis…"
            className="w-full rounded-lg border border-border bg-surface-raised pl-11 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary"
          />
        </form>
        <div className="flex items-center gap-2">
          <Link
            href="/documentos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2.5 text-sm font-display font-semibold text-white transition-colors hover:bg-action-primary-hover"
          >
            <Plus size={16} /> Agregar
          </Link>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm font-display font-medium text-text-tertiary cursor-not-allowed"
          >
            <Upload size={16} /> Importar
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.key}
            className={
              'rounded-xl border bg-surface-raised p-5 ' +
              (kpi.acento ? 'border-border border-l-4 border-l-status-vencida-dot' : 'border-border')
            }
          >
            <p className="font-display text-sm text-text-secondary">{kpi.label}</p>
            <p
              className={
                'mt-1 font-display text-3xl font-semibold tabular-nums ' +
                (kpi.acento ? 'text-status-vencida-text' : 'text-text-primary')
              }
            >
              {kpi.count}
            </p>
            <Link
              href={kpi.href}
              className="mt-3 inline-block font-display text-xs font-medium text-action-primary hover:underline"
            >
              Ver {kpi.label.toLowerCase()} →
            </Link>
          </div>
        ))}
      </div>

      {/* Recientes */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="font-display text-lg font-semibold text-text-primary">Recientes</h2>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="text-text-tertiary">Tipo:</span>
            <span className="inline-flex items-center gap-1">
              <Car size={16} className="text-action-primary" /> Vehículo
            </span>
            <span className="inline-flex items-center gap-1">
              <Container size={16} className="text-category-contenedor-dot" /> Contenedor
            </span>
          </div>
        </div>
        <TablaRecientes filas={filas} permisos={permisos} />
      </section>
    </div>
  )
}
