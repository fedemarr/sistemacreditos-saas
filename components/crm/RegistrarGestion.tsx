'use client'

import { useState, useTransition } from 'react'
import { registrarGestionAction } from '@/lib/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, ClipboardList } from 'lucide-react'

interface RegistrarGestionProps {
  open: boolean
  onClose: () => void
  creditoId: string
  clienteId: string
  numeroCredito: number
  clienteNombre: string
}

const tiposGestion = [
  { value: 'llamado', label: '📞 Llamado telefónico' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'visita', label: '🚪 Visita domiciliaria' },
  { value: 'email', label: '📧 Email' },
  { value: 'carta', label: '📄 Carta / Notificación' },
  { value: 'convenio', label: '🤝 Convenio de pago' },
  { value: 'otro', label: 'Otro' },
]

const resultados = [
  { value: 'contactado', label: '✅ Contactado' },
  { value: 'sin_respuesta', label: '📵 Sin respuesta' },
  { value: 'numero_incorrecto', label: '❌ Número incorrecto' },
  { value: 'promesa_pago', label: '🗓️ Promesa de pago' },
  { value: 'rechazo', label: '🚫 Se negó a pagar' },
  { value: 'pago_recibido', label: '💰 Pagó en el momento' },
  { value: 'convenio_acordado', label: '🤝 Convenio acordado' },
  { value: 'otro', label: 'Otro' },
]

export function RegistrarGestion({
  open, onClose, creditoId, clienteId, numeroCredito, clienteNombre,
}: RegistrarGestionProps) {
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo] = useState('llamado')
  const [resultado, setResultado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [promesaFecha, setPromesaFecha] = useState('')
  const [promesaMonto, setPromesaMonto] = useState('')

  const esPromesa = resultado === 'promesa_pago'

  function handleClose() {
    setTipo('llamado')
    setResultado('')
    setObservaciones('')
    setPromesaFecha('')
    setPromesaMonto('')
    onClose()
  }

  function handleSubmit() {
    if (!resultado) { toast.error('Seleccioná el resultado de la gestión'); return }
    if (esPromesa && !promesaFecha) { toast.error('Ingresá la fecha de la promesa'); return }

    startTransition(async () => {
      const result = await registrarGestionAction({
        credito_id: creditoId,
        cliente_id: clienteId,
        tipo,
        resultado,
        observaciones: observaciones || undefined,
        promesa_fecha: esPromesa ? promesaFecha : undefined,
        promesa_monto: esPromesa && promesaMonto ? parseFloat(promesaMonto) : undefined,
      })
      if (result?.error) { toast.error(result.error); return }
      toast.success('Gestión registrada correctamente')
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Registrar Gestión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info del crédito */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">{clienteNombre}</p>
            <p className="text-slate-500">Crédito #{numeroCredito}</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo de gestión *</Label>
              <Select defaultValue="llamado" onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposGestion.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Select onValueChange={setResultado}>
                <SelectTrigger><SelectValue placeholder="¿Cómo resultó?" /></SelectTrigger>
                <SelectContent>
                  {resultados.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos de promesa de pago */}
            {esPromesa && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Datos de la promesa</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha prometida *</Label>
                    <Input
                      type="date"
                      value={promesaFecha}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setPromesaFecha(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monto prometido ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={promesaMonto}
                      onChange={e => setPromesaMonto(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Detalle de la gestión..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !resultado} className="gap-2">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
              : <><ClipboardList className="w-4 h-4" /> Registrar gestión</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
