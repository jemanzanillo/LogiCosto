'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type SidebarCtx = {
  /** Estado del drawer en móvil (<md). En md+ no aplica (el rail usa hover). */
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  closeMobile: () => void
}

const Ctx = createContext<SidebarCtx | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Al navegar en móvil, cerrar el drawer.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <Ctx.Provider value={{ mobileOpen, setMobileOpen, closeMobile: () => setMobileOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSidebar debe usarse dentro de <SidebarProvider>')
  return ctx
}
