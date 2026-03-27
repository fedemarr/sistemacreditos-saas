'use client'

import { useState, useTransition, useEffect } from 'react'
import { registrarPagoAction } from '@/lib/actions/pagos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, diasAtraso } from '@/lib/utils/formatters'
import { AlertTriangle, Loader2, DollarSign, CheckCircle2 } from 'lucide-react'

interface RegistrarPagoProps {
  open: boolean
  onClose: () => void
  cuota: {
    id: string
    credito_id: string
    cliente_id: string
    numero_cuota: number
    fecha_vencimiento: string
    capital: number
    interes: number
    iva: number
    importe_total: number
    saldo_pendiente: number
    punitorio_teorico_calculado: number
    total_a_cobrar: number
    estado: string
  }
}

const mediosPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'debito', label: 'Débito' },
  { value: 'retencion_haberes', label: 'Retención haberes' },
  { value: 'otro', label: 'Otro' },
]

export function RegistrarPago({ open, onClose, cuota }: RegistrarPagoProps) {
  const [isPending, startTransition] = useTransition()
  const [monto, setMonto] = useState(cuota.total_a_cobrar.toString())
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observaciones, setObservaciones] = useState('')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { setMonto(cuota.total_a_cobrar.toString()) }, [cuota.total_a_cobrar])

  const montoNum = parseFloat(monto) || 0
  const esPagoTotal = montoNum >= cuota.total_a_cobrar
  const atraso = diasAtraso(cuota.fecha_vencimiento)

  function handleSubmit() {
    if (montoNum <= 0) { toast.error('El monto debe ser mayor a 0'); return }
    startTransition(async () => {
      const result = await registrarPagoAction({
        cuota_id: cuota.id, credito_id: cuota.credito_id, cliente_id: cuota.cliente_id,
        monto_pagado: montoNum, medio_pago: medioPago,
        fecha_pago: fechaPago, observaciones: observaciones || undefined,
      })
      if (result?.error) { toast.error(result.error); return }
      toast.success(esPagoTotal ? `Cuota ${cuota.numero_cuota} pagada` : 'Pago parcial registrado')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Registrar Pago — Cuota {cuota.numero_cuota}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Vencimiento</span>
              <span className="font-medium">{formatFecha(cuota.fecha_vencimiento)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Capital</span>
              <span>{formatMoneda(cuota.capital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Interés</span>
              <span>{formatMoneda(cuota.interes)}</span>
            </div>
            {cuota.iva > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">IVA</span>
                <span>{formatMoneda(cuota.iva)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="text-slate-500">Saldo pendiente</span>
              <span className="font-semibold">{formatMoneda(cuota.saldo_pendiente)}</span>
            </div>
            {cuota.punitorio_teorico_calculado > 0 && (
              <div className="flex justify-between bg-red-50 dark:bg-red-950/20 rounded p-2">
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Punitorio ({atraso}d)
                </span>
                <span className="text-red-600 font-semibold">{formatMoneda(cuota.punitorio_teorico_calculado)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="font-semibold">Total a cobrar</span>
              <span className="font-bold text-lg">{formatMoneda(cuota.total_a_cobrar)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Monto a cobrar *</Label>
                <button type="button" onClick={() => setMonto(cuota.total_a_cobrar.toString())}
                  className="text-xs text-blue-600 hover:underline">Cobrar total</button>
              </div>
              <Input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} />
              {montoNum > 0 && (
                <p className={`text-xs flex items-center gap-1 ${esPagoTotal ? 'text-green-600' : 'text-amber-600'}`}>
                  {esPagoTotal
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Pago total — cuota quedará pagada</>
                    : <><AlertTriangle className="w-3.5 h-3.5" /> Pago parcial — saldo: {formatMoneda(cuota.saldo_pendiente - montoNum)}</>
                  }
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Medio de pago *</Label>
              <Select defaultValue="efectivo" onValueChange={setMedioPago}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mediosPago.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de pago</Label>
              <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional..." rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || montoNum <= 0} className="gap-2 bg-green-600 hover:bg-green-500">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : <><DollarSign className="w-4 h-4" /> Registrar pago</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
