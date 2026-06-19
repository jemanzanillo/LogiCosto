// formato.js
// Helpers de formato según especificacion_pdf.md sección 5.

export function formatoMoneda(monto) {
  const n = Number(monto) || 0;
  const partes = n.toFixed(2).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `RD$${partes[0]}.${partes[1]}`;
}

export function formatoFecha(fechaISO) {
  // fechaISO: 'YYYY-MM-DD' -> 'DD/MM/AAAA'
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

export function formatoConcepto(texto) {
  return (texto || '').toUpperCase();
}

export function calcularTotal(conceptos) {
  return (conceptos || []).reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
}
