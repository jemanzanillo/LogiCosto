'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Check, Loader2, GripVertical, Pencil } from 'lucide-react'
import {
  armarData,
  validar,
  formStateVacio,
  calcularTotal,
  type FormState,
  type Importador,
} from '@/lib/documentos/types'
import type { Database } from '@/lib/types/database.types'
import { formatoMoneda } from '@/lib/pdf/formato'
import { guardarBorrador, exportar, crearNuevaVersion, marcarAprobada, revertirPendiente } from '@/app/(protected)/documentos/actions'
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
  // Presets de importador y conceptos frecuentes derivados del historial.
  importadores?: Importador[]
  conceptosFrecuentes?: string[]
}

// Parsea montos con separadores de miles/decimales mixtos.
// "3,500" → 3500 | "3,50" → 3.50 | "3.500,00" → 3500 | "3,500.00" → 3500
function parsearMonto(texto: string): number {
  const s = texto.trim()
  if (!s) return 0
  const tieneC = s.includes(',')
  const tieneP = s.includes('.')
  if (tieneC && tieneP) {
    return s.lastIndexOf(',') > s.lastIndexOf('.')
      ? Number(s.replace(/\./g, '').replace(',', '.'))  // "3.500,00"
      : Number(s.replace(/,/g, ''))                     // "3,500.00"
  }
  if (tieneC) {
    const partes = s.split(',')
    return partes.length > 2 || partes[partes.length - 1].length === 3
      ? Number(s.replace(/,/g, ''))   // "3,500" o "1,000,000"
      : Number(s.replace(',', '.'))   // "3,50"
  }
  if (tieneP) {
    const partes = s.split('.')
    return partes.length > 2 || partes[partes.length - 1].length === 3
      ? Number(s.replace(/\./g, ''))  // "3.500" o "1.000.000"
      : Number(s)                     // "3.50"
  }
  return Number(s)
}

const inputBase =
  'rounded-lg border border-border-strong px-3 py-2 text-sm text-text-primary ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary ' +
  'disabled:bg-surface-sunken disabled:text-text-tertiary disabled:cursor-not-allowed'
const inputCls = 'w-full ' + inputBase
const labelCls = 'block text-xs font-display font-medium text-text-secondary mb-1'

