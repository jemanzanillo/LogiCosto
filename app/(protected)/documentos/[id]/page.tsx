import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formStateDesdeData, type DocumentoData } from '@/lib/documentos/types'
import CapturaForm from '@/lib/components/captura-form'

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('id, status, current_version_id')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  // Snapshot vigente (versión apuntada por current_version_id, o la v1).
  const versionQuery = supabase
    .from('document_versions')
    .select('data')
    .eq('document_id', id)

  const { data: version } = doc.current_version_id
    ? await versionQuery.eq('id', doc.current_version_id).single()
    : await versionQuery.eq('version_number', 1).single()

  if (!version) notFound()

  const form = formStateDesdeData(version.data as unknown as DocumentoData)

  return <CapturaForm initialId={doc.id} initialStatus={doc.status} initialForm={form} />
}
