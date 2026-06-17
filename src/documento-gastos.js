/**
 * LogiCosto — Documento de Gastos
 * ================================
 *
 * Componente ÚNICO que pinta el documento de gastos del importador, idéntico
 * al Excel de referencia. Recibe un objeto de datos y devuelve HTML limpio e
 * imprimible. Un solo componente para los tres consumidores confirmados:
 *
 *   1. Preview del agente (Francisca) dentro de la web app.
 *   2. Vista externa del importador (enlace público, mobile-first).
 *   3. Exportación a PDF — sirve igual para "PDF de servidor" (Puppeteer /
 *      wkhtmltopdf reciben el HTML completo) o "guardar como PDF" del navegador
 *      (window.print sobre el fragmento).
 *
 * Framework-agnostic a propósito: no depende de React ni de ningún runtime.
 * Es JS puro que produce strings de HTML con CSS de impresión embebido.
 *
 * API pública:
 *   - renderDocumentoGastos(datos)        -> string  (fragmento auto-estilado, para incrustar)
 *   - renderDocumentoHTML(datos, opciones) -> string  (página HTML completa, para PDF de servidor)
 *   - formatearMoneda(n)                  -> string  ($#,##0.00)
 *   - calcularTotal(gastos)               -> number
 *
 * Forma del objeto `datos` (todos los campos de texto son opcionales y se
 * escapan; los faltantes quedan vacíos):
 *
 *   {
 *     emision:       "26/05/2026",          // fecha de EMISIÓN (no la de vencimiento)
 *     pagina:        1,                      // "Pag. X of Y"
 *     totalPaginas:  1,
 *     importador:    { nombre: "JUNIOR A & S AUTO SRL", rnc: "132656776" },
 *     vehiculo:      { descripcion: "TOYOTA HIGHLANDER ... 5TDXBRCH0NS557624" },
 *                    // alternativa estructurada: { marca, modelo, serie, color,
 *                    //   cilindrada, traccion, anio, chasis }
 *     vencimiento:   "19/5/2026",            // fecha de vencimiento de parqueo (resaltada)
 *     gastos:        [ { concepto: "IMPUESTOS", monto: 188771.25 }, ... ],
 *     // total: se calcula automáticamente como la suma de los montos.
 *     nota:          "NOTA: FAVOR DE REVISAR...",
 *     filasMinimas:  0,                      // (opcional) rellena con filas "-" hasta este mínimo
 *     etiquetas:     { ... }                 // (opcional) sobreescribe textos fijos (ver ETIQUETAS)
 *   }
 */

const ETIQUETAS = {
  textoFecha: 'Date:',
  textoPagina: 'Pag.',          // "Pag. 1 of 1"
  textoDe: 'of',
  etiquetaImportador: 'IMPORTADOR',
  etiquetaVehiculo: 'VEHICULO',
  etiquetaVencimiento: 'Fecha de Vencimiento',
  textoRNC: '[RNC]',
  encabezadoConcepto: 'DESCRIPTION',
  encabezadoMonto: 'AMOUNT',
  etiquetaTotal: 'TOTAL RD$',
};

// --- Utilidades -------------------------------------------------------------

