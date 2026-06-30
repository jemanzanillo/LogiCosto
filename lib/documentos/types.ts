// Modelo de datos compartido del flujo de captura (Revisión 1).
//
// El snapshot `DocumentoData` es la ÚNICA fuente que consumen tanto el preview
// HTML (lib/components/documento-preview.tsx) como el PDF (lib/pdf/documento-pdf.tsx),
// garantizando que lo previsualizado sea idéntico a lo exportado. Se persiste tal
// cual en `document_versions.data` (jsonb).

import type { Database } from '@/lib/types/database.types'

export type DocumentoTipo = Database['public']['Enums']['document_tipo'] // 'vehiculo' | 'contenedor'

export type ConceptoLinea = {
  concepto: string
  monto: number
}

export type Importador = {
  nombre: string
  rnc: string
}

export type DatosVehiculo = {
  marca: string
  modelo: string
  anio: string // string en captura; el PDF lo muestra tal cual
  chasis: string
  color: string // se captura y guarda, pero NO se muestra en el PDF (especificacion_pdf §4)
}

export type DatosContenedor = {
  bl: string
  numero_contenedor: string
}

// Forma del snapshot jsonb, ramificada por tipo. Refleja exactamente lo que
// consume DocumentoPDF (ver docs/Arquitectura §2.5).
export type DocumentoData = {
  tipo: DocumentoTipo
  importador: Importador
  vehiculo?: DatosVehiculo
  contenedor?: DatosContenedor
  vencimiento_parqueo: string | null // ISO 'YYYY-MM-DD'
  conceptos: ConceptoLinea[]
  total: number
}

// Estado del formulario en el cliente. Mantiene ambos bloques de datos para no
// perder lo escrito al alternar el tipo; `armarData()` extrae solo el relevante.
export type FormState = {
  tipo: DocumentoTipo
  importador: Importador
  vehiculo: DatosVehiculo
  contenedor: DatosContenedor
  vencimiento_parqueo: string // '' o ISO 'YYYY-MM-DD'
  conceptos: ConceptoLinea[]
}

// Sugerencias de conceptos (especificacion_pdf.md §4). Texto libre: el usuario
// siempre puede escribir otro.
export const CONCEPTOS_SUGERIDOS = [
  'Impuestos',
  'Servicios Aduaneros',
  'Parqueo',
  'Honorarios',
  'Factura',
  'Registración',
  'Dealer',
]

export function vehiculoVacio(): DatosVehiculo {
  return { marca: '', modelo: '', anio: '', chasis: '', color: '' }
}

export function contenedorVacio(): DatosContenedor {
  return { bl: '', numero_contenedor: '' }
}

export function formStateVacio(): FormState {
  return {
    tipo: 'vehiculo',
    importador: { nombre: '', rnc: '' },
    vehiculo: vehiculoVacio(),
    contenedor: contenedorVacio(),
    vencimiento_parqueo: '',
    conceptos: [],
  }
}

export function calcularTotal(conceptos: ConceptoLinea[]): number {
  return conceptos.reduce((acc, c) => acc + (Number(c.monto) || 0), 0)
}

// Construye el snapshot que se guarda/renderiza a partir del estado del formulario.
export function armarData(form: FormState): DocumentoData {
  const conceptos = form.conceptos.map((c) => ({
    concepto: c.concepto.trim(),
    monto: Number(c.monto) || 0,
  }))
  return {
    tipo: form.tipo,
    importador: {
      nombre: form.importador.nombre.trim(),
      rnc: form.importador.rnc.trim(),
    },
    ...(form.tipo === 'vehiculo'
      ? { vehiculo: { ...form.vehiculo } }
      : { contenedor: { ...form.contenedor } }),
    vencimiento_parqueo: form.vencimiento_parqueo || null,
    conceptos,
    total: calcularTotal(conceptos),
  }
}

// Reconstruye el estado del formulario a partir de un snapshot guardado
// (para reabrir un documento existente en la página de edición).
export function formStateDesdeData(data: DocumentoData): FormState {
  return {
    tipo: data.tipo,
    importador: { nombre: data.importador?.nombre ?? '', rnc: data.importador?.rnc ?? '' },
    vehiculo: data.vehiculo ? { ...vehiculoVacio(), ...data.vehiculo } : vehiculoVacio(),
    contenedor: data.contenedor ? { ...contenedorVacio(), ...data.contenedor } : contenedorVacio(),
    vencimiento_parqueo: data.vencimiento_parqueo ?? '',
    conceptos:
      data.conceptos && data.conceptos.length > 0
        ? data.conceptos.map((c) => ({ concepto: c.concepto, monto: c.monto }))
        : [{ concepto: '', monto: 0 }],
  }
}

// Nomenclatura del PDF exportado.
// Patrón: LM-Aduanas_{Importador}_{Chasis|BL}[_v2].pdf
// - "LM-Aduanas" (el gestor) va al inicio para que el importador lo identifique.
// - Vehículo usa el chasis; contenedor usa el BL (identificadores legales únicos).
// - La versión solo aparece a partir de la v2.
export function nombreArchivoPdf(opts: {
  data: DocumentoData
  versionNumber: number
}): string {
  const { data, versionNumber } = opts

  // Normaliza un token para que sea seguro como nombre de archivo: quita acentos,
  // colapsa espacios en guiones y elimina caracteres no alfanuméricos.
  const limpia = (s: string | undefined) =>
    (s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const importador = limpia(data.importador?.nombre) || 'SinImportador'
  const identificador =
    data.tipo === 'vehiculo'
      ? limpia(data.vehiculo?.chasis) || 'SinChasis'
      : limpia(data.contenedor?.bl) || 'SinBL'

  const partes = ['LM-Aduanas', importador, identificador]
  if (versionNumber > 1) partes.push(`v${versionNumber}`)

  return partes.join('_') + '.pdf'
}

export type ErroresValidacion = Record<string, string>

// Validación compartida (cliente y servidor). Devuelve un mapa campo→mensaje;
// vacío significa válido.
export function validar(form: FormState): ErroresValidacion {
  const errores: ErroresValidacion = {}

  if (!form.importador.nombre.trim()) errores['importador.nombre'] = 'Nombre del importador obligatorio.'
  if (!form.importador.rnc.trim()) errores['importador.rnc'] = 'RNC obligatorio.'
  if (!form.vencimiento_parqueo) errores['vencimiento_parqueo'] = 'Fecha de vencimiento obligatoria.'

  if (form.tipo === 'vehiculo') {
    if (!form.vehiculo.marca.trim()) errores['vehiculo.marca'] = 'Marca obligatoria.'
    if (!form.vehiculo.modelo.trim()) errores['vehiculo.modelo'] = 'Modelo obligatorio.'
    if (!form.vehiculo.anio.trim()) errores['vehiculo.anio'] = 'Año obligatorio.'
    if (!form.vehiculo.chasis.trim()) errores['vehiculo.chasis'] = 'Chasis obligatorio.'
  } else {
    if (!form.contenedor.bl.trim()) errores['contenedor.bl'] = 'Número de BL obligatorio.'
    if (!form.contenedor.numero_contenedor.trim())
      errores['contenedor.numero_contenedor'] = 'Número de contenedor obligatorio.'
  }

  if (form.conceptos.length === 0) {
    errores['conceptos'] = 'Agrega al menos un concepto.'
  }

  return errores
}
