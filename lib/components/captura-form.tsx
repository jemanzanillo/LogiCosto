'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  armarData,
  validar,
  formStateVacio,
  calcularTotal,
  CONCEPTOS_SUGERIDOS,
  type FormState,
  type DocumentoTipo,
  type ConceptoLinea,
} from '@/lib/documentos/types'
import type { Database } from '@/lib/types/database.types'
import { formatoMoneda } from '@/lib/pdf/formato'
import { guardarBorrador, exportar } from '@/app/(protected)/documentos/actions'
import DocumentoPreview from './documento-preview'

type DocStatus = Database['public']['Enums']['document_status']

type Props = {
  initialId?: string
  initialStatus?: DocStatus
  initialForm?: FormState
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

export default function CapturaForm({ initialId, initialStatus, initialForm }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm ?? formStateVacio())
  const [id, setId] = useState<string | undefined>(initialId)
  const [status, setStatus] = useState<DocStatus>(initialStatus ?? 'borrador')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pendingExportar, startExportar] = useTransition()

  const data = useMemo(() => armarData(form), [form])
  const total = calcularTotal(form.conceptos)

  // ---- updaters ----
  function setTipo(tipo: DocumentoTipo) {
    setForm((f) => ({ ...f, tipo }))
  }
  function setImportador(campo: 'nombre' | 'rnc', valor: string) {
    setForm((f) => ({ ...f, importador: { ...f.importador, [campo]: valor } }))
  }
  function setVehiculo(campo: keyof FormState['vehiculo'], valor: string) {
    setForm((f) => ({ ...f, vehiculo: { ...f.vehiculo, [campo]: valor } }))
  }
  function setContenedor(campo: keyof FormState['contenedor'], valor: string) {
    setForm((f) => ({ ...f, contenedor: { ...f.contenedor, [campo]: valor } }))
  }
  function setVencimiento(valor: string) {
    setForm((f) => ({ ...f, vencimiento_parqueo: valor }))
  }
  function setConcepto(i: number, campo: keyof ConceptoLinea, valor: string) {
    setForm((f) => {
      const conceptos = f.conceptos.map((c, idx) =>
        idx === i ? { ...c, [campo]: campo === 'monto' ? Number(valor) || 0 : valor } : c
      )
      return { ...f, conceptos }
    })
  }
  function agregarConcepto() {
    setForm((f) => ({ ...f, conceptos: [...f.conceptos, { concepto: '', monto: 0 }] }))
  }
  function eliminarConcepto(i: number) {
    setForm((f) => ({
      ...f,
      conceptos: f.conceptos.length > 1 ? f.conceptos.filter((_, idx) => idx !== i) : f.conceptos,
    }))
  }

  // ---- acciones ----
  function handleExportar() {
    setMensaje(null)
    const errs = validar(form)
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    startExportar(async () => {
      // Persistir los últimos cambios y obtener el id.
      const guardado = await guardarBorrador(form, id)
      if (!guardado.ok) {
        if ('errores' in guardado) setErrores(guardado.errores)
        else setMensaje(guardado.error)
        return
      }
      const docId = guardado.id
      setId(docId)

      const exp = await exportar(docId)
      if (!exp.ok) {
        setMensaje(exp.error)
        return
      }
      setStatus('exportada')
      setMensaje('Documento exportado. Descargando PDF…')
      window.open(`/api/documentos/${docId}/pdf`, '_blank')
      router.replace(`/documentos/${docId}`)
    })
  }

  const err = (k: string) => errores[k]
  const guardando = pendingExportar

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ---- Formulario ---- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {id ? 'Editar documento' : 'Nueva factura'}
          </h2>
          <span
            className={
              'rounded-full px-2.5 py-0.5 text-xs font-medium ' +
              (status === 'exportada'
                ? 'bg-status-pendiente-bg text-status-pendiente-text'
                : 'bg-status-borrador-bg text-status-borrador-text')
            }
          >
            {status === 'exportada' ? 'Exportada' : 'Borrador'}
          </span>
        </div>

        {/* Tipo */}
        <div>
          <span className={labelCls}>Tipo de documento</span>
          <div className="flex gap-2">
            {(['vehiculo', 'contenedor'] as DocumentoTipo[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ' +
                  (form.tipo === t
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-brand-primary')
                }
              >
                {t === 'vehiculo' ? 'Vehículo' : 'Contenedor'}
              </button>
            ))}
          </div>
        </div>

        {/* Importador */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-gray-700">Importador</legend>
          <div>
            <label className={labelCls}>Nombre / razón social</label>
            <input className={inputCls} value={form.importador.nombre} onChange={(e) => setImportador('nombre', e.target.value)} />
            {err('importador.nombre') && <p className="mt-1 text-xs text-red-600">{err('importador.nombre')}</p>}
          </div>
          <div>
            <label className={labelCls}>RNC</label>
            <input className={inputCls} value={form.importador.rnc} onChange={(e) => setImportador('rnc', e.target.value)} />
            {err('importador.rnc') && <p className="mt-1 text-xs text-red-600">{err('importador.rnc')}</p>}
          </div>
        </fieldset>

        {/* Datos por tipo */}
        {form.tipo === 'vehiculo' ? (
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="col-span-2 text-sm font-semibold text-gray-700">Datos del vehículo</legend>
            <div>
              <label className={labelCls}>Marca</label>
              <input className={inputCls} value={form.vehiculo.marca} onChange={(e) => setVehiculo('marca', e.target.value)} />
              {err('vehiculo.marca') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.marca')}</p>}
            </div>
            <div>
              <label className={labelCls}>Modelo</label>
              <input className={inputCls} value={form.vehiculo.modelo} onChange={(e) => setVehiculo('modelo', e.target.value)} />
              {err('vehiculo.modelo') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.modelo')}</p>}
            </div>
            <div>
              <label className={labelCls}>Año</label>
              <input className={inputCls} inputMode="numeric" value={form.vehiculo.anio} onChange={(e) => setVehiculo('anio', e.target.value)} />
              {err('vehiculo.anio') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.anio')}</p>}
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input className={inputCls} value={form.vehiculo.color} onChange={(e) => setVehiculo('color', e.target.value)} />
              <p className="mt-1 text-[11px] text-gray-400">No aparece en el PDF</p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Chasis</label>
              <input className={inputCls} value={form.vehiculo.chasis} onChange={(e) => setVehiculo('chasis', e.target.value)} />
              {err('vehiculo.chasis') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.chasis')}</p>}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700">Datos del contenedor</legend>
            <div>
              <label className={labelCls}>Número de BL</label>
              <input className={inputCls} value={form.contenedor.bl} onChange={(e) => setContenedor('bl', e.target.value)} />
              {err('contenedor.bl') && <p className="mt-1 text-xs text-red-600">{err('contenedor.bl')}</p>}
            </div>
            <div>
              <label className={labelCls}>Número de contenedor</label>
              <input
                className={inputCls}
                value={form.contenedor.numero_contenedor}
                onChange={(e) => setContenedor('numero_contenedor', e.target.value)}
              />
              {err('contenedor.numero_contenedor') && (
                <p className="mt-1 text-xs text-red-600">{err('contenedor.numero_contenedor')}</p>
              )}
            </div>
          </fieldset>
        )}

        {/* Vencimiento */}
        <div>
          <label className={labelCls}>Fecha de vencimiento de parqueo</label>
          <input type="date" className={inputCls} value={form.vencimiento_parqueo} onChange={(e) => setVencimiento(e.target.value)} />
          {err('vencimiento_parqueo') && <p className="mt-1 text-xs text-red-600">{err('vencimiento_parqueo')}</p>}
        </div>

        {/* Conceptos */}
        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-gray-700">Conceptos</legend>
            <button type="button" onClick={agregarConcepto} className="text-xs font-medium text-brand-primary hover:underline">
              + Agregar concepto
            </button>
          </div>
          <datalist id="conceptos-sugeridos">
            {CONCEPTOS_SUGERIDOS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {form.conceptos.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className={inputCls + ' flex-1'}
                list="conceptos-sugeridos"
                placeholder="Concepto"
                value={c.concepto}
                onChange={(e) => setConcepto(i, 'concepto', e.target.value)}
              />
              <input
                className={inputCls + ' w-32'}
                inputMode="decimal"
                placeholder="0.00"
                value={c.monto || ''}
                onChange={(e) => setConcepto(i, 'monto', e.target.value)}
              />
              <button
                type="button"
                onClick={() => eliminarConcepto(i)}
                disabled={form.conceptos.length === 1}
                className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Eliminar concepto"
              >
                ✕
              </button>
            </div>
          ))}
          {err('conceptos') && <p className="text-xs text-red-600">{err('conceptos')}</p>}
          <div className="flex justify-end pt-1 text-sm font-semibold text-gray-800">
            Total: {formatoMoneda(total)}
          </div>
        </fieldset>

        {/* Acciones */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleExportar}
            disabled={guardando}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-marino-900 disabled:opacity-60"
          >
            {pendingExportar ? 'Exportando…' : 'Exportar PDF'}
          </button>
          {mensaje && <span className="text-sm text-gray-500">{mensaje}</span>}
        </div>
      </div>

      {/* ---- Preview ---- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Vista previa</p>
        <DocumentoPreview data={data} />
      </div>
    </div>
  )
}
