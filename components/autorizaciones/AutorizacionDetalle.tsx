'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resolverAutorizacionAction } from '@/lib/actions/autorizaciones'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { ArrowLeft, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react'

interface AutorizacionDetalleProps {
  autorizacion: Record<string, any>
  esAdmin: boolean
}

export function AutorizacionDetalle({ autorizacion: a, esAdmin }: AutorizacionDetalleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [confirmando, setConfirmando] = useState<'otorgar' | 'rechazar' | null>(null)

  const cliente = a.clientes
  const comercio = a.comercios
  const puedeResolver = esAdmin && a.estado === 'pendiente'

  function resolver(estado: 'otorgada' | 'rechazada') {
    if (estado === 'rechazada' && !motivoRechazo.trim()) {
      toast.error('Ingresá el motivo del rechazo')
      return
    }
    startTransition(async () => {
      const result = await resolverAutorizacionAction(a.id, {
        estado,
        motivo_rechazo: estado === 'rechazada' ? motivoRechazo : undefined,
      })
      if (result?.error) toast.error(result.error)
      else toast.success(estado === 'otorgada' ? 'Autorización otorgada' : 'Autorización rechazada')
      setConfirmando(null)
    })
  }

  return (
    <div>
      <PageHeader
        titulo={`Autorización #${a.numero_autorizacion}`}
        descripcion={`Creada el ${formatFecha(a.created_at)}`}
        acciones={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/autorizaciones')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
            {a.estado === 'otorgada' && (
              <Button
                onClick={() => router.push(`/solicitudes/nueva?autorizacion_id=${a.id}`)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Crear solicitud
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Estado y datos principales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Estado</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Estado actual</span>
              <StatusBadge estado={a.estado} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Capital pedido</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatMoneda(a.capital_pedido)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Límite disponible</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatMoneda(a.saldo_a_autorizar ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Saldo cta. cte.</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatMoneda(a.saldo_cuenta_corriente)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Autorizaciones pendientes</span>
              <span className="font-semibold text-slate-900 dark:text-white">{a.autorizaciones_pendientes}</span>
            </div>
            {a.motivo_rechazo && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 mt-2">
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong>Motivo de rechazo:</strong> {a.motivo_rechazo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Cliente</h3>
          {cliente ? (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">
                  {cliente.apellido}, {cliente.nombre}
                </p>
                <p className="text-sm text-slate-500">
                  {cliente.tipo_documento?.toUpperCase()} {formatDNI(cliente.numero_documento)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-xs text-slate-500">Ingreso al momento</p>
                  <p className="text-sm font-medium">{formatMoneda(a.ingreso_mensual_snapshot ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Límite al momento</p>
                  <p className="text-sm font-medium">{formatMoneda(a.limite_credito_snapshot ?? 0)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/clientes/${cliente.id}`)}
                className="w-full mt-2"
              >
                Ver ficha del cliente
              </Button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Sin datos del cliente</p>
          )}
        </div>

        {/* Comercio */}
        {comercio && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Comercio</h3>
            <p className="font-semibold text-slate-900 dark:text-white">{comercio.nombre}</p>
            <p className="text-sm text-slate-500">Código: {comercio.codigo}</p>
            {comercio.telefono && <p className="text-sm text-slate-500">Tel: {comercio.telefono}</p>}
          </div>
        )}

        {/* Observaciones */}
        {a.observaciones && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Observaciones</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{a.observaciones}</p>
          </div>
        )}
      </div>

      {/* Panel de resolución — solo admin, solo pendiente */}
      {puedeResolver && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Resolver Autorización
          </h3>

          {confirmando === 'rechazar' && (
            <div className="mb-4 space-y-2">
              <Label>Motivo del rechazo *</Label>
              <Textarea
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="Explicá el motivo del rechazo..."
                rows={2}
              />
            </div>
          )}

          <div className="flex gap-3">
            {confirmando === null && (
              <>
                <Button
                  onClick={() => setConfirmando('otorgar')}
                  className="gap-2 bg-green-600 hover:bg-green-500"
                >
                  <CheckCircle2 className="w-4 h-4" /> Otorgar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmando('rechazar')}
                  className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </Button>
              </>
            )}

            {confirmando === 'otorgar' && (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400 self-center mr-2">
                  ¿Confirmás otorgar esta autorización?
                </p>
                <Button onClick={() => resolver('otorgada')} disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-500">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar
                </Button>
                <Button variant="outline" onClick={() => setConfirmando(null)}>Cancelar</Button>
              </>
            )}

            {confirmando === 'rechazar' && (
              <>
                <Button onClick={() => resolver('rechazada')} disabled={isPending} variant="destructive" className="gap-2">
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
