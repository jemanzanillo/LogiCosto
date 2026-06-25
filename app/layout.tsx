import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'LogiCosto',
    template: '%s — LogiCosto',
  },
  description: 'Sistema de gestión de costos logísticos',
  icons: {
    icon: [
      { url: '/Favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/Favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/Icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/Icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/Apple-Touch-Icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'LogiCosto',
    description: 'Sistema de gestión de costos logísticos',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'es',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
