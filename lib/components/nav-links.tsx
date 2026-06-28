'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

type Item = { href: string; label: string; icon: LucideIcon }

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
      { href: '/conceptos', label: 'Conceptos frecuentes', icon: ListChecks },
      { href: '/respaldo', label: 'Respaldo', icon: FileSpreadsheet },
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

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
      {GRUPOS.map((grupo) => (
        <div key={grupo.label}>
          <p className="px-3 mb-1.5 text-[11px] font-display font-semibold tracking-wider text-text-tertiary">
            {grupo.label}
          </p>
          <ul className="space-y-0.5">
            {grupo.items.map(({ href, label, icon: Icon }) => {
              // Las páginas de un documento existente (/documentos/[id], .../versiones)
              // cuelgan del Historial; "Nueva factura" solo se activa en /documentos/nuevo.
              const enDocumentoExistente =
                pathname.startsWith('/documentos/') && pathname !== '/documentos/nuevo'
              const activo =
                pathname === href ||
                pathname.startsWith(href + '/') ||
                (href === '/historial' && enDocumentoExistente)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-display transition-colors ' +
                      (activo
                        ? 'bg-brand-electrico-50 text-brand-electrico-800 font-medium'
                        : 'text-text-primary/80 hover:bg-surface-hover hover:text-text-primary')
                    }
                  >
                    <Icon
                      size={18}
                      className={'shrink-0 ' + (activo ? 'text-action-primary' : 'text-text-secondary')}
                    />
                    {label}
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
