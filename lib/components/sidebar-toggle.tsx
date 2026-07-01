'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './sidebar-context'

// Botón hamburguesa (solo móvil) que abre el drawer del menú lateral.
export default function SidebarToggle() {
  const { mobileOpen, setMobileOpen } = useSidebar()

  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menú"
      aria-expanded={mobileOpen}
      className="-ml-1 mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors md:hidden"
    >
      <Menu size={22} />
    </button>
  )
}
