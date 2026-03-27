'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'

interface FiltroFechasProps {
  onBuscar: (desde: string, hasta: string) => void
  cargando?: boolean
}

const atajos = [
  { label: 'Hoy', dias: 0 },
  { label: 'Esta semana', dias: 7 },
  { label: 'Este mes', dias: 30 },
  { label: 'Último trimestre', dias: 90 },
]

export function FiltroFechas({ onBuscar, cargando }: FiltroFechasProps) {
  const hoy = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [desde, setDesde] = useState(inicioMes)
  const [hasta, setHasta] = useState(hoy)

  function aplicarAtajo(dias: number) {
    const h = new Date().toISOString().split('T')[0]
    if (dias === 0) {
      setDesde(h)
      setHasta(h)
      onBuscar(h, h)
    } else {
      const d = new Date()
      d.setDate(d.getDate() - dias)
      const desde = d.toISOString().split('T')[0]
      setDesde(desde)
      setHasta(h)
      onBuscar(desde, h)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Desde</Label>
          <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Hasta</Label>
          <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
        </div>
        <Button onClick={() => onBuscar(desde, hasta)} disabled={cargando} className="gap-2">
          <Calendar className="w-4 h-4" />
          {cargando ? 'Cargando...' : 'Buscar'}
        </Button>
        <div className="flex gap-2 flex-wrap">
          {atajos.map(a => (
            <Button key={a.label} variant="outline" size="sm" onClick={() => aplicarAtajo(a.dias)}
              className="text-xs h-8">
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
