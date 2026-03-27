'use client'

import { useState, useTransition } from 'react'
import { anularPagoAction } from '@/lib/actions/pagos'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatMoneda, formatFecha } from '@/lib/utils/formatters'
import { AlertTriangle, Loader2, XCircle } from 'lucide-react'

interface AnularPagoProps {
  open: boolean
  onClose: () => void
  pago: { id: string; fecha_pago: string; monto_pagado: number; medio_pago: string; tipo_pago: string }
}

export function AnularPago({ open, onClose, pago }: AnularPagoProps) {
  const [isPending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')

  function handleSubmit() {
    if (!motivo.trim()) { toast.error('El motivo es obligatorio'); return }
    startTransition(async () => {
      const result = await anularPagoAction({
        pago_id: pago.id, motivo: motivo.trim(), observaciones: observaciones.trim() || undefined,
      })
      if (result?.error) { toast.error(result.error); return }
      toast.success('Pago anulado correctamente')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" /> Anular Pago
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <p className="font-semibold mb-1">Esta acción es irreversible.</p>
                <p>Se revertirá el efecto del pago en la cuota y en la caja.</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha</span>
              <span className="font-medium">{formatFecha(pago.fecha_pago)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monto</span>
              <span className="font-semibold">{formatMoneda(pago.monto_pagado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medio</span>
              <span className="capitalize">{pago.medio_pago}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Error en el monto registrado..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional..." rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !motivo.trim()} variant="destructive" className="gap-2">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Anulando...</> : <><XCircle className="w-4 h-4" /> Confirmar anulación</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
