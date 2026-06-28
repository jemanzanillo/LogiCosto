import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TablaHistorial from '@/lib/components/historial/tabla-historial'
import FiltrosHistorial from '@/lib/components/historial/filtros-historial'
import type { DocumentoFila } from '@/lib/components/historial/types'
import { estadoUIaDB } from '@/lib/components/historial/types'
import type { DocumentoData } from '@/lib/documentos/types'

const PAGE_SIZE = 10

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function HistorialPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const q = sp.q as string | undefined
  const tipo = sp.tipo as string | undefined
  const estado = sp.estado as string | undefined
  const rnc = sp.rnc as string | undefined
  const desde = sp.desde as string | undefined
  const hasta = sp.hasta as string | undefined
  const page = Math.max(1, Number(sp.page ?? '1'))

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const esTitular = miPerfil?.role === 'titular'

  // Construir la query con filtros
  let query = supabase
    .from('documents')
    .select(
      `id, tipo, status, origen, importador_nombre, importador_rnc,
       vencimiento_parqueo, updated_at, created_at,
       document_versions!fk_current_version (version_number, data),
       profiles!documents_created_by_fkey (full_name)`,
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (q) {
    query = query.or(
      `importador_nombre.ilike.%${q}%,importador_rnc.ilike.%${q}%`,
    )
  }

  if (tipo === 'vehiculo' || tipo === 'contenedor') {
    query = query.eq('tipo', tipo)
  }

  if (estado === 'vencida') {
    const hoy = new Date().toISOString().slice(0, 10)
    query = query.lt('vencimiento_parqueo', hoy).not('vencimiento_parqueo', 'is', null)
  } else if (estado) {
    const dbStatus = estadoUIaDB(estado)
    if (dbStatus) query = query.eq('status', dbStatus)
  }

  if (rnc) {
    query = query.ilike('importador_rnc', `%${rnc}%`)
  }
  if (desde) {
    query = query.gte('updated_at', desde)
  }
  if (hasta) {
    query = query.lte('updated_at', hasta + 'T23:59:59')
  }

  const { data: rows, count } = await query

  // Normalizar a DocumentoFila[]
  const filas: DocumentoFila[] = (rows ?? []).map((r) => {
    const ver = r.document_versions as {
      version_number: number
      data: unknown
    } | null
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
      data: (ver?.data ?? { tipo: r.tipo, importador: { nombre: r.importador_nombre, rnc: r.importador_rnc }, conceptos: [], total: 0, vencimiento_parqueo: r.vencimiento_parqueo }) as DocumentoData,
      created_by_name: perfil?.full_name ?? '',
    }
  })

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Encabezado de página */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Historial</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/documentos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-marino-900 transition-colors"
          >
            + Agregar
          </Link>
          <button
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
            title="Próximamente"
          >
            Importar
          </button>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="space-y-2">
        <BusquedaBar q={q} />
        <Suspense>
          <FiltrosHistorial />
        </Suspense>
      </div>

      {/* Tabla */}
      <Suspense fallback={<div className="text-sm text-gray-400">Cargando…</div>}>
        <TablaHistorial
          filas={filas}
          total={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          esTitular={esTitular}
        />
      </Suspense>
    </div>
  )
}

function BusquedaBar({ q }: { q?: string }) {
  return (
    <form action="/historial" method="GET" className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Buscar factura, importador o chasis…"
        className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      />
    </form>
  )
}
