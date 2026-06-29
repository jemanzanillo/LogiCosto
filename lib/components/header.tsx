import LcLogo from './lc-logo'

// Cabecera superior a todo el ancho (hi-fi Panel de inicio, frame Cabecera 88px):
// lockup de marca. Se retiraron los íconos de mensajes/notificaciones porque no
// tenían función (controles que parecen clicables sin acción restan confianza);
// se reincorporarán cuando exista la función de notificaciones (p. ej. vencidas).
export default function Header() {
  return (
    <header className="h-[72px] shrink-0 flex items-center px-6 bg-surface-raised border-b border-border">
      <LcLogo withWordmark size={40} />
    </header>
  )
}
