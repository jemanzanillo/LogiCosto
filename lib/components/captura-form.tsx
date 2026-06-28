'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  armarData,
  validar,
  formStateVacio,
  calcularTotal,
  type FormState,
  type DocumentoTipo,
} from '@/lib/documentos/types'
import type { Database } from '@/lib/types/database.types'
import { formatoMoneda } from '@/lib/pdf/formato'
import { guardarBorrador, exportar, crearNuevaVersion } from '@/app/(protected)/documentos/actions'
import { ACCIONES_DISPONIBLES } from '@/lib/auth/permisos'
import DocumentoPreview from './documento-preview'

type DocStatus = Database['public']['Enums']['document_status']

type Props = {
  initialId?: string
  initialStatus?: DocStatus
  initialForm?: FormState
  // Permisos del usuario actual (claves del catálogo). Por defecto: todos
  // (cubre el caso "documento nuevo" hasta que la página resuelva los reales).
  permisos?: string[]
}

const inputBase =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
  'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary ' +
  'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
const inputCls = 'w-full ' + inputBase
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

export default function CapturaForm({
  initialId,
  initialStatus,
  initialForm,
  permisos = ACCIONES_DISPONIBLES,
}: Props) {
  const tiene = (a: string) => permisos.includes(a)
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm ?? formStateVacio())
  const [id, setId] = useState<string | undefined>(initialId)
  const [status, setStatus] = useState<DocStatus>(initialStatus ?? 'borrador')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pendingExportar, startExportar] = useTransition()
  const [pendingVersion, startVersion] = useTransition()

  // Una vez Pendiente/Aprobada el documento se bloquea: para corregirlo hay que
  // crear una versión nueva (que lo devuelve a Borrador).
  const bloqueado = status === 'exportada' || status === 'finalizada'

  // Estado local del campo de entrada de conceptos
  const [nuevoConcepto, setNuevoConcepto] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [errorEntrada, setErrorEntrada] = useState<string | null>(null)
  const refConcepto = useRef<HTMLInputElement>(null)

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
  function handleAgregarConcepto() {
    const nombre = nuevoConcepto.trim()
    const monto = Number(nuevoMonto.replace(',', '.')) || 0
    if (!nombre) { setErrorEntrada('Escribe el nombre del concepto.'); return }
    if (monto <= 0) { setErrorEntrada('El monto debe ser mayor a 0.'); return }
    setErrorEntrada(null)
    setForm((f) => ({ ...f, conceptos: [...f.conceptos, { concepto: nombre, monto }] }))
    setNuevoConcepto('')
    setNuevoMonto('')
    refConcepto.current?.focus()
  }
  function eliminarConcepto(i: number) {
    setForm((f) => ({ ...f, conceptos: f.conceptos.filter((_, idx) => idx !== i) }))
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

  function handleCrearVersion() {
    if (!id) return
    setMensaje(null)
    startVersion(async () => {
      const res = await crearNuevaVersion(id)
      if (!res.ok) {
        setMensaje('error' in res ? res.error : 'No se pudo crear la versión.')
        return
      }
      // El documento vuelve a Borrador y se desbloquea para editar.
      setStatus('borrador')
      router.refresh()
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
              (status === 'finalizada'
                ? 'bg-status-aprobado-bg text-status-aprobado-text'
                : status === 'exportada'
                  ? 'bg-status-pendiente-bg text-status-pendiente-text'
                  : 'bg-status-borrador-bg text-status-borrador-text')
            }
          >
            {status === 'finalizada' ? 'Aprobada' : status === 'exportada' ? 'Pendiente' : 'Borrador'}
          </span>
        </div>

        {/* Banner de bloqueo: el documento ya no es borrador */}
        {bloqueado && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-900">
              Este documento está{' '}
              <span className="font-semibold">
                {status === 'finalizada' ? 'Aprobada' : 'Pendiente'}
              </span>
              . Para modificarlo, crea una nueva versión.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {tiene('documento.version_crear') && (
                <button
                  type="button"
                  onClick={handleCrearVersion}
                  disabled={pendingVersion}
                  className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-marino-900 disabled:opacity-60"
                >
                  {pendingVersion ? 'Creando…' : 'Crear nueva versión'}
                </button>
              )}
              <Link
                href={`/documentos/${id}/versiones`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Ver versiones
              </Link>
              <a
                href={`/api/documentos/${id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reimprimir PDF
              </a>
              {mensaje && <span className="text-sm text-red-600">{mensaje}</span>}
            </div>
          </div>
        )}

        {/* Tipo */}
        <div>
          <span className={labelCls}>Tipo de documento</span>
          <div className="flex gap-2">
            {(['vehiculo', 'contenedor'] as DocumentoTipo[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                disabled={bloqueado}
                className={
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition disabled:cursor-not-allowed disabled:opacity-60 ' +
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
            <input className={inputCls} disabled={bloqueado} value={form.importador.nombre} onChange={(e) => setImportador('nombre', e.target.value)} />
            {err('importador.nombre') && <p className="mt-1 text-xs text-red-600">{err('importador.nombre')}</p>}
          </div>
          <div>
            <label className={labelCls}>RNC</label>
            <input className={inputCls} disabled={bloqueado} value={form.importador.rnc} onChange={(e) => setImportador('rnc', e.target.value)} />
            {err('importador.rnc') && <p className="mt-1 text-xs text-red-600">{err('importador.rnc')}</p>}
          </div>
        </fieldset>

        {/* Datos por tipo */}
        {form.tipo === 'vehiculo' ? (
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="col-span-2 text-sm font-semibold text-gray-700">Datos del vehículo</legend>
            <div>
              <label className={labelCls}>Marca</label>
              <input className={inputCls} disabled={bloqueado} value={form.vehiculo.marca} onChange={(e) => setVehiculo('marca', e.target.value)} />
              {err('vehiculo.marca') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.marca')}</p>}
            </div>
            <div>
              <label className={labelCls}>Modelo</label>
              <input className={inputCls} disabled={bloqueado} value={form.vehiculo.modelo} onChange={(e) => setVehiculo('modelo', e.target.value)} />
              {err('vehiculo.modelo') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.modelo')}</p>}
            </div>
            <div>
              <label className={labelCls}>Año</label>
              <input className={inputCls} disabled={bloqueado} inputMode="numeric" value={form.vehiculo.anio} onChange={(e) => setVehiculo('anio', e.target.value)} />
              {err('vehiculo.anio') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.anio')}</p>}
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input className={inputCls} disabled={bloqueado} value={form.vehiculo.color} onChange={(e) => setVehiculo('color', e.target.value)} />
              <p className="mt-1 text-[11px] text-gray-400">No aparece en el PDF</p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Chasis</label>
              <input className={inputCls} disabled={bloqueado} value={form.vehiculo.chasis} onChange={(e) => setVehiculo('chasis', e.target.value)} />
              {err('vehiculo.chasis') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.chasis')}</p>}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700">Datos del contenedor</legend>
            <div>
              <label className={labelCls}>Número de BL</label>
              <input className={inputCls} disabled={bloqueado} value={form.contenedor.bl} onChange={(e) => setContenedor('bl', e.target.value)} />
              {err('contenedor.bl') && <p className="mt-1 text-xs text-red-600">{err('contenedor.bl')}</p>}
            </div>
            <div>
              <label className={labelCls}>Número de contenedor</label>
              <input
                className={inputCls}
                disabled={bloqueado}
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
          <input type="date" className={inputCls} disabled={bloqueado} value={form.vencimiento_parqueo} onChange={(e) => setVencimiento(e.target.value)} />
          {err('vencimiento_parqueo') && <p className="mt-1 text-xs text-red-600">{err('vencimiento_parqueo')}</p>}
        </div>

        {/* Conceptos */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-gray-700">Conceptos</legend>

          {/* Entrada */}
          {!bloqueado && (
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                ref={refConcepto}
                className={inputBase + ' flex-1 min-w-0'}
                placeholder="Nombre del concepto"
                value={nuevoConcepto}
                onChange={(e) => { setNuevoConcepto(e.target.value); setErrorEntrada(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarConcepto() } }}
              />
              <input
                className={inputBase + ' w-28'}
                inputMode="decimal"
                placeholder="Monto"
                value={nuevoMonto}
                onChange={(e) => { setNuevoMonto(e.target.value); setErrorEntrada(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarConcepto() } }}
              />
              <button
                type="button"
                onClick={handleAgregarConcepto}
                className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-marino-900 whitespace-nowrap"
              >
                + Agregar
              </button>
            </div>
            {errorEntrada && <p className="text-xs text-red-600">{errorEntrada}</p>}
          </div>
          )}

          {/* Lista de conceptos agregados */}
          {form.conceptos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
              Aún no hay conceptos. Agrega el primero.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-100">
              {form.conceptos.map((c, i) => (
                <li key={i} className="flex items-center gap-3 bg-white px-3 py-2.5">
                  <span className="flex-1 text-sm text-gray-800">{c.concepto}</span>
                  <span className="tabular-nums text-sm font-medium text-gray-700">
                    {formatoMoneda(c.monto)}
                  </span>
                  {!bloqueado && (
                    <button
                      type="button"
                      onClick={() => eliminarConcepto(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Eliminar ${c.concepto}`}
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
              <li className="flex justify-end bg-gray-50 px-3 py-2">
                <span className="text-sm font-semibold text-gray-800">
                  Total: {formatoMoneda(total)}
                </span>
              </li>
            </ul>
          )}

          {err('conceptos') && <p className="text-xs text-red-600">{err('conceptos')}</p>}
        </fieldset>

        {/* Acciones */}
        {!bloqueado && tiene('documento.exportar') && (
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
        )}
      </div>

      {/* ---- Preview ---- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Vista previa</p>
        <DocumentoPreview data={data} />
      </div>
    </div>
  )
}
