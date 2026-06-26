import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-800">Panel principal</h2>
        <p className="text-sm text-gray-500">Crea un documento de gastos y expórtalo a PDF.</p>
      </div>

      <Link
        href="/documentos/nuevo"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-marino-900"
      >
        + Nueva factura
      </Link>
    </div>
  )
}
