'use client'

import { useEffect } from 'react'
import NavLinks from './nav-links'
import LogoutButton from './logout-button'
import { useSidebar } from './sidebar-context'

type Props = {
  nombre: string
  role: string
}

// Carcasa interactiva del menú lateral.
// - md+ : rail colapsado a solo iconos (72px) que se expande a 248px al hacer
//   hover o recibir foco de teclado (focus-within), superponiéndose al contenido.
// - <md : oculto; se muestra como drawer deslizante controlado por el contexto,
//   con backdrop. El grupo `peer`/`group` alterna etiquetas vs iconos.
export default function SidebarShell({ nombre, role }: Props) {
  const { mobileOpen, closeMobile } = useSidebar()

  // Cerrar el drawer con Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, closeMobile])

  return (
    <>
      {/* Backdrop del drawer (solo móvil) */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden ' +
          (mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0')
        }
      />

      {/* Gutter reservado en md+ (72px); en móvil no ocupa espacio en el flujo */}
      <div className="hidden md:block md:w-[72px] md:shrink-0" aria-hidden="true" />

      {/*
        Panel. En md+ es absolute dentro del gutter para superponerse al main al
        expandir. En móvil es fixed y se traduce según mobileOpen.
      */}
      <aside
        className={
          'group fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col overflow-hidden ' +
          'border-r border-border bg-surface-raised shadow-xl transition-transform duration-200 ' +
          'motion-reduce:transition-none ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full') +
          // En md+: siempre visible, ancho colapsado que crece con hover/foco, sin sombra salvo expandido
          ' md:absolute md:top-0 md:bottom-0 md:z-40 md:translate-x-0 md:w-[72px] ' +
          'md:shadow-none md:transition-[width] md:hover:w-[248px] md:focus-within:w-[248px] ' +
          'md:hover:shadow-xl md:focus-within:shadow-xl'
        }
      >
        <NavLinks />

        {/* Pie: logo del gestor + tarjeta usuario + cerrar sesión */}
        <div className="shrink-0 border-t border-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lm-aduanas-logo.png"
              alt="LM Aduanas"
              className="h-9 w-auto shrink-0 object-contain"
            />
            <div className="min-w-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <div className="truncate font-display text-sm font-medium text-text-primary">
                {nombre}
              </div>
              <div className="truncate text-[11px] capitalize text-text-secondary">{role}</div>
            </div>
          </div>
          <div className="overflow-hidden whitespace-nowrap opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  )
}
