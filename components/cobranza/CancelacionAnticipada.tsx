'use client'

import { useState, useTransition, useEffect } from 'react'
import { calcularCancelacionAction, ejecutarCancelacionAnticipadaAction } from '@/lib/actions/pagos'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatMoneda } from '@/lib/utils/formatters'
import { Loader2, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react'

interface CancelacionAnticipadaProps {
  open: boolean
  onClose: () => void
  creditoId: string
  clienteId: string
  numeroCredito: number
}

export function CancelacionAnticipada({ open, onClose, creditoId, clienteId, numeroCredito }: CancelacionAnticipadaProps) {
  const [isPending, startTransition] = useTransition()
  const [cargando, setCargando] = useState(false)
  const [calculo, setCalculo] = useState<any>(null)
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observaciones, setObservaciones] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    if (open) {
      setCargando(true)
      calcularCancelacionAction(creditoId).then(r => {
        if (r?.calculo) setCalculo(r.calculo)
        else toast.error(r?.error ?? 'Error al calcular')
        setCargando(false)
      })
    } else {
      setCalculo(null)
      setConfirmado(false)
    }
  }, [open, creditoId])

  function handleConfirmar() {
    if (!confirmado) { setConfirmado(true); return }
    startTransition(async () => {
      const result = await ejecutarCancelacionAnticipadaAction({
        credito_id: creditoId, cliente_id: clienteId, medio_pago: medioPago,
        observaciones: observaciones || `Cancelación anticipada crédito #${numeroCredito}`,
      })
      if (result?.error) { toast.error(result.error); return }
      toast.success(`Crédito #${numeroCredito} cancelado anticipadamente`)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Cancelación Anticipada — Crédito #{numeroCredito}
          </DialogTitle>
        </DialogHeader>

        {cargando ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Calculando...
          </div>
        ) : calculo ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3 text-sm">
              {calculo.total_vencido > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">Cuotas vencidas (con punitorio)</span>
                  <span className="text-red-600 font-medium">{formatMoneda(calculo.total_vencido)}</span>
                </div>
              )}
              {calculo.total_capital_futuro > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Capital cuotas futuras</span>
                  <span className="font-medium">{formatMoneda(calculo.total_capital_futuro)}</span>
                </div>
              )}
              {calculo.ahorro_intereses > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Ahorro en intereses</span>
                  <span className="text-green-600 font-medium">− {formatMoneda(calculo.ahorro_intereses)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="font-bold text-base">Total a pagar</span>
                <span className="font-bold text-xl text-blue-600">{formatMoneda(calculo.total_a_pagar)}</span>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-500">Cuota</th>
                    <th className="text-left px-3 py-2 text-slate-500">Tipo</th>
                    <th className="text-right px-3 py-2 text-slate-500">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {calculo.detalle.map((d: any) => (
                    <tr key={d.cuota_id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-3 py-1.5">#{d.numero_cuota}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded ${d.tipo === 'vencida' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {d.tipo === 'vencida' ? 'Vencida' : 'Futura'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium">{formatMoneda(d.monto_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Medio de pago *</Label>
                <Select defaultValue="efectivo" onValueChange={setMedioPago}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['efectivo', 'transferencia', 'cheque', 'debito', 'otro'].map(m => (
                      <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional..." rows={2} />
              </div>
            </div>

            {confirmado && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p><strong>¿Confirmás la cancelación por {formatMoneda(calculo.total_a_pagar)}?</strong></p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          {calculo && (
            <Button onClick={handleConfirmar} disabled={isPending || cargando}
              className={`gap-2 ${confirmado ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                : confirmado
                ? <><CheckCircle2 className="w-4 h-4" /> Confirmar</>
                : `Cancelar por ${formatMoneda(calculo.total_a_pagar)}`
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
