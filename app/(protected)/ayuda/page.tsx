import Link from 'next/link'
import { ArrowRight, LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Faq from '@/lib/components/ayuda/faq'
import ContactoForm from '@/lib/components/ayuda/contacto-form'
import AyudaTabs from '@/lib/components/ayuda/ayuda-tabs'
import MisSolicitudes, { type TicketFila } from '@/lib/components/ayuda/mis-solicitudes'
import { PRIMEROS_PASOS } from '@/lib/components/ayuda/contenido'

export default async function AyudaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const esTitular = perfil?.role === 'titular'

  // Bandeja "Mis solicitudes": el titular ve todas las de la organización;
  // el resto solo las propias. RLS ya aísla por organización.
  let ticketQuery = supabase
    .from('soporte_tickets')
    .select('id, categoria, asunto, estado, created_at, profiles!soporte_tickets_created_by_fkey (full_name)')
    .order('created_at', { ascending: false })
  if (!esTitular && user) ticketQuery = ticketQuery.eq('created_by', user.id)
  const { data: ticketRows } = await ticketQuery

  const tickets: TicketFila[] = (ticketRows ?? []).map((t) => {
    const autor = t.profiles as { full_name: string } | null
    return {
      id: t.id,
      categoria: t.categoria,
      asunto: t.asunto,
      estado: t.estado,
      created_at: t.created_at,
      autor_nombre: autor?.full_name ?? '',
    }
  })

  const centro = (
    <div className="flex flex-col gap-10">
      {/* Primeros pasos */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-text-primary">Primeros pasos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRIMEROS_PASOS.map(({ icon: Icon, titulo, descripcion, pasos, href }) => (
            <div
              key={titulo}
              className="flex flex-col rounded-xl border border-border bg-white p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-electrico-50 text-action-primary">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
              <p className="mt-1 text-sm text-text-secondary">{descripcion}</p>
              <ol className="mt-3 space-y-1.5 text-sm text-text-secondary">
                {pasos.map((paso, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[11px] font-semibold text-text-secondary">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
              {href && (
                <Link
                  href={href.url}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-action-primary hover:underline"
                >
                  {href.label}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-text-primary">Preguntas frecuentes</h2>
        <Faq />
      </section>

      {/* Contacto / soporte */}
      <section>
        <ContactoForm
          nombreInicial={perfil?.full_name ?? ''}
          correoInicial={user?.email ?? ''}
        />
      </section>
    </div>
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-electrico-50 text-action-primary">
          <LifeBuoy size={22} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Centro de ayuda</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Guías para empezar, respuestas a las dudas más frecuentes y un canal directo con
            soporte.
          </p>
        </div>
      </div>

      <AyudaTabs
        centro={centro}
        solicitudes={<MisSolicitudes tickets={tickets} esTitular={esTitular} />}
        totalSolicitudes={tickets.length}
      />
    </div>
  )
}
