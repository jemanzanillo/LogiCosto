import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FiltrosAuditoria from '@/lib/components/auditoria/filtros-auditoria'
import {
  ACCION_LABEL,
  ACCION_CLASE,
  resumenDetalle,
  type AuditoriaFila,
  type AuditAction,
} from '@/lib/components/auditoria/types'

const PAGE_SIZE = 15

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AuditoriaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const usuario = sp.usuario as string | undefined
  const accion = sp.accion as string | undefined
  const desde = sp.desde as string | undefined
  const hasta = sp.hasta as string | undefined
  const page = Math.max(1, Number(sp.page ?? '1'))

  const supabase = await createClient()

  let query = supabase
    .from('audit_log')
    .select(
      `id, action, detail, created_at, document_id,
       profiles!audit_log_actor_profile_id_fkey (full_name, role),
       documents (importador_nombre)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (usuario) query = query.eq('actor_profile_id', usuario)
  if (accion) query = query.eq('action', accion as AuditAction)
  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')

  const { data: rows, count } = await query

  const filas: AuditoriaFila[] = (rows ?? []).map((r) => {
    const actor = r.profiles as { full_name: string; role: string } | null
    const doc = r.documents as { importador_nombre: string } | null
    return {
      id: r.id,
      action: r.action,
      detail: (r.detail ?? null) as Record<string, unknown> | null,
      created_at: r.created_at,
      actor_nombre: actor?.full_name ?? '—',
      actor_rol: actor?.role ?? '',
      documento_id: r.document_id,
      documento_importador: doc?.importador_nombre ?? null,
    }
  })

  // Usuarios de la org para el filtro.
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  const total = count ?? 0
  const totalPaginas = Math.ceil(total / PAGE_SIZE)
  const desdeN = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const hastaN = Math.min(page * PAGE_SIZE, total)

  function pageHref(p: number) {
    const next = new URLSearchParams()
    if (usuario) next.set('usuario', usuario)
    if (accion) next.set('accion', accion)
    if (desde) next.set('desde', desde)
    if (hasta) next.set('hasta', hasta)
    next.set('page', String(p))
    return '/auditoria?' + next.toString()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Auditoría</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registro de acciones realizadas por el equipo.
        </p>
      </div>

      <Suspense>
        <FiltrosAuditoria usuarios={usuarios ?? []} />
      </Suspense>

      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          No hay acciones registradas con los filtros seleccionados.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Fecha y hora</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filas.map((f, idx) => {
                  const documento =
                    f.documento_importador ??
                    (f.action === 'eliminar' && typeof f.detail?.importador === 'string'
                      ? (f.detail.importador as string)
                      : null)
                  return (
                    <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {fmtFechaHora(f.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{f.actor_nombre}</span>
                        {f.actor_rol && (
                          <span className="ml-1.5 text-xs text-gray-400 capitalize">
                            · {f.actor_rol}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                            ACCION_CLASE[f.action]
                          }
                        >
                          {ACCION_LABEL[f.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate">
                        {f.documento_id ? (
                          <Link
                            href={`/documentos/${f.documento_id}`}
                            className="text-gray-700 hover:text-brand-primary transition-colors"
                          >
                            {documento ?? 'Documento'}
                          </Link>
                        ) : (
                          <span className="text-gray-500">{documento ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[260px] truncate">
                        {resumenDetalle(f) || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1 text-sm text-gray-500">
            <span>
              Mostrando {desdeN}–{hastaN} de {total} acciones
            </span>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <Link
                  href={pageHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={
                    'rounded-lg px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ' +
                    (page <= 1 ? 'pointer-events-none opacity-40' : '')
                  }
                >
                  ‹
                </Link>
                <span className="px-2 text-gray-500">
                  {page} / {totalPaginas}
                </span>
                <Link
                  href={pageHref(Math.min(totalPaginas, page + 1))}
                  aria-disabled={page >= totalPaginas}
                  className={
                    'rounded-lg px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ' +
                    (page >= totalPaginas ? 'pointer-events-none opacity-40' : '')
                  }
                >
                  ›
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
