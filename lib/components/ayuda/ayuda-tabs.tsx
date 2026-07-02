'use client'

import { useState, type ReactNode } from 'react'
import { LifeBuoy, Inbox } from 'lucide-react'

type Props = {
  centro: ReactNode
  solicitudes: ReactNode
  totalSolicitudes: number
}

export default function AyudaTabs({ centro, solicitudes, totalSolicitudes }: Props) {
  const [tab, setTab] = useState<'centro' | 'solicitudes'>('centro')

  const btn = (activo: boolean) =>
    'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ' +
    (activo
      ? 'border-action-primary text-action-primary'
      : 'border-transparent text-text-secondary hover:text-text-primary')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 border-b border-border">
        <button className={btn(tab === 'centro')} onClick={() => setTab('centro')}>
          <LifeBuoy size={16} /> Centro de ayuda
        </button>
        <button className={btn(tab === 'solicitudes')} onClick={() => setTab('solicitudes')}>
          <Inbox size={16} /> Mis solicitudes
          {totalSolicitudes > 0 && (
            <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">
              {totalSolicitudes}
            </span>
          )}
        </button>
      </div>

      <div className={tab === 'centro' ? '' : 'hidden'}>{centro}</div>
      <div className={tab === 'solicitudes' ? '' : 'hidden'}>{solicitudes}</div>
    </div>
  )
}
