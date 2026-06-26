'use client'

// Preview HTML del documento — reproduce el layout del PDF "Marfil" v3 usando
// los MISMOS tokens (lib/pdf/constantes.ts) y helpers (lib/pdf/formato.ts) que
// el render real, para que lo previsualizado sea idéntico a lo exportado.

import Image from 'next/image'
import {
  COLORES,
  TIPOGRAFIA,
  MEDIDAS,
  TEXTO_NOTA_LEGAL,
  ETIQUETA_VENCIMIENTO,
  MARCA_GESTORIA,
} from '@/lib/pdf/constantes'
import { formatoMoneda, formatoFecha, formatoConcepto, calcularTotal } from '@/lib/pdf/formato'
import type { DocumentoData } from '@/lib/documentos/types'

const T = TIPOGRAFIA.tamanos

export default function DocumentoPreview({ data }: { data: DocumentoData }) {
  const conceptos = data.conceptos ?? []
  const total = data.total ?? calcularTotal(conceptos)
  const esVehiculo = data.tipo === 'vehiculo'
  const hoyISO = new Date().toISOString().slice(0, 10)

  return (
    <div
      style={{
        backgroundColor: COLORES.canvas,
        color: COLORES.ink,
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: T.body,
        padding: `${MEDIDAS.pagina.paddingTop}px ${MEDIDAS.pagina.paddingHorizontal}px ${MEDIDAS.pagina.paddingBottom}px`,
        borderRadius: 8,
        border: `1px solid ${COLORES.line}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        maxWidth: 612, // ancho carta en pt
        margin: '0 auto',
      }}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/lm-aduanas-logo.png"
            alt="LM Aduanas"
            width={60}
            height={MEDIDAS.logoAltura}
            style={{ height: MEDIDAS.logoAltura, width: 'auto', marginRight: 12, objectFit: 'contain' }}
          />
          <div style={{ borderLeft: `1px solid ${COLORES.line}`, paddingLeft: 10, maxWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORES.brandInk }}>{MARCA_GESTORIA.nombre}</div>
            <div
              style={{
                fontSize: 7.5,
                color: COLORES.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {MARCA_GESTORIA.tag}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: T.meta, fontWeight: 700, color: COLORES.muted, textTransform: 'uppercase' }}>
            Pág. 1 of 1
          </div>
          <div style={{ fontSize: T.meta, color: COLORES.ink, fontWeight: 600, marginTop: 3 }}>
            Date: {formatoFecha(hoyISO)}
          </div>
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: COLORES.line, marginTop: 14, marginBottom: 2 }} />
      <div style={{ height: 2, width: 46, backgroundColor: COLORES.brandAccent, marginTop: 2 }} />

      {/* Importador / RNC */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 16,
          border: `1px solid ${COLORES.line}`,
          borderRadius: MEDIDAS.radioBorde,
          backgroundColor: COLORES.white,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', padding: '8px 10px', flexGrow: 1 }}>
          <span
            style={{
              fontSize: T.label - 1,
              fontWeight: 700,
              color: COLORES.brandAccent,
              textTransform: 'uppercase',
              marginRight: 6,
            }}
          >
            Importador
          </span>
          <span style={{ fontSize: T.importadorValor, fontWeight: 600, color: COLORES.ink }}>
            {data.importador?.nombre || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderLeft: `1px solid ${COLORES.line}` }}>
          <span style={{ fontSize: T.label - 1, fontWeight: 700, color: COLORES.brandAccent, marginRight: 5 }}>[RNC]</span>
          <span style={{ fontSize: T.body, fontWeight: 700, color: COLORES.ink }}>{data.importador?.rnc || '—'}</span>
        </div>
      </div>

      {/* Bloque de datos según tipo */}
      <div
        style={{
          display: 'flex',
          marginTop: 8,
          border: `1px solid ${COLORES.line}`,
          borderRadius: MEDIDAS.radioBorde,
          overflow: 'hidden',
        }}
      >
        {(esVehiculo
          ? [
              ['Marca', data.vehiculo?.marca],
              ['Modelo', data.vehiculo?.modelo],
              ['Año', data.vehiculo?.anio],
              ['Chasis', data.vehiculo?.chasis],
            ]
          : [
              ['Número de BL', data.contenedor?.bl],
              ['Número de contenedor', data.contenedor?.numero_contenedor],
            ]
        ).map(([label, valor], i, arr) => (
          <div
            key={label as string}
            style={{
              padding: '7px 9px',
              borderRight: i < arr.length - 1 ? `1px solid ${COLORES.line}` : 'none',
              flex: esVehiculo ? '1' : '1',
            }}
          >
            <div style={{ fontSize: T.label - 1.5, fontWeight: 700, color: COLORES.muted, textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: T.dataValor, fontWeight: 600, color: COLORES.ink, marginTop: 2 }}>
              {valor || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Vencimiento — elemento crítico #1 */}
      <div
        style={{
          marginTop: 12,
          borderRadius: MEDIDAS.radioBordeDue,
          border: `2px solid ${COLORES.dueBorder}`,
          backgroundColor: COLORES.dueBg,
          padding: '8px 14px',
          boxShadow: '0 2px 6px rgba(192,16,46,0.25)',
        }}
      >
        <div
          style={{
            fontSize: T.dueLabel,
            fontWeight: 800,
            color: COLORES.dueText,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 3,
          }}
        >
          {ETIQUETA_VENCIMIENTO}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: T.dueValor, fontWeight: 800, color: COLORES.dueText }}>
            {formatoFecha(data.vencimiento_parqueo) || '—'}
          </span>
        </div>
      </div>

      {/* Tabla de gastos */}
      <div
        style={{
          marginTop: 14,
          border: `1px solid ${COLORES.line}`,
          borderRadius: MEDIDAS.radioBorde,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: COLORES.tableHeaderBg,
            borderBottom: `2px solid ${COLORES.brandInk}`,
          }}
        >
          <div style={{ flex: 1, padding: '8px 12px' }}>
            <span
              style={{
                fontSize: T.tablaHeader,
                fontWeight: 800,
                color: COLORES.tableHeaderInk,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Concepto
            </span>
          </div>
          <div style={{ width: '34%', padding: '8px 12px', textAlign: 'right' }}>
            <span
              style={{
                fontSize: T.tablaHeader,
                fontWeight: 800,
                color: COLORES.tableHeaderInk,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Monto
            </span>
          </div>
        </div>
        {conceptos.map((c, i) => (
          <div key={i} style={{ display: 'flex', borderTop: i === 0 ? 'none' : `1px solid ${COLORES.line}` }}>
            <div style={{ flex: 1, padding: '6px 12px' }}>
              <span style={{ fontSize: T.tablaCelda, fontWeight: 500, color: COLORES.ink }}>
                {formatoConcepto(c.concepto)}
              </span>
            </div>
            <div style={{ width: '34%', padding: '6px 12px', textAlign: 'right' }}>
              <span style={{ fontSize: T.tablaCelda, fontWeight: 600, color: COLORES.ink }}>{formatoMoneda(c.monto)}</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', backgroundColor: COLORES.totalBg, borderTop: `2px solid ${COLORES.brandInk}` }}>
          <div style={{ flex: 1, padding: '9px 12px', textAlign: 'right' }}>
            <span style={{ fontSize: T.totalLabel, fontWeight: 800, color: COLORES.totalInk }}>TOTAL RD$</span>
          </div>
          <div style={{ width: '34%', padding: '9px 12px', textAlign: 'right' }}>
            <span style={{ fontSize: T.totalValor, fontWeight: 800, color: COLORES.totalInk }}>{formatoMoneda(total)}</span>
          </div>
        </div>
      </div>

      {/* Nota legal — elemento crítico #2 */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: COLORES.noteBg,
          border: `2px solid ${COLORES.noteBorder}`,
          borderLeftWidth: 5,
          borderRadius: MEDIDAS.radioBordeDue,
          padding: '10px 12px',
        }}
      >
        <svg width={MEDIDAS.iconoAdvertencia} height={MEDIDAS.iconoAdvertencia} viewBox="0 0 24 24" style={{ marginRight: 10, flexShrink: 0 }}>
          <path d="M12 2.5 23 21H1L12 2.5Z" fill={COLORES.warnFill} stroke={COLORES.warnStroke} strokeWidth={1.3} />
          <path d="M12 9.3v5.4" stroke={COLORES.warnStroke} strokeWidth={2.3} />
          <circle cx={12} cy={17.6} r={1.35} fill={COLORES.warnStroke} />
        </svg>
        <span style={{ flex: 1, fontSize: T.nota, fontWeight: 700, color: COLORES.noteInk, lineHeight: 1.4 }}>
          {TEXTO_NOTA_LEGAL}
        </span>
      </div>

      {/* Pie */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: 7, color: COLORES.muted, letterSpacing: 0.3 }}>LogiCosto · v1</span>
        <span style={{ fontSize: 7, color: COLORES.muted, letterSpacing: 0.3 }}>Documento generado electrónicamente</span>
      </div>
    </div>
  )
}
