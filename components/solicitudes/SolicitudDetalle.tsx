'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarSolicitudAction, rechazarSolicitudAction } from '@/lib/actions/solicitudes'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, formatDNI, formatPorcentaje } from '@/lib/utils/formatters'
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface SolicitudDetalleProps {
  solicitud: Record<string, any>
  esAdmin: boolean
}

export function SolicitudDetalle({ solicitud: s, esAdmin }: SolicitudDetalleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmando, setConfirmando] = useState<'aprobar' | 'rechazar' | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const cliente = s.clientes
  const plan = s.planes_credito
  const comercio = s.comercios
  const puedeResolver = esAdmin && (s.estado === 'activada' || s.estado === 'pendiente')

  function handleAprobar() {
    startTransition(async () => {
      const result = await aprobarSolicitudAction(s.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Solicitud aprobada — crédito generado')
    })
  }

  function handleRechazar() {
    if (!motivoRechazo.trim()) { toast.error('Ingresá el motivo del rechazo'); return }
    startTransition(async () => {
      const result = await rechazarSolicitudAction(s.id, {
        estado: 'rechazada',
        motivo_rechazo: motivoRechazo,
      })
      if (result?.error) toast.error(result.error)
      else { toast.success('Solicitud rechazada'); setConfirmando(null) }
    })
  }

  return (
    <div>
      <PageHeader
        titulo={`Solicitud de Crédito`}
        descripcion={`Creada el ${formatFecha(s.created_at)}`}
        acciones={
          <Button variant="outline" onClick={() => router.push('/solicitudes')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Estado */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Estado</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Estado</span>
              <StatusBadge estado={s.estado} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Capital pedido</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatMoneda(s.capital_pedido)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Cuotas</span>
              <span className="font-semibold">{s.cantidad_cuotas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tasa anual</span>
              <span className="font-semibold">{formatPorcentaje(s.tasa_anual)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">1° vencimiento</span>
              <span className="font-semibold">{s.fecha_primer_vencimiento ? formatFecha(s.fecha_primer_vencimiento) : '—'}</span>
            </div>
            {s.gastos > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Gastos</span>
                <span className="font-semibold">{formatMoneda(s.gastos)}</span>
              </div>
            )}
            {s.motivo_rechazo && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 mt-2">
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong>Rechazo:</strong> {s.motivo_rechazo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Cliente</h3>
          {cliente ? (
            <div className="space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white text-base">
                {cliente.apellido}, {cliente.nombre}
              </p>
              <p className="text-sm text-slate-500">
                {cliente.tipo_documento?.toUpperCase()} {formatDNI(cliente.numero_documento)}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-xs text-slate-500">Ingreso</p>
                  <p className="text-sm font-medium">{formatMoneda(cliente.ingreso_mensual)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Límite crédito</p>
                  <p className="text-sm font-medium">{formatMoneda(cliente.limite_credito)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/clientes/${cliente.id}`)} className="w-full mt-2">
                Ver ficha del cliente
              </Button>
            </div>
          ) : <p className="text-slate-400 text-sm">Sin datos</p>}
        </div>

        {/* Plan */}
        {plan && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Plan</h3>
            <p className="font-semibold text-slate-900 dark:text-white">{plan.codigo} — {plan.descripcion}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><p className="text-xs text-slate-500">Cuotas</p><p className="text-sm font-medium">{plan.cantidad_cuotas}</p></div>
              <div><p className="text-xs text-slate-500">Tasa</p><p className="text-sm font-medium">{formatPorcentaje(plan.tasa_anual)}</p></div>
              <div><p className="text-xs text-slate-500">Sistema</p><p className="text-sm font-medium capitalize">{plan.sistema_amortizacion}</p></div>
            </div>
            <div className="flex gap-3 mt-3">
              {s.cuota_retenida && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Retenida</span>}
              {s.es_plan_dni && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Plan DNI</span>}
              {s.avalada && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Avalada</span>}
            </div>
          </div>
        )}

        {/* Comercio */}
        {comercio && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Comercio</h3>
            <p className="font-semibold text-slate-900 dark:text-white">{comercio.nombre}</p>
            <p className="text-sm text-slate-500">Código: {comercio.codigo}</p>
            {s.vendedores && (
              <p className="text-sm text-slate-500 mt-1">
                Vendedor: {s.vendedores.nombre} {s.vendedores.apellido}
              </p>
            )}
          </div>
        )}

        {/* Observaciones */}
        {s.observaciones && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Observaciones</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{s.observaciones}</p>
          </div>
        )}
      </div>

      {/* Panel de resolución */}
      {puedeResolver && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Resolver Solicitud
          </h3>

          {confirmando === 'rechazar' && (
            <div className="mb-4 space-y-2">
              <Label>Motivo del rechazo *</Label>
              <Textarea
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="Ingresá el motivo del rechazo..."
                rows={2}
              />
            </div>
          )}

          {confirmando === 'aprobar' && (
            <div className="mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                ¿Confirmás aprobar esta solicitud?
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                Se va a generar automáticamente el crédito con {s.cantidad_cuotas} cuotas por {formatMoneda(s.capital_pedido)}.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {confirmando === null && (
              <>
                <Button onClick={() => setConfirmando('aprobar')} className="gap-2 bg-green-600 hover:bg-green-500">
                  <CheckCircle2 className="w-4 h-4" /> Aprobar y generar crédito
                </Button>
                <Button variant="outline" onClick={() => setConfirmando('rechazar')} className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                  <XCircle className="w-4 h-4" /> Rechazar
                </Button>
              </>
            )}

            {confirmando === 'aprobar' && (
              <>
                <Button onClick={handleAprobar} disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-500">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar aprobación
                </Button>
                <Button variant="outline" onClick={() => setConfirmando(null)}>Cancelar</Button>
              </>
            )}

            {confirmando === 'rechazar' && (
              <>
                <Button onClick={handleRechazar} disabled={isPending} variant="destructive" className="gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirmar rechazo
                </Button>
                <Button variant="outline" onClick={() => setConfirmando(null)}>Cancelar</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
