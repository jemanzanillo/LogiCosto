'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import {
  armarData,
  validar,
  calcularTotal,
  type FormState,
} from '@/lib/documentos/types'
import { formatoMoneda } from '@/lib/pdf/formato'
import { importarHistorico } from '@/app/(protected)/historial/importar/actions'
import DocumentoPreview from '../documento-preview'

type Props = {
  initialForm: FormState
  advertencias: string[]
  archivo: string
}

// Parsea montos con separadores de miles/decimales mixtos (misma lógica que
// captura-form): "3,500" → 3500 | "3,50" → 3.50 | "3.500,00" → 3500.
function parsearMonto(texto: string): number {
  const s = texto.trim()
  if (!s) return 0
  const tieneC = s.includes(',')
  const tieneP = s.includes('.')
  if (tieneC && tieneP) {
    return s.lastIndexOf(',') > s.lastIndexOf('.')
      ? Number(s.replace(/\./g, '').replace(',', '.'))
      : Number(s.replace(/,/g, ''))
  }
  if (tieneC) {
    const partes = s.split(',')
    return partes.length > 2 || partes[partes.length - 1].length === 3
      ? Number(s.replace(/,/g, ''))
      : Number(s.replace(',', '.'))
  }
  if (tieneP) {
    const partes = s.split('.')
    return partes.length > 2 || partes[partes.length - 1].length === 3
      ? Number(s.replace(/\./g, ''))
      : Number(s)
  }
  return Number(s)
}

const inputBase =
  'rounded-lg border border-border-strong px-3 py-2 text-sm text-text-primary ' +
  'focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-action-primary'
const inputCls = 'w-full ' + inputBase
const labelCls = 'block text-xs font-display font-medium text-text-secondary mb-1'

type FilaConcepto = { concepto: string; montoTexto: string }

