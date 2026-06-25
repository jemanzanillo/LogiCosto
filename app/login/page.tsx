import Image from 'next/image'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Panel izquierdo (1/3) — imagen de fondo + overlay de marca ── */}
      {/* Coloca tu foto en public/login-bg.jpg para activarla */}
      <div
        className="hidden lg:flex lg:w-1/3 relative flex-col items-center justify-end pb-12 overflow-hidden bg-brand-primary"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Overlay oscuro sobre la imagen */}
        <div className="absolute inset-0 bg-brand-primary/70" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src="/logo.webp"
            alt="LM Aduanas"
            width={96}
            height={96}
            className="rounded-xl object-contain"
            priority
          />
          <div className="text-center">
            <p className="text-white font-bold text-lg tracking-wide">LM Aduanas</p>
            <p className="text-white/60 text-xs mt-0.5">Sistema de costos logísticos</p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho (2/3) — formulario ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-8">
        <div className="w-full max-w-sm space-y-8">

          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-primary">LogiCosto</h1>
            <p className="mt-1 text-sm text-gray-500">Inicia sesión para continuar</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <LoginForm />
          </div>


        </div>
      </div>

    </div>
  )
}
