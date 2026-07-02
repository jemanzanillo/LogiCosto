import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { CONCEPTOS_SUGERIDOS, type DocumentoData, type Importador } from './types'

type DB = SupabaseClient<Database>

export type Sugerencias = {
  // Presets de importador derivados del historial (distintos, ordenados por nombre).
  importadores: Importador[]
  // Conceptos más usados en el historial, completados con la lista sugerida base.
  conceptosFrecuentes: string[]
}

// Deriva presets de importador y conceptos frecuentes a partir de las facturas
// existentes (RLS limita a la org del usuario). El volumen es bajo (~15/día), así
// que basta una sola consulta acotada sobre las versiones vigentes.
export async function obtenerSugerencias(supabase: DB): Promise<Sugerencias> {
  const [{ data: rows }, { data: presets }] = await Promise.all([
    supabase
      .from('documents')
      .select(
        `importador_nombre, importador_rnc,
         document_versions!fk_current_version (data)`,
      )
      .order('updated_at', { ascending: false })
      .limit(200),
    // Presets del catálogo dedicado (tabla importadores): incluye los creados a
    // mano que aún no tienen facturas, para que aparezcan en el autocompletado.
    supabase.from('importadores').select('nombre, rnc').order('nombre', { ascending: true }),
  ])

  // Importadores distintos (por nombre, sin distinguir mayúsculas).
  const impPorNombre = new Map<string, Importador>()
  // Frecuencia de cada concepto en el historial.
  const conteoConceptos = new Map<string, number>()

  // Primero los presets del catálogo (fuente autoritativa del RNC).
  for (const p of presets ?? []) {
    const nombre = (p.nombre ?? '').trim()
    if (nombre) impPorNombre.set(nombre.toLowerCase(), { nombre, rnc: (p.rnc ?? '').trim() })
  }

  for (const r of rows ?? []) {
    const nombre = (r.importador_nombre ?? '').trim()
    if (nombre) {
      const clave = nombre.toLowerCase()
      if (!impPorNombre.has(clave)) {
        impPorNombre.set(clave, { nombre, rnc: (r.importador_rnc ?? '').trim() })
      }
    }
    const data = (r.document_versions as { data: unknown } | null)?.data as
      | DocumentoData
      | undefined
    for (const c of data?.conceptos ?? []) {
      const nom = (c.concepto ?? '').trim()
      if (nom) conteoConceptos.set(nom, (conteoConceptos.get(nom) ?? 0) + 1)
    }
  }

  const importadores = [...impPorNombre.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  )

  // Conceptos del historial por frecuencia; luego se completan con la lista base
  // (CONCEPTOS_SUGERIDOS) para que haya sugerencias útiles aunque el historial
  // sea escaso. Sin duplicados, máximo 12.
  const delHistorial = [...conteoConceptos.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([nom]) => nom)

  const conceptosFrecuentes: string[] = []
  const vistos = new Set<string>()
  for (const nom of [...delHistorial, ...CONCEPTOS_SUGERIDOS]) {
    const clave = nom.toLowerCase()
    if (vistos.has(clave)) continue
    vistos.add(clave)
    conceptosFrecuentes.push(nom)
    if (conceptosFrecuentes.length >= 12) break
  }

  return { importadores, conceptosFrecuentes }
}
