import Link from 'next/link'

// 404 propio (reemplaza el genérico de Next.js, que salía en inglés y sin salida).
// Captura rutas inexistentes escritas a mano o enlaces rotos.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-6 text-center">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-electrico-600 text-sm font-bold tracking-wide text-white">
          LC
        </span>
        <span className="text-lg font-semibold">
          <span className="text-brand-primary">Logi</span>
          <span className="text-brand-electrico-600">Costo</span>
        </span>
      </div>

      <p className="mt-8 text-5xl font-bold text-brand-primary">404</p>
      <h1 className="mt-3 text-lg font-semibold text-text-primary">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        La página que buscas no existe o aún no está disponible. Puede que sea una sección que
        estamos preparando.
      </p>

      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-marino-900"
      >
        Volver a Inicio
      </Link>
    </main>
  )
}
