// Parser de facturas históricas en Word (.docx) para la migración de históricos
// (Rev 2, bloque 4). Extrae SOLO los datos de la factura vieja hacia el modelo
// compartido `FormState`; el diseño se descarta a propósito (al re-renderizarse
// adoptan la plantilla vigente). El resultado NO se guarda aquí: alimenta la
// pantalla de revisión donde un humano confirma/corrige antes de importar.
//
// La extracción es best-effort. Los datos "duros" (importador, RNC, chasis,
// vencimiento, conceptos, montos, total) salen limpios de las celdas de la tabla;
// la línea libre del vehículo (marca/modelo/año/color) se infiere con heurística
// y SIEMPRE se marca para revisión.

import mammoth from 'mammoth'
import {
  formStateVacio,
  calcularTotal,
  type FormState,
} from './types'

export type ResultadoImportacion = {
  form: FormState
  advertencias: string[]
}

// --- Utilidades de HTML → texto -------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

// Divide el contenido de una celda en líneas, respetando los saltos de párrafo
// (<p>) y de línea (<br>) que Word genera dentro de una misma celda.
function cellLines(cellHtml: string): string[] {
  return cellHtml
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((l) => stripTags(l))
    .filter((l) => l.length > 0)
}

// Todas las líneas de texto del documento, en orden (para leer el encabezado).
function documentLines(html: string): string[] {
  return html
    .replace(/<\/(p|tr|td|th|div|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((l) => stripTags(l))
    .filter((l) => l.length > 0)
}

// Global para extraer todos los montos con .match(); no-global para .test()
// (un regex global es stateful en .test() y daría resultados intermitentes).
const RE_MONTO = /[0-9][0-9,]*\.[0-9]{2}/g
const RE_TIENE_MONTO = /[0-9][0-9,]*\.[0-9]{2}/

function aNumero(token: string): number {
  return Number(token.replace(/,/g, '')) || 0
}

// DD/MM/YYYY → ISO 'YYYY-MM-DD'. Devuelve null si no matchea.
function fechaISO(dmy: string | undefined | null): string | null {
  if (!dmy) return null
  const m = dmy.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// --- Parser principal ------------------------------------------------------

export async function parsearFacturaWord(
  buffer: Buffer,
): Promise<ResultadoImportacion> {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const advertencias: string[] = []
  const form = formStateVacio()

  const lineas = documentLines(html)
  const textoPlano = lineas.join('\n')

  // --- Tipo de documento ---------------------------------------------------
  const esVehiculo = /VEH[IÍ]CULO|CHASIS/i.test(textoPlano)
  const esContenedor = /CONTENEDOR|\bB\/?L\b/i.test(textoPlano) && !esVehiculo
  form.tipo = esContenedor ? 'contenedor' : 'vehiculo'
  if (!esVehiculo && !esContenedor) {
    advertencias.push('No se pudo determinar el tipo (vehículo/contenedor); se asumió vehículo. Verifícalo.')
  }

  // --- Importador ----------------------------------------------------------
  const idxImp = lineas.findIndex((l) => /^IMPORTADOR/i.test(l))
  if (idxImp >= 0) {
    const nombre = lineas
      .slice(idxImp + 1)
      .find((l) => !/^\[?\s*RNC/i.test(l) && !/^VEH[IÍ]CULO|^CONTENEDOR/i.test(l))
    if (nombre) form.importador.nombre = nombre
  }
  if (!form.importador.nombre) advertencias.push('No se detectó el nombre del importador.')

  const rncMatch = textoPlano.match(/\[?\s*RNC\s*\]?\s*:?\s*([0-9][0-9-]{7,})/i)
  if (rncMatch) form.importador.rnc = rncMatch[1].replace(/[^0-9]/g, '')
  else advertencias.push('No se detectó el RNC del importador.')

  // --- Vencimiento de parqueo ---------------------------------------------
  const vencMatch = textoPlano.match(/VENCIMIENTO[^0-9]*(\d{1,2}\/\d{1,2}\/\d{4})/i)
  const vencISO = fechaISO(vencMatch?.[1])
  if (vencISO) form.vencimiento_parqueo = vencISO
  else advertencias.push('No se detectó la fecha de vencimiento de parqueo.')

  // --- Datos del vehículo / contenedor ------------------------------------
  if (form.tipo === 'vehiculo') {
    const idxVeh = lineas.findIndex((l) => /^VEH[IÍ]CULO/i.test(l))
    // La descripción del vehículo puede estar en la misma línea del rótulo o en
    // la siguiente. Tomamos la línea con más contenido de las dos candidatas.
    let desc = ''
    if (idxVeh >= 0) {
      const enLinea = lineas[idxVeh].replace(/^VEH[IÍ]CULO\s*:?/i, '').trim()
      const siguiente = lineas[idxVeh + 1] ?? ''
      desc = enLinea.length >= siguiente.length ? enLinea : siguiente
      if (!enLinea && !/CHASIS/i.test(siguiente)) desc = siguiente
    }
    if (!desc) {
      // Fallback: la línea que contenga CHASIS.
      desc = lineas.find((l) => /CHASIS/i.test(l)) ?? ''
    }

    const chasisMatch = desc.match(/CHASIS\s*:?\s*([A-Z0-9]+)/i)
    if (chasisMatch) form.vehiculo.chasis = chasisMatch[1].toUpperCase()
    else advertencias.push('No se detectó el chasis del vehículo.')

    // Resto de la descripción (sin el bloque del chasis) para inferir el vehículo.
    const resto = desc.replace(/CHASIS\s*:?\s*[A-Z0-9]+/i, '').trim()
    const anioMatch = resto.match(/\b(19|20)\d{2}\b/)
    if (anioMatch) form.vehiculo.anio = anioMatch[0]

    const tokens = resto.split(/\s+/).filter(Boolean)
    if (tokens.length > 0) form.vehiculo.marca = tokens[0]
    if (anioMatch) {
      const antes = resto.slice(0, anioMatch.index).trim().split(/\s+/).filter(Boolean)
      const despues = resto.slice((anioMatch.index ?? 0) + anioMatch[0].length).trim().split(/\s+/).filter(Boolean)
      form.vehiculo.marca = antes[0] ?? form.vehiculo.marca
      form.vehiculo.modelo = antes.slice(1).join(' ')
      form.vehiculo.color = despues[0] ?? ''
    } else {
      form.vehiculo.modelo = tokens.slice(1).join(' ')
    }
    advertencias.push('Revisa marca, modelo, año y color del vehículo: se infieren del texto libre y pueden requerir corrección.')
  } else {
    const blMatch = textoPlano.match(/\bB\/?L\b\s*:?\s*([A-Z0-9-]+)/i)
    if (blMatch) form.contenedor.bl = blMatch[1].toUpperCase()
    const contMatch = textoPlano.match(/CONTENEDOR\s*#?\s*:?\s*([A-Z0-9-]+)/i)
    if (contMatch) form.contenedor.numero_contenedor = contMatch[1].toUpperCase()
    advertencias.push('Documento de contenedor: revisa BL y número de contenedor con cuidado.')
  }

  // --- Conceptos y montos --------------------------------------------------
  const filas = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []
  const idxHeader = filas.findIndex(
    (f) => /DESCRIPTION|DESCRIPCI[OÓ]N/i.test(f) && /AMOUNT|MONTO|IMPORTE/i.test(f),
  )
  const filaDatos = idxHeader >= 0 ? filas[idxHeader + 1] : undefined

  let conceptos: string[] = []
  let montos: number[] = []

  if (filaDatos) {
    const celdas = filaDatos.match(/<td[\s\S]*?<\/td>/gi) ?? []
    // Celda de descripción: la que tiene más líneas de texto no numérico.
    let celdaDesc = ''
    let celdaMonto = ''
    let maxTexto = -1
    let maxMontos = -1
    for (const celda of celdas) {
      const lineasCelda = cellLines(celda)
      const noNum = lineasCelda.filter((l) => !RE_TIENE_MONTO.test(l)).length
      const numMontos = (stripTags(celda).match(RE_MONTO) ?? []).length
      if (noNum > maxTexto) {
        maxTexto = noNum
        celdaDesc = celda
      }
      if (numMontos > maxMontos) {
        maxMontos = numMontos
        celdaMonto = celda
      }
    }
    conceptos = cellLines(celdaDesc).filter((l) => !RE_TIENE_MONTO.test(l))
    montos = (stripTags(celdaMonto).match(RE_MONTO) ?? []).map(aNumero)
  }

  if (conceptos.length === 0) {
    advertencias.push('No se detectaron conceptos en la tabla; agrégalos manualmente.')
    form.conceptos = [{ concepto: '', monto: 0 }]
  } else {
    if (montos.length !== conceptos.length) {
      advertencias.push(
        `Se detectaron ${conceptos.length} conceptos y ${montos.length} montos: revisa que cada monto quede en su concepto.`,
      )
    }
    form.conceptos = conceptos.map((concepto, i) => ({
      concepto,
      monto: montos[i] ?? 0,
    }))
  }

  // --- Validación del total (solo advertencia; el total real se recalcula) --
  const totalMatch = textoPlano.match(/TOTAL[^0-9]*([0-9][0-9,]*\.[0-9]{2})/i)
  if (totalMatch) {
    const totalDoc = aNumero(totalMatch[1])
    const suma = calcularTotal(form.conceptos)
    if (Math.abs(totalDoc - suma) > 0.01) {
      advertencias.push(
        `El total del documento (${totalDoc.toLocaleString('es-DO')}) no coincide con la suma de los conceptos (${suma.toLocaleString('es-DO')}).`,
      )
    }
  }

  return { form, advertencias }
}
