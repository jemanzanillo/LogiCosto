'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  formStateVacio,
  type DocumentoTipo,
  type FormState,
  type Importador,
} from '@/lib/documentos/types'
import CapturaForm from '@/lib/components/captura-form'
import EncabezadoFlujo, { type PasoFlujo } from './encabezado-flujo'
import PasoTipo from './paso-tipo'
import PasoOrigen, { type FacturaPrevia } from './paso-origen'

// Orquesta el flujo de Nueva factura: Tipo → Origen → Datos. El paso Datos
// reutiliza CapturaForm sembrado con el FormState resultante.
export default function NuevaFacturaWizard({
  recientes,
  permisos,
  importadores,
  conceptosFrecuentes,
}: {
  recientes: FacturaPrevia[]
  permisos: string[]
  importadores: Importador[]
  conceptosFrecuentes: string[]
}) {
  const router = useRouter()
  const [paso, setPaso] = useState<PasoFlujo>('tipo')
  const [tipo, setTipo] = useState<DocumentoTipo>('vehiculo')
  const [form, setForm] = useState<FormState | null>(null)

  function elegirTipo(t: DocumentoTipo) {
    setTipo(t)
    setPaso('origen')
  }

  function empezarNueva() {
    const f = formStateVacio()
    f.tipo = tipo
    setForm(f)
    setPaso('datos')
  }

  function empezarDesde(f: FormState) {
    setForm(f)
    setPaso('datos')
  }

  function atras() {
    if (paso === 'datos') setPaso('origen')
    else if (paso === 'origen') setPaso('tipo')
    else router.push('/dashboard')
  }

  return (
    <div className="space-y-8">
      <EncabezadoFlujo paso={paso} onBack={atras} />

      {paso === 'tipo' && <PasoTipo onElegir={elegirTipo} />}

      {paso === 'origen' && (
        <PasoOrigen
          tipo={tipo}
          recientes={recientes}
          onNueva={empezarNueva}
          onDesde={empezarDesde}
        />
      )}

      {paso === 'datos' && form && (
        <CapturaForm
          key={tipo}
          initialForm={form}
          permisos={permisos}
          importadores={importadores}
          conceptosFrecuentes={conceptosFrecuentes}
        />
      )}
    </div>
  )
}
