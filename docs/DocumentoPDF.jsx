// DocumentoPDF.jsx
//
// Componente principal de render del PDF de gastos — diseño "Marfil"
// APROBADO por LM Aduanas. Ramificado por `data.tipo` ('vehiculo' |
// 'contenedor'). Recibe el snapshot de `document_versions.data` (ver
// LogiCosto_Arquitectura_Tecnica.md sección 2.5) y el `logoBase64` /
// `versionNumber` del documento.
//
// Uso (en una API route de Next.js):
//
//   import { renderToBuffer } from '@react-pdf/renderer';
//   import DocumentoPDF from './DocumentoPDF';
//
//   const buffer = await renderToBuffer(
//     <DocumentoPDF data={version.data} versionNumber={version.version_number}
//                    logoBase64={LOGO_BASE64} fechaEmision={new Date()} />
//   );
//
// No se almacena el PDF (ver arquitectura sección 6): se genera al vuelo en
// cada exportación/descarga.

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import { COLORES, TIPOGRAFIA, MEDIDAS, TEXTO_NOTA_LEGAL, ETIQUETA_VENCIMIENTO, MARCA_GESTORIA } from './constantes';
import { formatoMoneda, formatoFecha, formatoConcepto, calcularTotal } from './formato';

const styles = StyleSheet.create({
  page: {
    ...MEDIDAS.pagina,
    fontFamily: TIPOGRAFIA.familiaBase,
    fontSize: TIPOGRAFIA.tamanos.body,
    color: COLORES.ink,
    backgroundColor: COLORES.canvas,
  },

  // ---- Encabezado ----
  hd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandlock: { flexDirection: 'row', alignItems: 'center' },
  logo: { height: MEDIDAS.logoAltura, marginRight: 12 },
  brandTextWrap: {
    borderLeftWidth: 1,
    borderLeftColor: COLORES.line,
    paddingLeft: 10,
    maxWidth: 150,
  },
  brandNombre: { fontSize: 11, fontWeight: 700, color: COLORES.brandInk },
  brandTag: {
    fontSize: 7.5,
    color: COLORES.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
    lineHeight: 1.4,
  },
  metaWrap: { alignItems: 'flex-end' },
  metaPag: { fontSize: TIPOGRAFIA.tamanos.meta, fontWeight: 700, color: COLORES.muted, textTransform: 'uppercase' },
  metaFecha: { fontSize: TIPOGRAFIA.tamanos.meta, color: COLORES.ink, fontWeight: 600, marginTop: 3 },

  rule: { height: 1, backgroundColor: COLORES.line, marginTop: 14, marginBottom: 2 },
  ruleAccent: { height: 2, width: 46, backgroundColor: COLORES.brandAccent, marginTop: 2 },

  // ---- Importador / RNC (blanco, v3) ----
  imp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORES.line,
    borderRadius: MEDIDAS.radioBorde,
    backgroundColor: COLORES.white,
  },
  impL: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 8, paddingHorizontal: 10, flexGrow: 1 },
  impR: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: COLORES.line,
  },
  impLabel: {
    fontSize: TIPOGRAFIA.tamanos.label - 1,
    fontWeight: 700,
    color: COLORES.brandAccent,
    textTransform: 'uppercase',
    marginRight: 6,
  },
  impValor: { fontSize: TIPOGRAFIA.tamanos.importadorValor, fontWeight: 600, color: COLORES.ink },
  rncLabel: { fontSize: TIPOGRAFIA.tamanos.label - 1, fontWeight: 700, color: COLORES.brandAccent, marginRight: 5 },
  rncValor: { fontSize: TIPOGRAFIA.tamanos.body, fontWeight: 700, color: COLORES.ink },

  // ---- Bloque de datos por tipo ----
  dataBlock: {
    flexDirection: 'row',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORES.line,
    borderRadius: MEDIDAS.radioBorde,
    overflow: 'hidden',
  },
  dataCell: { paddingVertical: 7, paddingHorizontal: 9, borderRightWidth: 1, borderRightColor: COLORES.line },
  dataCellLast: { borderRightWidth: 0 },
  dataLabel: {
    fontSize: TIPOGRAFIA.tamanos.label - 1.5,
    fontWeight: 700,
    color: COLORES.muted,
    textTransform: 'uppercase',
  },
  dataValor: { fontSize: TIPOGRAFIA.tamanos.dataValor, fontWeight: 600, color: COLORES.ink, marginTop: 2 },

  // ---- Vencimiento — banner amarillo/rojo a lo ancho (v3) ----
  due: {
    marginTop: 12,
    borderRadius: MEDIDAS.radioBordeDue,
    borderWidth: 2,
    borderColor: COLORES.dueBorder,
    backgroundColor: COLORES.dueBg,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dueLabel: {
    fontSize: TIPOGRAFIA.tamanos.dueLabel,
    fontWeight: 800,
    color: COLORES.dueText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  dueValorWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  dueValor: {
    fontSize: TIPOGRAFIA.tamanos.dueValor,
    fontWeight: 800,
    color: COLORES.dueText,
  },

  // ---- Tabla de gastos ----
  tbl: { marginTop: 14, borderWidth: 1, borderColor: COLORES.line, borderRadius: MEDIDAS.radioBorde, overflow: 'hidden' },
  tblHeader: {
    flexDirection: 'row',
    backgroundColor: COLORES.tableHeaderBg,
    borderBottomWidth: 2,
    borderBottomColor: COLORES.brandInk,
  },
  thConcepto: { flex: 1, paddingVertical: 8, paddingHorizontal: 12 },
  thMonto: { width: '34%', paddingVertical: 8, paddingHorizontal: 12 },
  thTexto: {
    fontSize: TIPOGRAFIA.tamanos.tablaHeader,
    fontWeight: 800,
    color: COLORES.tableHeaderInk,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  thTextoRight: { textAlign: 'right' },
  fila: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORES.line },
  filaPrimera: { borderTopWidth: 0 },
  celdaConcepto: { flex: 1, paddingVertical: 6, paddingHorizontal: 12 },
  celdaMonto: { width: '34%', paddingVertical: 6, paddingHorizontal: 12 },
  celdaTextoConcepto: { fontSize: TIPOGRAFIA.tamanos.tablaCelda, fontWeight: 500, color: COLORES.ink },
  celdaTextoMonto: { fontSize: TIPOGRAFIA.tamanos.tablaCelda, fontWeight: 600, color: COLORES.ink, textAlign: 'right' },

  // ---- Total — blanco, texto negro (v3, aprobado) ----
  filaTotal: {
    flexDirection: 'row',
    backgroundColor: COLORES.totalBg,
    borderTopWidth: 2,
    borderTopColor: COLORES.brandInk,
  },
  totalLabel: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: TIPOGRAFIA.tamanos.totalLabel,
    fontWeight: 800,
    color: COLORES.totalInk,
    textAlign: 'right',
  },
  totalValor: {
    width: '34%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: TIPOGRAFIA.tamanos.totalValor,
    fontWeight: 800,
    color: COLORES.totalInk,
    textAlign: 'right',
  },

  // ---- Nota legal ----
  note: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.noteBg,
    borderWidth: 2,
    borderColor: COLORES.noteBorder,
    borderLeftWidth: 5,
    borderRadius: MEDIDAS.radioBordeDue,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  noteIcono: { marginRight: 10 },
  noteTexto: {
    flex: 1,
    fontSize: TIPOGRAFIA.tamanos.nota,
    fontWeight: 700,
    color: COLORES.noteInk,
    lineHeight: 1.4,
  },

  // ---- Pie ----
  foot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footTexto: { fontSize: 7, color: COLORES.muted, letterSpacing: 0.3 },
});

