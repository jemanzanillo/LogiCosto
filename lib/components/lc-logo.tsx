// Lockup de marca LogiCosto: isotipo "LC" en placa + wordmark.
// El isotipo usa el asset oficial public/logo/Icon.svg (fuente de verdad del
// diseño); el wordmark se compone con Outfit (Logi marino + Costo eléctrico).

type Props = {
  /** Muestra el wordmark "LogiCosto" junto al isotipo. */
  withWordmark?: boolean
  /** Lado de la placa en px (el wordmark escala en proporción). */
  size?: number
  className?: string
}

export default function LcLogo({ withWordmark = false, size = 40, className }: Props) {
  return (
    <span className={'inline-flex items-center gap-2.5 ' + (className ?? '')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/Icon.svg"
        width={size}
        height={size}
        alt="LogiCosto"
        className="block shrink-0"
      />
      {withWordmark && (
        <span
          className="font-display font-semibold leading-none"
          style={{ fontSize: size * 0.6 }}
        >
          <span className="text-brand-marino-800">Logi</span>
          <span className="text-brand-electrico-600">Costo</span>
        </span>
      )}
    </span>
  )
}
