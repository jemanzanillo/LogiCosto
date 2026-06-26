// Constantes de marca y medidas — diseño "Marfil" APROBADO por LM Aduanas.
// Fuente de verdad visual: docs/especificacion_pdf.md (v3).
// Portado desde docs/constantes.js. Cualquier cambio aquí debe reflejarse en ese doc.
// Las usa tanto el PDF (lib/pdf/documento-pdf.tsx) como el preview HTML.

export const COLORES = {
  // Marca (champagne + carbón)
  brandInk: '#2C2A26', // carbón — texto de marca, cabeceras de tarjeta
  brandAccent: '#C9A24B', // champagne dorado — acentos, filete, bordes
  brandTint: '#F4ECDA', // champagne claro — tintes sutiles

  // Lienzo
  canvas: '#FCFAF6',
  ink: '#2A2620', // texto normal
  muted: '#9A9180', // texto secundario / labels
  line: '#ECE5D6', // bordes finos

  // Vencimiento — banner amarillo/rojo (elemento crítico #1)
  dueBg: '#FFE066',
  dueBorder: '#C0102E',
  dueText: '#C0102E',

  // Nota legal — recuadro de advertencia (elemento crítico #2)
  noteBg: '#FBF1DB',
  noteBorder: '#2C2A26',
  noteInk: '#241F16',
  warnFill: '#C0102E',
  warnStroke: '#FFE066',

  // Total y cabecera de tabla — blanco con texto negro (aprobado v3)
  totalBg: '#FFFFFF',
  totalInk: '#000000',
  tableHeaderBg: '#FFFFFF',
  tableHeaderInk: '#000000',

  white: '#FFFFFF',
} as const

export const TIPOGRAFIA = {
  // 'Helvetica' es una de las 14 fuentes estándar de @react-pdf/renderer — no
  // requiere Font.register() y es la opción más segura para producción.
  familiaBase: 'Helvetica',
  tamanos: {
    meta: 9,
    label: 9.5,
    body: 10.5,
    importadorValor: 11,
    dataValor: 10.5,
    dueLabel: 11,
    dueValor: 22,
    tablaHeader: 11.5,
    tablaCelda: 10.5,
    totalLabel: 11.5,
    totalValor: 13,
    nota: 10,
  },
} as const

export const MEDIDAS = {
  pagina: { paddingTop: 38, paddingBottom: 32, paddingHorizontal: 42 },
  logoAltura: 46,
  radioBorde: 6,
  radioBordeDue: 8,
  iconoAdvertencia: 26, // pt — escalado desde los 34px de la maqueta HTML
} as const

// Texto legal — EXACTO, confirmado por el cliente. No modificar sin confirmación
// explícita (ver docs/especificacion_pdf.md §2.7).
export const TEXTO_NOTA_LEGAL =
  'NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER ANTES DE REALIZAR EL PAGO ' +
  'YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS FUTUROS'

export const ETIQUETA_VENCIMIENTO = 'FECHA DE VENCIMIENTO DE PARQUEO'

export const MARCA_GESTORIA = {
  nombre: 'LM Aduanas',
  tag: 'Gestoría de importación & exportación vehicular',
} as const