function IconoAdvertencia({ size = MEDIDAS.iconoAdvertencia }) {
  // Triángulo de advertencia: relleno rojo, borde amarillo — ampliado en v3
  // a pedido del cliente ("muy pequeño... más grande, más llamativo").
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 23 21H1L12 2.5Z"
        fill={COLORES.warnFill}
        stroke={COLORES.warnStroke}
        strokeWidth={1.3}
      />
      <Path d="M12 9.3v5.4" stroke={COLORES.warnStroke} strokeWidth={2.3} />
      <Circle cx={12} cy={17.6} r={1.35} fill={COLORES.warnStroke} />
    </Svg>
  );
}

function BloqueVehiculo({ vehiculo }) {
  return (
    <View style={styles.dataBlock}>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Marca</Text>
        <Text style={styles.dataValor}>{vehiculo?.marca || '—'}</Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Modelo</Text>
        <Text style={styles.dataValor}>{vehiculo?.modelo || '—'}</Text>
      </View>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Año</Text>
        <Text style={styles.dataValor}>{vehiculo?.anio || '—'}</Text>
      </View>
      <View style={[styles.dataCell, styles.dataCellLast]}>
        <Text style={styles.dataLabel}>Chasis</Text>
        <Text style={styles.dataValor}>{vehiculo?.chasis || '—'}</Text>
      </View>
    </View>
  );
}

