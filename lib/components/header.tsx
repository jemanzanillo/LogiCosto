import { Mail, Bell } from 'lucide-react'
import LcLogo from './lc-logo'

// Cabecera superior a todo el ancho (hi-fi Panel de inicio, frame Cabecera 88px):
// lockup de marca a la izquierda, acciones (mensajes / notificaciones) a la derecha.
export default function Header() {
  return (
    <header className="h-[72px] shrink-0 flex items-center justify-between px-6 bg-surface-raised border-b border-border">
      <LcLogo withWordmark size={40} />
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Mensajes"
          className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <Mail size={20} />
        </button>
        <button
          type="button"
          aria-label="Notificaciones"
          className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}
