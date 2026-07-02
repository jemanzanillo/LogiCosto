import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { puede } from '@/lib/auth/permisos'
import ImportarWizard from '@/lib/components/importar/importar-wizard'

export default async function ImportarHistoricoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('role, org_id').eq('id', user.id).single()
    : { data: null }

  // Gateado por permiso: sin documento.importar no se accede a la migración.
  const permitido = miPerfil
    ? await puede(supabase, miPerfil.role, miPerfil.org_id, 'documento.importar')
    : false
  if (!permitido) redirect('/historial')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/historial"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary transition hover:text-text-primary"
        >
          <ArrowLeft size={15} /> Volver al historial
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">
          Importar factura histórica
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Sube una factura antigua en Word (.docx). Se extraen sus datos y los revisas antes de
          guardarla en el historial como documento aprobado.
        </p>
      </div>

      <ImportarWizard />
    </div>
  )
}