function BloqueContenedor({ contenedor }) {
  return (
    <View style={styles.dataBlock}>
      <View style={styles.dataCell}>
        <Text style={styles.dataLabel}>Número de BL</Text>
        <Text style={styles.dataValor}>{contenedor?.bl || '—'}</Text>
      </View>
      <View style={[styles.dataCell, styles.dataCellLast]}>
        <Text style={styles.dataLabel}>Número de contenedor</Text>
        <Text style={styles.dataValor}>{contenedor?.numero_contenedor || '—'}</Text>
      </View>
    </View>
  );
}

export default function DocumentoPDF({
  data,
  versionNumber = 1,
  logoBase64,           // string base64 (sin prefijo data:) del logo de la org
  fechaEmision = new Date(),
  paginaActual = 1,
  totalPaginas = 1,
}) {
  const conceptos = data?.conceptos || [];
  const total = data?.total ?? calcularTotal(conceptos);
  const esVehiculo = data?.tipo === 'vehiculo';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.hd}>
          <View style={styles.brandlock}>
            {logoBase64 ? (
              <Image style={styles.logo} src={`data:image/png;base64,${logoBase64}`} />
            ) : null}
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandNombre}>{MARCA_GESTORIA.nombre}</Text>
              <Text style={styles.brandTag}>{MARCA_GESTORIA.tag}</Text>
            </View>
          </View>
          <View style={styles.metaWrap}>
            <Text style={styles.metaPag}>Pág. {paginaActual} of {totalPaginas}</Text>
            <Text style={styles.metaFecha}>Date: {formatoFecha(
              typeof fechaEmision === 'string'
                ? fechaEmision
                : fechaEmision.toISOString().slice(0, 10)
            )}</Text>
          </View>
        </View>
        <View style={styles.rule} />
        <View style={styles.ruleAccent} />

        {/* Importador / RNC */}
        <View style={styles.imp}>
          <View style={styles.impL}>
            <Text style={styles.impLabel}>Importador</Text>
            <Text style={styles.impValor}>{data?.importador?.nombre || '—'}</Text>
          </View>
          <View style={styles.impR}>
            <Text style={styles.rncLabel}>[RNC]</Text>
            <Text style={styles.rncValor}>{data?.importador?.rnc || '—'}</Text>
          </View>
        </View>

        {/* Bloque de datos según tipo */}
        {esVehiculo ? (
          <BloqueVehiculo vehiculo={data?.vehiculo} />
        ) : (
          <BloqueContenedor contenedor={data?.contenedor} />
        )}

        {/* Vencimiento — elemento crítico #1 */}
        <View style={styles.due}>
          <Text style={styles.dueLabel}>{ETIQUETA_VENCIMIENTO}</Text>
          <View style={styles.dueValorWrap}>
            <Text style={styles.dueValor}>{formatoFecha(data?.vencimiento_parqueo)}</Text>
          </View>
        </View>

        {/* Tabla de gastos */}
        <View style={styles.tbl}>
          <View style={styles.tblHeader}>
            <View style={styles.thConcepto}><Text style={styles.thTexto}>Concepto</Text></View>
            <View style={styles.thMonto}><Text style={[styles.thTexto, styles.thTextoRight]}>Monto</Text></View>
          </View>
          {conceptos.map((c, i) => (
            <View key={i} style={[styles.fila, i === 0 ? styles.filaPrimera : null]}>
              <View style={styles.celdaConcepto}>
                <Text style={styles.celdaTextoConcepto}>{formatoConcepto(c.concepto)}</Text>
              </View>
              <View style={styles.celdaMonto}>
                <Text style={styles.celdaTextoMonto}>{formatoMoneda(c.monto)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.filaTotal}>
            <Text style={styles.totalLabel}>TOTAL RD$</Text>
            <Text style={styles.totalValor}>{formatoMoneda(total)}</Text>
          </View>
        </View>

        {/* Nota legal — elemento crítico #2 */}
        <View style={styles.note}>
          <View style={styles.noteIcono}>
            <IconoAdvertencia />
          </View>
          <Text style={styles.noteTexto}>{TEXTO_NOTA_LEGAL}</Text>
        </View>

        {/* Pie */}
        <View style={styles.foot}>
          <Text style={styles.footTexto}>LogiCosto · v{versionNumber}</Text>
          <Text style={styles.footTexto}>Documento generado electrónicamente</Text>
        </View>
      </Page>
    </Document>
  );
}