export default function CapturaForm({
  initialId,
  initialStatus,
  initialForm,
  permisos = ACCIONES_DISPONIBLES,
  importadores = [],
  conceptosFrecuentes = [],
}: Props) {
  const tiene = (a: string) => permisos.includes(a)
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm ?? formStateVacio())
  const [id, setId] = useState<string | undefined>(initialId)
  // idRef sigue al id sin disparar el efecto de autosave (evita guardados en bucle).
  const idRef = useRef<string | undefined>(initialId)
  function setDocId(v: string) {
    idRef.current = v
    setId(v)
  }
  const [status, setStatus] = useState<DocStatus>(initialStatus ?? 'borrador')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pendingExportar, startExportar] = useTransition()
  const [pendingVersion, startVersion] = useTransition()
  const [pendingGuardar, startGuardar] = useTransition()
  const [pendingAprobar, startAprobar] = useTransition()
  const [pendingRevertir, startRevertir] = useTransition()
  // Indicador de autosave: idle | guardando | guardado.
  const [autosave, setAutosave] = useState<'idle' | 'guardando' | 'guardado'>('idle')

  // Una vez Pendiente/Aprobada el documento se bloquea: para corregirlo hay que
  // crear una versión nueva (que lo devuelve a Borrador).
  const bloqueado = status === 'exportada' || status === 'finalizada'
  const puedeGuardarBorrador = tiene('documento.crear') || tiene('documento.editar')

  // Estado local del campo de entrada de conceptos
  const [nuevoConcepto, setNuevoConcepto] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [errorEntrada, setErrorEntrada] = useState<string | null>(null)
  const refConcepto = useRef<HTMLInputElement>(null)
  const refMonto = useRef<HTMLInputElement>(null)
  // Edición en línea de un concepto ya agregado.
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editConcepto, setEditConcepto] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)
  // Índice del concepto que se está arrastrando (reordenar por arrastre).
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const data = useMemo(() => armarData(form), [form])
  const total = calcularTotal(form.conceptos)

  // ---- Autosave (red de seguridad ante interrupciones) ----
  // Tras una pausa al escribir, guarda el borrador parcial (sin exigir el
  // formulario completo). No corre en documentos bloqueados ni en el primer
  // render (evita guardar un formulario sembrado sin que el usuario lo edite).
  const primerRender = useRef(true)
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    if (bloqueado || !puedeGuardarBorrador) return
    if (!form.importador.nombre.trim()) return

    setAutosave('guardando')
    const t = setTimeout(async () => {
      const res = await guardarBorrador(form, idRef.current, { parcial: true })
      if (res.ok) {
        setDocId(res.id)
        setAutosave('guardado')
      } else {
        setAutosave('idle')
      }
    }, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, bloqueado])

  function handleGuardarBorrador() {
    if (!form.importador.nombre.trim()) {
      setMensaje('Escribe al menos el nombre del importador para guardar el borrador.')
      return
    }
    setMensaje(null)
    startGuardar(async () => {
      const res = await guardarBorrador(form, idRef.current, { parcial: true })
      if (res.ok) {
        setDocId(res.id)
        setAutosave('guardado')
      } else {
        setMensaje('error' in res ? res.error : 'No se pudo guardar el borrador.')
      }
    })
  }

  // ---- updaters ----
  function setImportador(campo: 'nombre' | 'rnc', valor: string) {
    setForm((f) => ({ ...f, importador: { ...f.importador, [campo]: valor } }))
  }
  // Nombre del importador con autocompletado de presets: si el nombre coincide
  // con un preset del historial, rellena el RNC automáticamente.
  function setNombreImportador(valor: string) {
    const preset = importadores.find(
      (i) => i.nombre.trim().toLowerCase() === valor.trim().toLowerCase(),
    )
    setForm((f) => ({
      ...f,
      importador: {
        nombre: valor,
        rnc: preset && preset.rnc ? preset.rnc : f.importador.rnc,
      },
    }))
  }
  function elegirConceptoFrecuente(nombre: string) {
    setNuevoConcepto(nombre)
    setErrorEntrada(null)
    refMonto.current?.focus()
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
    const monto = parsearMonto(nuevoMonto)
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
    if (editIdx === i) cancelarEdicion()
  }
  function iniciarEdicion(i: number) {
    const c = form.conceptos[i]
    setEditIdx(i)
    setEditConcepto(c.concepto)
    setEditMonto(String(c.monto))
    setErrorEdicion(null)
  }
  function cancelarEdicion() {
    setEditIdx(null)
    setEditConcepto('')
    setEditMonto('')
    setErrorEdicion(null)
  }
  function guardarEdicion() {
    if (editIdx === null) return
    const nombre = editConcepto.trim()
    const monto = parsearMonto(editMonto)
    if (!nombre) { setErrorEdicion('Escribe el nombre del concepto.'); return }
    if (monto <= 0) { setErrorEdicion('El monto debe ser mayor a 0.'); return }
    setForm((f) => ({
      ...f,
      conceptos: f.conceptos.map((c, idx) => (idx === editIdx ? { concepto: nombre, monto } : c)),
    }))
    cancelarEdicion()
  }
  // Reordenar por arrastre: mueve el concepto desde `from` hasta `to`.
  function reordenarConcepto(from: number, to: number) {
    if (from === to) return
    setForm((f) => {
      const lista = [...f.conceptos]
      const [movido] = lista.splice(from, 1)
      lista.splice(to, 0, movido)
      return { ...f, conceptos: lista }
    })
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
      setDocId(docId)

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
  function handleAprobar() {
    if (!id) return
    setMensaje(null)
    startAprobar(async () => {
      const res = await marcarAprobada(id)
      if (!res.ok) { setMensaje('error' in res ? res.error : 'No se pudo aprobar el documento.'); return }
      setStatus('finalizada')
    })
  }
  function handleRevertirPendiente() {
    if (!id) return
    setMensaje(null)
    startRevertir(async () => {
      const res = await revertirPendiente(id)
      if (!res.ok) { setMensaje('error' in res ? res.error : 'No se pudo revertir el documento.'); return }
      setStatus('exportada')
    })
  }

  const err = (k: string) => errores[k]
  const guardando = pendingExportar

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ---- Formulario ---- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">
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
              {/* Acción de revisión primero — sin consecuencias, abre en nueva pestaña */}
              <a
                href={`/api/documentos/${id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover"
              >
                Reimprimir PDF
              </a>

              {/* Pendiente: aprobar es la acción principal (único botón primario) */}
              {status === 'exportada' && tiene('documento.aprobar') && (
                <button
                  type="button"
                  onClick={handleAprobar}
                  disabled={pendingAprobar}
                  className="rounded-lg bg-status-aprobado-dot px-3 py-1.5 text-sm font-display font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {pendingAprobar ? 'Aprobando…' : 'Aprobar'}
                </button>
              )}

              {/* Aprobada: historial antes de corregir */}
              {status === 'finalizada' && (
                <Link
                  href={`/documentos/${id}/versiones`}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover"
                >
                  Ver versiones
                </Link>
              )}

              {/* Corrección: secundario en ambos estados */}
              {tiene('documento.version_crear') && (
                <button
                  type="button"
                  onClick={handleCrearVersion}
                  disabled={pendingVersion}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
                >
                  {pendingVersion ? 'Creando…' : 'Crear nueva versión'}
                </button>
              )}

              {/* Pendiente: historial al final (referencia) */}
              {status === 'exportada' && (
                <Link
                  href={`/documentos/${id}/versiones`}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover"
                >
                  Ver versiones
                </Link>
              )}

              {/* Aprobada: revertir al final — acción regresiva y poco frecuente */}
              {status === 'finalizada' && tiene('documento.revertir') && (
                <button
                  type="button"
                  onClick={handleRevertirPendiente}
                  disabled={pendingRevertir}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-60"
                >
                  {pendingRevertir ? 'Revirtiendo…' : 'Revertir a pendiente'}
                </button>
              )}

              {mensaje && <span className="text-sm text-red-600">{mensaje}</span>}
            </div>
          </div>
        )}

        {/* Importador */}
        <fieldset className="space-y-3">
          <legend className="font-display text-sm font-semibold text-text-primary">Importador</legend>
          <div>
            <label className={labelCls}>Nombre / razón social</label>
            <input
              className={inputCls}
              disabled={bloqueado}
              list="presets-importadores"
              autoComplete="off"
              placeholder={importadores.length ? 'Escribe o elige un importador frecuente' : undefined}
              value={form.importador.nombre}
              onChange={(e) => setNombreImportador(e.target.value)}
            />
            {importadores.length > 0 && (
              <datalist id="presets-importadores">
                {importadores.map((imp) => (
                  <option key={imp.nombre} value={imp.nombre} />
                ))}
              </datalist>
            )}
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
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="font-display text-sm font-semibold text-text-primary sm:col-span-2">Datos del vehículo</legend>
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Chasis</label>
              <input className={inputCls} disabled={bloqueado} value={form.vehiculo.chasis} onChange={(e) => setVehiculo('chasis', e.target.value)} />
              {err('vehiculo.chasis') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.chasis')}</p>}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-3">
            <legend className="font-display text-sm font-semibold text-text-primary">Datos del contenedor</legend>
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
          <input type="date" lang="es-DO" className={inputCls} disabled={bloqueado} value={form.vencimiento_parqueo} onChange={(e) => setVencimiento(e.target.value)} />
          {err('vencimiento_parqueo')
            ? <p className="mt-1 text-xs text-red-600">{err('vencimiento_parqueo')}</p>
            : <p className="mt-1 text-[11px] text-text-tertiary">Formato: día / mes / año (DD/MM/AAAA)</p>}
        </div>

        {/* Conceptos */}
        <fieldset className="space-y-3">
          <legend className="font-display text-sm font-semibold text-text-primary">Conceptos</legend>

          {/* Entrada */}
          {!bloqueado && (
          <div className="space-y-2">
            {/* Conceptos frecuentes (del historial): un clic los carga listos para
                escribir el monto. Acelera el momento clave de ingresar costos. */}
            {conceptosFrecuentes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {conceptosFrecuentes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => elegirConceptoFrecuente(c)}
                    className="rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-action-primary hover:text-action-primary"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                ref={refConcepto}
                className={inputBase + ' w-full min-w-0 sm:flex-1'}
                placeholder="Nombre del concepto"
                value={nuevoConcepto}
                onChange={(e) => { setNuevoConcepto(e.target.value); setErrorEntrada(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarConcepto() } }}
              />
              <input
                ref={refMonto}
                className={inputBase + ' min-w-0 flex-1 sm:w-28 sm:flex-none'}
                inputMode="decimal"
                placeholder="Monto"
                value={nuevoMonto}
                onChange={(e) => { setNuevoMonto(e.target.value); setErrorEntrada(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarConcepto() } }}
              />
              <button
                type="button"
                onClick={handleAgregarConcepto}
                className="rounded-lg bg-action-primary px-3 py-2 text-sm font-display font-semibold text-white hover:bg-action-primary-hover whitespace-nowrap"
              >
                + Agregar
              </button>
            </div>
            {errorEntrada && <p className="text-xs text-red-600">{errorEntrada}</p>}
          </div>
          )}

          {/* Lista de conceptos agregados */}
          {form.conceptos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-4 text-center text-sm text-text-tertiary">
              Aún no hay conceptos. Agrega el primero.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-border divide-y divide-border/60">
              {form.conceptos.map((c, i) => (
                <li
                  key={i}
                  onDragOver={(e) => { if (dragIdx !== null) e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIdx !== null) reordenarConcepto(dragIdx, i)
                    setDragIdx(null)
                  }}
                  className={
                    'flex items-center gap-2 bg-surface-raised px-3 py-2.5 transition-colors ' +
                    (dragIdx === i ? 'opacity-50 ' : '') +
                    (dragIdx !== null && dragIdx !== i ? 'border-t-2 border-t-transparent hover:border-t-action-primary ' : '')
                  }
                >
                  {editIdx === i ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <input
                          autoFocus
                          className={inputBase + ' w-full min-w-0 sm:flex-1'}
                          placeholder="Nombre del concepto"
                          value={editConcepto}
                          onChange={(e) => { setEditConcepto(e.target.value); setErrorEdicion(null) }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); guardarEdicion() }
                            if (e.key === 'Escape') { e.preventDefault(); cancelarEdicion() }
                          }}
                        />
                        <input
                          className={inputBase + ' min-w-0 flex-1 sm:w-28 sm:flex-none'}
                          inputMode="decimal"
                          placeholder="Monto"
                          value={editMonto}
                          onChange={(e) => { setEditMonto(e.target.value); setErrorEdicion(null) }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); guardarEdicion() }
                            if (e.key === 'Escape') { e.preventDefault(); cancelarEdicion() }
                          }}
                        />
                        <button
                          type="button"
                          onClick={guardarEdicion}
                          className="rounded-lg bg-action-primary px-3 py-2 text-sm font-display font-semibold text-white hover:bg-action-primary-hover"
                          aria-label="Guardar cambios"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          className="rounded-lg border border-border px-3 py-2 text-text-tertiary hover:text-text-primary"
                          aria-label="Cancelar edición"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {errorEdicion && <p className="text-xs text-red-600">{errorEdicion}</p>}
                    </div>
                  ) : (
                    <>
                      {!bloqueado && (
                        <span
                          draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragEnd={() => setDragIdx(null)}
                          className="cursor-grab text-text-tertiary hover:text-text-secondary active:cursor-grabbing"
                          aria-label="Arrastrar para reordenar"
                          title="Arrastrar para reordenar"
                        >
                          <GripVertical size={16} />
                        </span>
                      )}
                      <span className="flex-1 text-sm text-text-primary">{c.concepto}</span>
                      <span className="tabular-nums text-sm font-medium text-text-secondary">
                        {formatoMoneda(c.monto)}
                      </span>
                      {!bloqueado && (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(i)}
                            className="text-text-tertiary hover:text-action-primary transition-colors"
                            aria-label={`Editar ${c.concepto}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarConcepto(i)}
                            className="text-text-tertiary hover:text-status-vencida-dot transition-colors"
                            aria-label={`Eliminar ${c.concepto}`}
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
              <li className="flex justify-end bg-surface-sunken px-3 py-2">
                <span className="font-display text-sm font-semibold text-text-primary">
                  Total: {formatoMoneda(total)}
                </span>
              </li>
            </ul>
          )}

          {err('conceptos') && <p className="text-xs text-red-600">{err('conceptos')}</p>}
        </fieldset>

        {/* Acciones */}
        {!bloqueado && (puedeGuardarBorrador || tiene('documento.exportar')) && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {puedeGuardarBorrador && (
              <button
                type="button"
                onClick={handleGuardarBorrador}
                disabled={pendingGuardar}
                className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-display font-semibold text-text-secondary transition hover:bg-surface-hover disabled:opacity-60 sm:w-auto"
              >
                {pendingGuardar ? 'Guardando…' : 'Guardar borrador'}
              </button>
            )}
            {tiene('documento.exportar') && (
              <button
                type="button"
                onClick={handleExportar}
                disabled={guardando}
                className="w-full rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60 sm:w-auto"
              >
                {pendingExportar ? 'Exportando…' : 'Exportar PDF'}
              </button>
            )}
            {autosave === 'guardando' && (
              <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                <Loader2 size={13} className="animate-spin" /> Guardando…
              </span>
            )}
            {autosave === 'guardado' && (
              <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                <Check size={13} className="text-status-aprobado-dot" /> Borrador guardado
              </span>
            )}
            {mensaje && <span className="text-sm text-text-secondary">{mensaje}</span>}
          </div>
        )}
      </div>

      {/* ---- Preview ---- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-text-tertiary">Vista previa</p>
        <DocumentoPreview data={data} />
      </div>
    </div>
  )
}
