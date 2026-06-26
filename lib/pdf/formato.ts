// Helpers de formato según docs/especificacion_pdf.md §5.
// Portado desde docs/formato.js. Compartido por el PDF y el preview HTML.

import type { ConceptoLinea } from '@/lib/documentos/types'

export function formatoMoneda(monto: number | string | null | undefined): string {
  const n = Number(monto) || 0
  const partes = n.toFixed(2).split('.')
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `RD$${partes[0]}.${partes[1]}`
}

export function formatoFecha(fechaISO: string | null | undefined): string {
  // 'YYYY-MM-DD' -> 'DD/MM/AAAA'
  if (!fechaISO) return ''
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

export function formatoConcepto(texto: string | null | undefined): string {
  return (texto || '').toUpperCase()
}

export function calcularTotal(conceptos: ConceptoLinea[] | null | undefined): number {
  return (conceptos || []).reduce((acc, c) => acc + (Number(c.monto) || 0), 0)
}