/** Escapa texto para insertarlo de forma segura en HTML (datos del usuario). */
function escapeHtml(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formatea un número como moneda con el patrón $#,##0.00 (ej. $188,771.25). */
export function formatearMoneda(n) {
  const num = Number(n);
  const seguro = Number.isFinite(num) ? num : 0;
  return '$' + seguro.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Suma los montos de la lista de gastos. El total nunca es un valor fijo. */
export function calcularTotal(gastos) {
  if (!Array.isArray(gastos)) return 0;
  return gastos.reduce((acc, g) => {
    const m = Number(g && g.monto);
    return acc + (Number.isFinite(m) ? m : 0);
  }, 0);
}

/** Arma la descripción del vehículo desde un string o desde campos sueltos. */
function describirVehiculo(vehiculo) {
  if (!vehiculo) return '';
  if (typeof vehiculo === 'string') return vehiculo;
  if (vehiculo.descripcion) return vehiculo.descripcion;
  return [
    vehiculo.marca,
    vehiculo.modelo,
    vehiculo.serie,
    vehiculo.color,
    vehiculo.cilindrada,
    vehiculo.traccion,
    vehiculo.anio,
    vehiculo.chasis,
  ].filter(Boolean).join(' ');
}

// --- Estilos ----------------------------------------------------------------
// Todo va bajo el scope `.lc-doc` para no contaminar la app que lo incruste.

const ESTILOS = `
.lc-doc *{box-sizing:border-box;}
.lc-doc{
  --lc-azul-osc:#1F4E78;   /* header de tabla   */
  --lc-azul-clr:#D9E1F2;   /* barra de sección  */
  --lc-rojo:#C00000;       /* vencimiento       */
  --lc-rosa:#FFC7CE;       /* total             */
  --lc-amarillo:#FFFF00;   /* nota legal        */
  color:#000;
  font-family:Calibri,"Segoe UI",Arial,sans-serif;
  font-size:10pt;
  line-height:1.25;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
.lc-doc__hoja{
  width:21.59cm;            /* Carta / Letter: 8.5in de ancho */
  margin:0 auto;
  padding:1.2cm 1.2cm 1cm;
  background:#fff;
  box-shadow:0 1px 8px rgba(0,0,0,.18);
}
.lc-meta{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:14px;
}
/* Logo de la gestora, arriba a la izquierda. Espacio SIEMPRE reservado para
   cuando la empresa suba su logo a la plataforma. */
.lc-meta__logo{flex:0 0 auto;}
.lc-logo{max-height:64px;max-width:240px;display:block;}
.lc-logo-slot{width:240px;height:64px;}
.lc-meta__info{text-align:right;font-size:10pt;line-height:1.6;}
/* El placeholder "LOGO" es SOLO una guía en pantalla (preview del agente).
   En el PDF exportado el espacio queda reservado pero vacío, sin texto. */
@media screen{
  .lc-logo-slot--vacio{
    border:1px dashed #c8c8c8;display:flex;align-items:center;
    justify-content:center;color:#c8c8c8;font-size:11px;letter-spacing:1px;
  }
  .lc-logo-slot--vacio::before{content:"LOGO";}
}
.lc-tabla{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
}
.lc-tabla td{
  border:1px solid #000;
  padding:4px 6px;
  vertical-align:middle;
  word-wrap:break-word;
  overflow-wrap:break-word;
}
.lc-barra td{
  background:var(--lc-azul-clr);
  height:16px;
  padding:0;
}
.lc-label{font-weight:bold;white-space:nowrap;}
.lc-venc-label,
.lc-venc-fecha{
  color:var(--lc-rojo);
  font-weight:bold;
  text-align:center;
}
.lc-venc-fecha{font-size:12pt;}
.lc-thead td{
  background:var(--lc-azul-osc);
  color:#fff;
  font-weight:bold;
  font-size:10pt;
}
.lc-thead .lc-concepto{text-align:center;}
.lc-concepto{text-align:left;}
.lc-monto{text-align:right;white-space:nowrap;}
.lc-tabla--gastos{margin-top:10px;}
.lc-total td{
  background:var(--lc-rosa);
  font-weight:bold;
  font-size:11pt;
}
.lc-total .lc-total-label{text-align:right;}
.lc-nota{
  margin-top:10px;
  border:1px solid #000;
  background:var(--lc-amarillo);
  font-style:italic;
  font-size:9pt;
  text-align:left;
  padding:4px 6px;
}

/* Pantalla: la vista del importador es mobile-first, que la hoja entre en el teléfono. */
@media screen and (max-width:820px){
  .lc-doc__hoja{width:100%;padding:14px 12px;box-shadow:none;}
  .lc-doc{font-size:11px;}
  .lc-venc-fecha{font-size:13px;}
  .lc-thead td{font-size:11px;}
  .lc-total td{font-size:12px;}
}

/* Impresión / PDF: hoja limpia + paginación robusta para listas dinámicas. */
@media print{
  .lc-doc__hoja{width:auto;margin:0;padding:0;box-shadow:none;}
  /* Que ninguna fila, el total ni la nota se partan entre páginas. */
  .lc-tabla tr,
  .lc-nota{break-inside:avoid;page-break-inside:avoid;}
  /* El total no debe quedar huérfano arriba de una página solo. */
  .lc-total{break-before:avoid;page-break-before:avoid;}
}
/* El encabezado CONCEPTO/MONTO se repite en cada página al desbordar. */
.lc-tabla--gastos thead{display:table-header-group;}
@page{size:letter portrait;margin:12mm;}
`;

// --- Render -----------------------------------------------------------------

/**
 * Devuelve el fragmento HTML auto-estilado del documento (incluye su <style>).
 * Es lo que se incrusta en el preview del agente o en la vista del importador.
 */
export function renderDocumentoGastos(datos = {}) {
  const E = { ...ETIQUETAS, ...(datos.etiquetas || {}) };

  const emision = escapeHtml(datos.emision || '');

  // Logo de la gestora (top-left). datos.logoUrl o datos.empresa.logoUrl.
  // Si aún no hay logo, se reserva el espacio igual (placeholder en pantalla).
  const empresa = datos.empresa || {};
  const logoUrl = datos.logoUrl || empresa.logoUrl || '';
  const empresaNombre = empresa.nombre || datos.empresaNombre || '';
  const logoSlot = logoUrl
    ? `<img class="lc-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(empresaNombre || 'Logo')}">`
    : `<div class="lc-logo-slot lc-logo-slot--vacio"></div>`;

  // Paginación: por defecto la maneja Puppeteer en el margen (conteo real).
  // En navegador/preview se puede mostrar un contador estático opcional.
  const mostrarPaginaEstatica = datos.mostrarPaginaEstatica === true;
  const pagina = datos.pagina != null ? datos.pagina : 1;
  const totalPaginas = datos.totalPaginas != null ? datos.totalPaginas : 1;
  const lineaPagina = mostrarPaginaEstatica
    ? `<div>${escapeHtml(E.textoPagina)} ${escapeHtml(pagina)} ${escapeHtml(E.textoDe)} ${escapeHtml(totalPaginas)}</div>`
    : '';

  const importador = datos.importador || {};
  const nombreImp = escapeHtml(importador.nombre || '');
  const rnc = importador.rnc ? `${escapeHtml(E.textoRNC)} ${escapeHtml(importador.rnc)}` : '';
  const lineaImportador = [nombreImp, rnc].filter(Boolean).join(' ');

  const vehiculo = escapeHtml(describirVehiculo(datos.vehiculo));
  const vencimiento = escapeHtml(datos.vencimiento || '');

  const gastos = Array.isArray(datos.gastos) ? datos.gastos : [];
  const total = calcularTotal(gastos);

  // Filas de gastos (concepto SIEMPRE en MAYÚSCULAS, monto formateado).
  let filas = gastos.map((g) => {
    const concepto = escapeHtml(String(g && g.concepto != null ? g.concepto : '').toUpperCase());
    const monto = formatearMoneda(g && g.monto);
    return `      <tr>
        <td class="lc-concepto" colspan="3">${concepto}</td>
        <td class="lc-monto">${monto}</td>
      </tr>`;
  });

  // Relleno opcional con filas "-" para reproducir el padding del Excel.
  const minimas = Number(datos.filasMinimas) || 0;
  for (let i = gastos.length; i < minimas; i++) {
    filas.push(`      <tr>
        <td class="lc-concepto" colspan="3">-</td>
        <td class="lc-monto"></td>
      </tr>`);
  }

  const nota = escapeHtml(datos.nota || '');
  const bloqueNota = nota ? `    <div class="lc-nota">${nota}</div>` : '';

  const colgroup = `      <colgroup>
        <col style="width:13%"><col style="width:44%"><col style="width:22%"><col style="width:21%">
      </colgroup>`;

  return `<style>${ESTILOS}</style>
<div class="lc-doc">
  <div class="lc-doc__hoja">
    <div class="lc-meta">
      <div class="lc-meta__logo">${logoSlot}</div>
      <div class="lc-meta__info">
        ${lineaPagina}
        <div>${escapeHtml(E.textoFecha)} ${emision}</div>
      </div>
    </div>

    <table class="lc-tabla lc-tabla--info">
${colgroup}
      <tbody>
        <tr class="lc-barra"><td colspan="4"></td></tr>

        <tr>
          <td class="lc-label">${escapeHtml(E.etiquetaImportador)}</td>
          <td>${lineaImportador}</td>
          <td colspan="2"></td>
        </tr>

        <tr>
          <td class="lc-label">${escapeHtml(E.etiquetaVehiculo)}</td>
          <td>${vehiculo}</td>
          <td class="lc-venc-label">${escapeHtml(E.etiquetaVencimiento)}</td>
          <td class="lc-venc-fecha">${vencimiento}</td>
        </tr>
      </tbody>
    </table>

    <table class="lc-tabla lc-tabla--gastos">
${colgroup}
      <thead>
        <tr class="lc-thead">
          <td class="lc-concepto" colspan="3">${escapeHtml(E.encabezadoConcepto)}</td>
          <td class="lc-monto">${escapeHtml(E.encabezadoMonto)}</td>
        </tr>
      </thead>
      <tbody>
${filas.join('\n')}
        <tr class="lc-total">
          <td class="lc-total-label" colspan="3">${escapeHtml(E.etiquetaTotal)}</td>
          <td class="lc-monto">${formatearMoneda(total)}</td>
        </tr>
      </tbody>
    </table>

${bloqueNota}
  </div>
</div>`;
}

/**
 * Envuelve el fragmento en una página HTML completa (<!doctype html> ...).
 * Úsalo para PDF de servidor (Puppeteer/wkhtmltopdf reciben este string) o
 * para abrir una pestaña independiente e imprimir con el navegador.
 */
export function renderDocumentoHTML(datos = {}, opciones = {}) {
  const titulo = escapeHtml(opciones.titulo || 'LogiCosto — Hoja de Gastos');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
</head>
<body style="margin:0;background:#f3f3f3;">
${renderDocumentoGastos(datos)}
</body>
</html>`;
}

/**
 * Prepara el documento para exportación con Puppeteer.
 *
 * Devuelve `{ html, pdfOptions }`:
 *   - `html`: la página completa (sin paginación estática en el cuerpo).
 *   - `pdfOptions`: opciones listas para `page.pdf(pdfOptions)`. El contador
 *     "Pag. X of Y" va en el header del margen con el conteo REAL de páginas
 *     (Puppeteer rellena .pageNumber / .totalPages), así funciona aunque el
 *     documento ocupe varias páginas.
 *
 * Uso típico (Node, requiere `npm i puppeteer`):
 *
 *   import puppeteer from 'puppeteer';
 *   import { construirPdfPuppeteer } from './src/documento-gastos.js';
 *
 *   const { html, pdfOptions } = construirPdfPuppeteer(datos);
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.setContent(html, { waitUntil: 'networkidle0' });
 *   const pdf = await page.pdf(pdfOptions);   // Buffer -> guardar / enviar
 *   await browser.close();
 */
export function construirPdfPuppeteer(datos = {}, opciones = {}) {
  const E = { ...ETIQUETAS, ...(datos.etiquetas || {}) };
  // El cuerpo NO lleva contador estático: lo pone el header del margen.
  const html = renderDocumentoHTML({ ...datos, mostrarPaginaEstatica: false }, opciones);

  const fuente = 'Calibri, "Segoe UI", Arial, sans-serif';
  const textoPag = escapeHtml(E.textoPagina);
  const textoDe = escapeHtml(E.textoDe);

  // Header del margen: "Pag. <n> of <total>" alineado a la derecha.
  const headerTemplate =
    `<div style="width:100%;font-size:10px;font-family:${fuente};color:#000;` +
    `padding:0 12mm;text-align:right;">` +
    `${textoPag} <span class="pageNumber"></span> ${textoDe} <span class="totalPages"></span>` +
    `</div>`;

  const pdfOptions = {
    format: 'Letter',                 // tamaño Carta (8.5 x 11 in)
    printBackground: true,            // imprime los fondos de color (azul/rosa/rojo/amarillo)
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate: '<div></div>',    // sin footer
    margin: { top: '18mm', right: '12mm', bottom: '12mm', left: '12mm' },
    preferCSSPageSize: false,         // usa format + margin de aquí, no el @page del CSS
    ...(opciones.pdfOptions || {}),   // permite sobreescribir cualquier opción
  };

  return { html, pdfOptions };
}

export default renderDocumentoGastos;
