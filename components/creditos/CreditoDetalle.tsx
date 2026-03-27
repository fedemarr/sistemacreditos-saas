'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { actualizarCuotasVencidasAction, cancelarCreditoAction } from '@/lib/actions/creditos'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, formatPorcentaje, formatDNI, diasAtraso } from '@/lib/utils/formatters'
import { ArrowLeft, CreditCard, DollarSign, AlertTriangle, CheckCircle2, Clock, RefreshCw, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  credito: Record<string, any>
  cuotas: Record<string, any>[]
  garantes: Record<string, any>[]
  stats: {
    totalPagado: number
    saldoPendiente: number
    cuotasVencidas: number
    cuotasPagadas: number
    proximaVencer: any
    totalCuotas: number
  }
  esAdmin: boolean
}

function colorFila(estado: string) {
  if (estado === 'pagada') return 'bg-green-50/50 dark:bg-green-950/10'
  if (estado === 'vencida') return 'bg-red-50/50 dark:bg-red-950/10'
  if (estado === 'parcial') return 'bg-blue-50/50 dark:bg-blue-950/10'
  return ''
}

function Fila({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="text-xs text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-medium">{valor}</span>
    </div>
  )
}

export function CreditoDetalle({ credito: c, cuotas, garantes, stats, esAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const cliente = c.clientes
  const plan = c.planes_credito
  const pct = c.monto_total_financiado > 0
    ? Math.round((stats.totalPagado / c.monto_total_financiado) * 100)
    : 0

  function handleActualizar() {
    startTransition(async () => {
      const r = await actualizarCuotasVencidasAction(c.id)
      if (r?.error) toast.error(r.error)
      else toast.success('Cuotas vencidas actualizadas')
    })
  }

  function handleCancelar() {
    startTransition(async () => {
      const r = await cancelarCreditoAction(c.id)
      if (r?.error) toast.error(r.error)
      else toast.success('Crédito cancelado')
    })
  }

  return (
    <div>
      <PageHeader
        titulo={`Crédito #${c.numero_credito}`}
        descripcion={`Otorgado el ${formatFecha(c.fecha_otorgamiento)}`}
        acciones={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/creditos')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
            {esAdmin && c.estado !== 'cancelado' && (
              <>
                <Button variant="outline" size="sm" onClick={handleActualizar} disabled={isPending} className="gap-2">
                  <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
                  Actualizar vencidas
                </Button>
                <ConfirmDialog
                  trigger={<Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">Cancelar crédito</Button>}
                  titulo="¿Cancelar el crédito?"
                  descripcion="Solo podés cancelarlo si todas las cuotas están pagadas."
                  textoConfirmar="Sí, cancelar"
                  onConfirm={handleCancelar}
                />
              </>
            )}
          </div>
        }
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Capital otorgado', valor: formatMoneda(c.monto_otorgado), icono: CreditCard, color: 'text-blue-500' },
          { label: 'Total financiado', valor: formatMoneda(c.monto_total_financiado), icono: DollarSign, color: 'text-slate-500' },
          { label: 'Total cobrado', valor: formatMoneda(stats.totalPagado), icono: CheckCircle2, color: 'text-green-500' },
          { label: 'Saldo pendiente', valor: formatMoneda(stats.saldoPendiente), icono: AlertTriangle, color: 'text-amber-500' },
        ].map(({ label, valor, icono: Icono, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icono className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{valor}</p>
          </div>
        ))}
      </div>

      {/* Progreso */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <StatusBadge estado={c.estado} />
            <span className="text-sm text-slate-500">{stats.cuotasPagadas} de {stats.totalCuotas} cuotas pagadas</span>
            {stats.cuotasVencidas > 0 && (
              <span className="text-sm text-red-500 font-medium">· {stats.cuotasVencidas} vencida{stats.cuotasVencidas > 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="text-sm font-semibold">{pct}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {stats.proximaVencer && (
          <p className="text-xs text-slate-500 mt-2">
            <Clock className="w-3 h-3 inline mr-1" />
            Próxima: #{stats.proximaVencer.numero_cuota} — {formatFecha(stats.proximaVencer.fecha_vencimiento)} — {formatMoneda(stats.proximaVencer.total)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cuotas">
        <TabsList className="mb-6">
          <TabsTrigger value="cuotas" className="gap-2">
            <CreditCard className="w-4 h-4" /> Plan de pagos ({stats.totalCuotas})
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <DollarSign className="w-4 h-4" /> Información
          </TabsTrigger>
          {garantes.length > 0 && (
            <TabsTrigger value="garantes" className="gap-2">
              <Users className="w-4 h-4" /> Garantes ({garantes.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="cuotas">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Vencimiento</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Capital</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Interés</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Saldo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cuota: any) => {
                  const atraso = diasAtraso(cuota.fecha_vencimiento)
                  const pagosValidos = (cuota.pagos as any[])?.filter((p: any) => !p.anulado) ?? []
                  const ultimoPago = pagosValidos[pagosValidos.length - 1]
                  const esCobrable = ['pendiente', 'vencida', 'parcial'].includes(cuota.estado)
                  return (
                    <tr key={cuota.id} className={cn('border-t border-slate-100 dark:border-slate-800', colorFila(cuota.estado))}>
                      <td className="px-4 py-3 font-semibold">{cuota.numero_cuota}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatFecha(cuota.fecha_vencimiento)}
                        {atraso > 0 && <span className="ml-2 text-xs text-red-500 font-medium">+{atraso}d</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatMoneda(cuota.capital)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatMoneda(cuota.interes)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoneda(cuota.total)}</td>
                      <td className="px-4 py-3 text-right">
                        {cuota.saldo_pendiente > 0 ? formatMoneda(cuota.saldo_pendiente) : <span className="text-green-600">✓</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge estado={cuota.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        {esCobrable && (
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => router.push(`/cobranza?cuota_id=${cuota.id}&credito_id=${c.id}`)}>
                            Cobrar
                          </Button>
                        )}
                        {cuota.estado === 'pagada' && ultimoPago && (
                          <span className="text-xs text-slate-400">{formatFecha(ultimoPago.fecha_pago)}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold">TOTALES</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoneda(cuotas.reduce((a, c) => a + c.capital, 0))}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoneda(cuotas.reduce((a, c) => a + c.interes, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatMoneda(cuotas.reduce((a, c) => a + c.total, 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Datos financieros</h3>
              <Fila label="N° crédito" valor={`#${c.numero_credito}`} />
              <Fila label="Monto otorgado" valor={formatMoneda(c.monto_otorgado)} />
              <Fila label="Tasa anual" valor={formatPorcentaje(c.tasa_anual)} />
              <Fila label="Cuotas" valor={`${c.cantidad_cuotas}`} />
              <Fila label="Sistema" valor={c.sistema_amortizacion} />
              <Fila label="Total financiado" valor={formatMoneda(c.monto_total_financiado)} />
              <Fila label="Otorgamiento" valor={formatFecha(c.fecha_otorgamiento)} />
              <Fila label="1° vencimiento" valor={formatFecha(c.fecha_primer_vencimiento)} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Cliente</h3>
              {cliente && (
                <>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">{cliente.apellido}, {cliente.nombre}</p>
                  <p className="text-sm text-slate-500 mb-3">{cliente.tipo_documento?.toUpperCase()} {formatDNI(cliente.numero_documento)}</p>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/clientes/${cliente.id}`)} className="w-full">
                    Ver ficha del cliente
                  </Button>
                </>
              )}
            </div>
            {plan && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Plan</h3>
                <Fila label="Código" valor={plan.codigo} />
                <Fila label="Descripción" valor={plan.descripcion} />
              </div>
            )}
            {c.comercios && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Comercio</h3>
                <Fila label="Nombre" valor={c.comercios.nombre} />
                <Fila label="Código" valor={c.comercios.codigo} />
              </div>
            )}
          </div>
        </TabsContent>

        {garantes.length > 0 && (
          <TabsContent value="garantes">
            <div className="space-y-3">
              {garantes.map((g: any) => (
                <div key={g.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                  <p className="font-semibold">{g.clientes_garante?.apellido}, {g.clientes_garante?.nombre}</p>
                  <p className="text-sm text-slate-500">{g.clientes_garante?.tipo_documento?.toUpperCase()} {formatDNI(g.clientes_garante?.numero_documento ?? '')}</p>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/clientes/${g.garante_id}`)} className="mt-2">Ver ficha</Button>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
