import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import DocumentoPDF from '@/lib/pdf/documento-pdf'
import { getLogoBase64 } from '@/lib/pdf/logo'
import type { DocumentoData } from '@/lib/documentos/types'

// @react-pdf/renderer requiere runtime Node (no Edge).
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const versionId = new URL(req.url).searchParams.get('version')
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('id, current_version_id')
    .eq('id', id)
    .single()

  if (!doc) return new Response('No encontrado', { status: 404 })

  const versionQuery = supabase
    .from('document_versions')
    .select('data, version_number')
    .eq('document_id', id)

  // ?version=<id> imprime una versión específica (timeline); por defecto la vigente.
  const { data: version } = versionId
    ? await versionQuery.eq('id', versionId).single()
    : doc.current_version_id
      ? await versionQuery.eq('id', doc.current_version_id).single()
      : await versionQuery.eq('version_number', 1).single()

  if (!version) return new Response('Sin datos', { status: 404 })

  const data = version.data as unknown as DocumentoData
  const logoBase64 = await getLogoBase64()

  const elemento = createElement(DocumentoPDF, {
    data,
    versionNumber: version.version_number,
    logoBase64,
    fechaEmision: new Date(),
  }) as ReactElement<DocumentProps>

  const buffer = await renderToBuffer(elemento)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="LM-Aduanas-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
