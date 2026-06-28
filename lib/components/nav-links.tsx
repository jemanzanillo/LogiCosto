'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GRUPOS = [
  {
    label: 'PRINCIPAL',
    items: [
      { href: '/dashboard', label: 'Inicio' },
      { href: '/documentos/nuevo', label: 'Nueva factura' },
      { href: '/historial', label: 'Historial' },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { href: '/importadores', label: 'Importadores' },
      { href: '/conceptos', label: 'Conceptos frecuentes' },
      { href: '/respaldo', label: 'Respaldo' },
      { href: '/auditoria', label: 'Auditoría' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { href: '/ajustes', label: 'Ajustes' },
      { href: '/ayuda', label: 'Ayuda' },
    ],
  },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      {GRUPOS.map((grupo) => (
        <div key={grupo.label}>
          <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            {grupo.label}
          </p>
          <ul className="space-y-0.5">
            {grupo.items.map(({ href, label }) => {
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
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ' +
                      (activo
                        ? 'bg-brand-electrico-50/10 text-white font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5')
                    }
                  >
                    <span
                      className={
                        'h-1.5 w-1.5 rounded-full shrink-0 ' +
                        (activo ? 'bg-brand-electrico-400' : 'bg-transparent')
                      }
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