export default function RevisionForm({ initialForm, advertencias, archivo }: Props) {
  const router = useRouter()
  const [base, setBase] = useState<Omit<FormState, 'conceptos'>>({
    tipo: initialForm.tipo,
    importador: initialForm.importador,
    vehiculo: initialForm.vehiculo,
    contenedor: initialForm.contenedor,
    vencimiento_parqueo: initialForm.vencimiento_parqueo,
  })
  const [filas, setFilas] = useState<FilaConcepto[]>(
    initialForm.conceptos.length > 0
      ? initialForm.conceptos.map((c) => ({
          concepto: c.concepto,
          montoTexto: c.monto ? String(c.monto) : '',
        }))
      : [{ concepto: '', montoTexto: '' }],
  )
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const form: FormState = useMemo(
    () => ({
      ...base,
      conceptos: filas.map((f) => ({
        concepto: f.concepto.trim(),
        monto: parsearMonto(f.montoTexto),
      })),
    }),
    [base, filas],
  )
  const data = useMemo(() => armarData(form), [form])
  const total = calcularTotal(form.conceptos)
  const err = (k: string) => errores[k]

  function setImportador(campo: 'nombre' | 'rnc', valor: string) {
    setBase((b) => ({ ...b, importador: { ...b.importador, [campo]: valor } }))
  }
  function setVehiculo(campo: keyof FormState['vehiculo'], valor: string) {
    setBase((b) => ({ ...b, vehiculo: { ...b.vehiculo, [campo]: valor } }))
  }
  function setContenedor(campo: keyof FormState['contenedor'], valor: string) {
    setBase((b) => ({ ...b, contenedor: { ...b.contenedor, [campo]: valor } }))
  }
  function setFila(i: number, campo: keyof FilaConcepto, valor: string) {
    setFilas((fs) => fs.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)))
  }
  function eliminarFila(i: number) {
    setFilas((fs) => fs.filter((_, idx) => idx !== i))
  }
  function agregarFila() {
    setFilas((fs) => [...fs, { concepto: '', montoTexto: '' }])
  }

  function handleConfirmar() {
    setMensaje(null)
    const errs = validar(form)
    setErrores(errs)
    if (Object.keys(errs).length > 0) {
      setMensaje('Revisa los campos marcados antes de importar.')
      return
    }
    start(async () => {
      const res = await importarHistorico(form, archivo)
      if (!res.ok) {
        if ('errores' in res) {
          setErrores(res.errores)
          setMensaje('Revisa los campos marcados antes de importar.')
        } else {
          setMensaje(res.error)
        }
        return
      }
      router.push(`/documentos/${res.id}`)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ---- Formulario de revisión ---- */}
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
          <p className="text-sm text-text-secondary">
            Archivo: <span className="font-medium text-text-primary">{archivo}</span>
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Se importará como <span className="font-medium">histórico</span> en estado{' '}
            <span className="font-medium">Aprobada</span>. Revisa y corrige los datos antes de confirmar.
          </p>
        </div>

        {/* Advertencias del parser */}
        {advertencias.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <AlertTriangle size={15} /> Revisa estos puntos
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-amber-900">
              {advertencias.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo de documento</label>
          <div className="flex gap-2">
            {(['vehiculo', 'contenedor'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBase((b) => ({ ...b, tipo: t }))}
                className={
                  'rounded-lg border px-3 py-1.5 text-sm font-display transition ' +
                  (base.tipo === t
                    ? 'border-action-primary bg-brand-electrico-50 text-brand-electrico-800 font-medium'
                    : 'border-border bg-surface-raised text-text-secondary hover:bg-surface-hover')
                }
              >
                {t === 'vehiculo' ? 'Vehículo' : 'Contenedor'}
              </button>
            ))}
          </div>
        </div>

        {/* Importador */}
        <fieldset className="space-y-3">
          <legend className="font-display text-sm font-semibold text-text-primary">Importador</legend>
          <div>
            <label className={labelCls}>Nombre / razón social</label>
            <input className={inputCls} value={base.importador.nombre} onChange={(e) => setImportador('nombre', e.target.value)} />
            {err('importador.nombre') && <p className="mt-1 text-xs text-red-600">{err('importador.nombre')}</p>}
          </div>
          <div>
            <label className={labelCls}>RNC</label>
            <input className={inputCls} value={base.importador.rnc} onChange={(e) => setImportador('rnc', e.target.value)} />
            {err('importador.rnc') && <p className="mt-1 text-xs text-red-600">{err('importador.rnc')}</p>}
          </div>
        </fieldset>

        {/* Datos por tipo */}
        {base.tipo === 'vehiculo' ? (
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="font-display text-sm font-semibold text-text-primary sm:col-span-2">Datos del vehículo</legend>
            <div>
              <label className={labelCls}>Marca</label>
              <input className={inputCls} value={base.vehiculo.marca} onChange={(e) => setVehiculo('marca', e.target.value)} />
              {err('vehiculo.marca') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.marca')}</p>}
            </div>
            <div>
              <label className={labelCls}>Modelo</label>
              <input className={inputCls} value={base.vehiculo.modelo} onChange={(e) => setVehiculo('modelo', e.target.value)} />
              {err('vehiculo.modelo') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.modelo')}</p>}
            </div>
            <div>
              <label className={labelCls}>Año</label>
              <input className={inputCls} inputMode="numeric" value={base.vehiculo.anio} onChange={(e) => setVehiculo('anio', e.target.value)} />
              {err('vehiculo.anio') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.anio')}</p>}
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input className={inputCls} value={base.vehiculo.color} onChange={(e) => setVehiculo('color', e.target.value)} />
              <p className="mt-1 text-[11px] text-gray-400">No aparece en el PDF</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Chasis</label>
              <input className={inputCls} value={base.vehiculo.chasis} onChange={(e) => setVehiculo('chasis', e.target.value)} />
              {err('vehiculo.chasis') && <p className="mt-1 text-xs text-red-600">{err('vehiculo.chasis')}</p>}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-3">
            <legend className="font-display text-sm font-semibold text-text-primary">Datos del contenedor</legend>
            <div>
              <label className={labelCls}>Número de BL</label>
              <input className={inputCls} value={base.contenedor.bl} onChange={(e) => setContenedor('bl', e.target.value)} />
              {err('contenedor.bl') && <p className="mt-1 text-xs text-red-600">{err('contenedor.bl')}</p>}
            </div>
            <div>
              <label className={labelCls}>Número de contenedor</label>
              <input className={inputCls} value={base.contenedor.numero_contenedor} onChange={(e) => setContenedor('numero_contenedor', e.target.value)} />
              {err('contenedor.numero_contenedor') && <p className="mt-1 text-xs text-red-600">{err('contenedor.numero_contenedor')}</p>}
            </div>
          </fieldset>
        )}

        {/* Vencimiento */}
        <div>
          <label className={labelCls}>Fecha de vencimiento de parqueo</label>
          <input
            type="date"
            lang="es-DO"
            className={inputCls}
            value={base.vencimiento_parqueo}
            onChange={(e) => setBase((b) => ({ ...b, vencimiento_parqueo: e.target.value }))}
          />
          {err('vencimiento_parqueo') && <p className="mt-1 text-xs text-red-600">{err('vencimiento_parqueo')}</p>}
        </div>

        {/* Conceptos */}
        <fieldset className="space-y-2">
          <legend className="font-display text-sm font-semibold text-text-primary">Conceptos</legend>
          <ul className="space-y-2">
            {filas.map((f, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <input
                  className={inputBase + ' w-full min-w-0 sm:flex-1'}
                  placeholder="Nombre del concepto"
                  value={f.concepto}
                  onChange={(e) => setFila(i, 'concepto', e.target.value)}
                />
                <input
                  className={inputBase + ' min-w-0 flex-1 sm:w-32 sm:flex-none'}
                  inputMode="decimal"
                  placeholder="Monto"
                  value={f.montoTexto}
                  onChange={(e) => setFila(i, 'montoTexto', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => eliminarFila(i)}
                  className="text-text-tertiary hover:text-status-vencida-dot transition-colors"
                  aria-label="Eliminar concepto"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={agregarFila}
              className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-display font-medium text-text-secondary transition hover:bg-surface-hover"
            >
              + Agregar concepto
            </button>
            <span className="font-display text-sm font-semibold text-text-primary">
              Total: {formatoMoneda(total)}
            </span>
          </div>
          {err('conceptos') && <p className="text-xs text-red-600">{err('conceptos')}</p>}
        </fieldset>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={pending}
            className="w-full rounded-lg bg-action-primary px-4 py-2 text-sm font-display font-semibold text-white transition hover:bg-action-primary-hover disabled:opacity-60 sm:w-auto"
          >
            {pending ? 'Importando…' : 'Confirmar importación'}
          </button>
          <Link
            href="/historial"
            className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2 text-center text-sm font-display font-semibold text-text-secondary transition hover:bg-surface-hover sm:w-auto"
          >
            Cancelar
          </Link>
          {mensaje && <span className="text-sm text-red-600">{mensaje}</span>}
        </div>
      </div>

      {/* ---- Preview ---- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-text-tertiary">Vista previa</p>
        <DocumentoPreview data={data} />
      </div>
    </div>
  )
}
