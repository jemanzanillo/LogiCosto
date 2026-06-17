/**
 * Ejemplo de exportación a PDF con Puppeteer (modo "PDF de servidor").
 *
 * Requisitos:
 *   npm i puppeteer            # trae su propio Chromium, o
 *   npm i puppeteer-core       # + apuntar executablePath a un Chrome/Edge instalado
 *
 * Uso:
 *   node examples/exportar-pdf-puppeteer.mjs
 */
import puppeteer from 'puppeteer';
import { writeFile } from 'node:fs/promises';
import { construirPdfPuppeteer } from '../src/documento-gastos.js';

const datos = {
  emision: '26/05/2026',
  // logoUrl: 'https://.../logo.png',   // cuando la gestora suba su logo
  empresa: { nombre: 'Gestora' },
  importador: { nombre: 'JUNIOR A & S AUTO SRL', rnc: '132656776' },
  vehiculo: {
    descripcion: 'TOYOTA HIGHLANDER SERIE HYBRID LIMITED BLANCA 2500CC AWD 2022 5TDXBRCH0NS557624',
  },
  vencimiento: '19/5/2026',
  gastos: [
    { concepto: 'Impuestos',          monto: 188771.25 },
    { concepto: 'Servicios Aduanales', monto: 10000 },
    { concepto: 'Parqueo',            monto: 13260 },
    { concepto: 'Honorarios',         monto: 10000 },
    { concepto: 'Factura',            monto: 500 },
    { concepto: 'Registración',       monto: 1000 },
    { concepto: 'Dealer',             monto: 20500 },
    { concepto: 'Otros Gastos',       monto: 70000 },
  ],
  nota: 'NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER ANTES DE REALIZAR EL PAGO YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS FUTUROS',
};

const { html, pdfOptions } = construirPdfPuppeteer(datos);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
const pdf = await page.pdf(pdfOptions);   // Buffer
await browser.close();

await writeFile('hoja-de-gastos.pdf', pdf);
console.log('PDF generado: hoja-de-gastos.pdf');
