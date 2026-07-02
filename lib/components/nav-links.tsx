'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './sidebar-context'
import {
  LayoutDashboard,
  FilePlus2,
  History,
  Building2,
  ListChecks,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react'

// `proximamente`: la sección está en la hoja de ruta del menú pero su página
// aún no existe. Se muestra (para fijar expectativa) pero NO enlaza, para evitar
// que el usuario caiga en un 404 desde un ítem visible del menú.
type Item = { href: string; label: string; icon: LucideIcon; proximamente?: boolean }

const GRUPOS: { label: string; items: Item[] }[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
      { href: '/documentos/nuevo', label: 'Nueva factura', icon: FilePlus2 },
      { href: '/historial', label: 'Historial', icon: History },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { href: '/importadores', label: 'Importadores', icon: Building2 },
      { href: '/conceptos', label: 'Conceptos frecuentes', icon: ListChecks, proximamente: true },
      { href: '/respaldo', label: 'Respaldo', icon: FileSpreadsheet, proximamente: true },
      { href: '/auditoria', label: 'Auditoría', icon: ShieldCheck },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { href: '/ajustes', label: 'Ajustes', icon: Settings },
      { href: '/ayuda', label: 'Ayuda', icon: CircleHelp },
    ],
  },
]

// Clases que ocultan las etiquetas/encabezados cuando el rail está colapsado en
// md+ (solo iconos) y las revelan al hacer hover o recibir foco (group-*).
// En móvil (drawer) siempre visibles.
const REVEAL = 'md:hidden md:group-hover:inline md:group-focus-within:inline'
const REVEAL_BLOCK = 'block md:hidden md:group-hover:block md:group-focus-within:block'

export default function NavLinks() {
  const pathname = usePathname()
  const { closeMobile } = useSidebar()

  return (
    <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
      {GRUPOS.map((grupo) => (
        <div key={grupo.label}>
          <p className={'px-3 mb-1.5 text-[11px] font-display font-semibold tracking-wider text-text-tertiary ' + REVEAL_BLOCK}>
            {grupo.label}
          </p>
          <ul className="space-y-0.5">
            {grupo.items.map(({ href, label, icon: Icon, proximamente }) => {
              // Las páginas de un documento existente (/documentos/[id], .../versiones)
              // cuelgan del Historial; "Nueva factura" solo se activa en /documentos/nuevo.
              const enDocumentoExistente =
                pathname.startsWith('/documentos/') && pathname !== '/documentos/nuevo'
              const activo =
                pathname === href ||
                pathname.startsWith(href + '/') ||
                (href === '/historial' && enDocumentoExistente)

              // Ítem aún sin página: se muestra deshabilitado con etiqueta "Pronto"
              // (no enlaza, para no caer en un 404).
              if (proximamente) {
                return (
                  <li key={href}>
                    <div
                      aria-disabled="true"
                      title={label + ' · Próximamente'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-display text-text-primary/35 cursor-not-allowed select-none md:justify-center md:group-hover:justify-start md:group-focus-within:justify-start"
                    >
                      <Icon size={18} className="shrink-0 text-text-tertiary" />
                      <span className={REVEAL}>{label}</span>
                      <span className={'ml-auto rounded-full bg-surface-sunken px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-tertiary ' + REVEAL}>
                        Pronto
                      </span>
                    </div>
                  </li>
                )
              }

              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={label}
                    onClick={closeMobile}
                    className={
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-display transition-colors md:justify-center md:group-hover:justify-start md:group-focus-within:justify-start ' +
                      (activo
                        ? 'bg-brand-electrico-50 text-brand-electrico-800 font-medium'
                        : 'text-text-primary/80 hover:bg-surface-hover hover:text-text-primary')
                    }
                  >
                    <Icon
                      size={18}
                      className={'shrink-0 ' + (activo ? 'text-action-primary' : 'text-text-secondary')}
                    />
                    <span className={REVEAL}>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
