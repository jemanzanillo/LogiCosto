import type { Config } from 'tailwindcss'

// Paleta del sistema de diseño LogiCosto.
// Fuente de verdad: docs/LogiCosto_Sistema_Diseno.md (§4 Paleta de colores).
// Los nombres son coherentes con las Figma Variables (colección `Tokens`,
// file ip38yfasaFYrtSwooyI0ZQ): p.ej. `bg-brand-marino-800` ↔ var(--brand-marino-800).
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Alias semánticos (mantienen las clases existentes en uso).
          primary: '#1A2B4A', // ↔ brand-marino-800
          accent: '#2E7CF6', //  ↔ brand-electrico-600
          // Marino — color principal
          marino: {
            50: '#E8EDF5',
            100: '#C2CFE3',
            200: '#8FAAC8',
            400: '#4E6F96',
            600: '#2A4470',
            800: '#1A2B4A',
            900: '#0E1929',
          },
          // Eléctrico — acento primario (CTAs)
          electrico: {
            50: '#E6F0FE',
            100: '#B8D4FC',
            200: '#7AACF9',
            400: '#5BA3FF',
            600: '#2E7CF6',
            800: '#1A5CC4',
            900: '#0D3A8A',
          },
          // Ámbar — acento complementario
          ambar: {
            50: '#FEF5E6',
            100: '#FDE0A8',
            200: '#FBC660',
            400: '#F5A623',
            600: '#D4820A',
            800: '#A05E05',
            900: '#6B3D02',
          },
        },
        // Estados de UI (etiqueta → bg/text/border/dot). Ver §4 del doc.
        status: {
          borrador: { bg: '#F5F5F5', text: '#555555', border: '#D1D5DB', dot: '#9CA3AF' },
          pendiente: { bg: '#FFFBEB', text: '#A05E05', border: '#FBC660', dot: '#F5A623' },
          aprobado: { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC', dot: '#16A34A' },
          vencida: { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5', dot: '#DC2626' },
        },
        // Categorías de documento. Ver §4 del doc.
        category: {
          vehiculo: { bg: '#E6F0FE', text: '#1A5CC4', dot: '#2E7CF6' },
          contenedor: { bg: '#FEF5E6', text: '#A05E05', dot: '#F5A623' },
        },
      },
    },
  },
  plugins: [],
}

export default config
