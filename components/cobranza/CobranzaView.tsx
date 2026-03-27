'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerCuotasConPunitoriAction, obtenerPagosCreditoAction } from '@/lib/actions/pagos'
import { RegistrarPago } from './RegistrarPago'
import { HistorialPagos } from './HistorialPagos'
import { CancelacionAnticipada } from './CancelacionAnticipada'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, formatDNI, diasAtraso } from '@/lib/utils/formatters'
import { Search, DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface CobranzaViewProps {
  creditoInicial?: any
  cuotaIdInicial?: string
  esAdmin: boolean
  empresaId: string
}

export function CobranzaView({ creditoInicial, cuotaIdInicial, esAdmin, empresaId }: CobranzaViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [buscando, setBuscando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [credito, setCredito] = useState<any>(creditoInicial ?? null)
  const [cuotas, setCuotas] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [cargandoCuotas, setCargandoCuotas] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any>(null)
  const [modalPago, setModalPago] = useState(false)
  const [modalCancelacion, setModalCancelacion] = useState(false)

  useEffect(() => { if (credito) cargarCuotas(credito.id) }, [credito?.id])

  useEffect(() => {
    if (cuotaIdInicial && cuotas.length > 0) {
      const c = cuotas.find(c => c.id === cuotaIdInicial)
      if (c) { setCuotaSeleccionada(c); setModalPago(true) }
    }
  }, [cuotaIdInicial, cuotas])

  async function cargarCuotas(creditoId: string) {
    setCargandoCuotas(true)
    const [cr, pr] = await Promise.all([
      obtenerCuotasConPunitoriAction(creditoId),
      obtenerPagosCreditoAction(creditoId),
    ])
    setCuotas(cr.data ?? [])
    setPagos(pr.data ?? [])
    setCargandoCuotas(false)
  }

  async function buscarCredito() {
    if (!busqueda.trim()) return
    setBuscando(true)
    const esNumero = /^\d+$/.test(busqueda.trim())
    let creditoEncontrado = null

    if (esNumero) {
      const { data } = await supabase
        .from('creditos')
        .select('id, numero_credito, estado, monto_otorgado, clientes(id, nombre, apellido, numero_documento, tipo_documento)')
        .eq('empresa_id', empresaId).eq('numero_credito', parseInt(busqueda.trim()))
        .in('estado', ['activo', 'en_mora']).single()
      creditoEncontrado = data
    } else {
      const { data: clientes } = await supabase.from('clientes').select('id')
        .eq('empresa_id', empresaId)
        .or(`numero_documento.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%`).limit(5)
      if (clientes?.length) {
        const { data } = await supabase
          .from('creditos')
          .select('id, numero_credito, estado, monto_otorgado, clientes(id, nombre, apellido, numero_documento, tipo_documento)')
          .eq('empresa_id', empresaId).in('cliente_id', clientes.map(c => c.id))
          .in('estado', ['activo', 'en_mora']).order('created_at', { ascending: false }).limit(1).single()
        creditoEncontrado = data
      }
    }
    setBuscando(false)
    if (!creditoEncontrado) { toast.error('No se encontraron créditos activos'); return }
    setCredito(creditoEncontrado)
  }

  function handleCobrar(cuota: any) { setCuotaSeleccionada(cuota); setModalPago(true) }

  function handlePagoCerrado() {
    setModalPago(false)
    setCuotaSeleccionada(null)
    if (credito) cargarCuotas(credito.id)
  }

  const cuotasPendientes = cuotas.filter(c => c.estado !== 'pagada')
  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencida')

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Buscar crédito</p>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="N° crédito, DNI o apellido..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarCredito()} className="pl-9" />
          </div>
          <Button onClick={buscarCredito} disabled={buscando} className="gap-2">
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </Button>
        </div>
      </div>

      {credito && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">#{credito.numero_credito}</span>
                <StatusBadge estado={credito.estado} />
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {credito.clientes?.apellido}, {credito.clientes?.nombre}
              </p>
              <p className="text-sm text-slate-500">
                {credito.clientes?.tipo_documento?.toUpperCase()} {formatDNI(credito.clientes?.numero_documento ?? '')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Monto otorgado</p>
              <p className="font-semibold">{formatMoneda(credito.monto_otorgado)}</p>
              {esAdmin && credito.estado !== 'cancelado' && (
                <Button variant="outline" size="sm" onClick={() => setModalCancelacion(true)} className="mt-2 gap-1.5 text-xs">
                  <Calculator className="w-3.5 h-3.5" /> Cancelación anticipada
                </Button>
              )}
            </div>
          </div>
          {!cargandoCuotas && cuotas.length > 0 && (
            <div className="flex gap-4 text-sm flex-wrap">
              <span className="text-slate-500">Total: <strong>{cuotas.length}</strong></span>
              <span className="text-green-600">Pagadas: <strong>{cuotas.filter(c => c.estado === 'pagada').length}</strong></span>
              <span className="text-amber-600">Pendientes: <strong>{cuotas.filter(c => c.estado === 'pendiente').length}</strong></span>
              {cuotasVencidas.length > 0 && <span className="text-red-600">Vencidas: <strong>{cuotasVencidas.length}</strong></span>}
            </div>
          )}
        </div>
      )}

      {credito && (
        <Tabs defaultValue="cuotas">
          <TabsList>
            <TabsTrigger value="cuotas" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Cuotas {cuotasPendientes.length > 0 && `(${cuotasPendientes.length} pendientes)`}
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <Clock className="w-4 h-4" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cuotas">
            {cargandoCuotas ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Vencimiento</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Importe</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Saldo</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Punitorio</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total a cobrar</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Último pago</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.map((cuota: any) => {
                      const atraso = diasAtraso(cuota.fecha_vencimiento)
                      const esCobrable = ['pendiente', 'vencida', 'parcial'].includes(cuota.estado)
                      return (
                        <tr key={cuota.id} className={cn(
                          'border-t border-slate-100 dark:border-slate-800',
                          cuota.estado === 'pagada' && 'bg-green-50/30 dark:bg-green-950/10',
                          cuota.estado === 'vencida' && 'bg-red-50/30 dark:bg-red-950/10',
                          cuota.estado === 'parcial' && 'bg-blue-50/30 dark:bg-blue-950/10',
                        )}>
                          <td className="px-4 py-3 font-semibold">{cuota.numero_cuota}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {formatFecha(cuota.fecha_vencimiento)}
                            {atraso > 0 && <span className="ml-1 text-xs text-red-500 font-medium">+{atraso}d</span>}
                          </td>
                          <td className="px-4 py-3 text-right">{formatMoneda(cuota.importe_total ?? cuota.total)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {cuota.saldo_pendiente > 0 ? formatMoneda(cuota.saldo_pendiente) : <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cuota.punitorio_teorico_calculado > 0
                              ? <span className="text-red-500 font-medium flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" />{formatMoneda(cuota.punitorio_teorico_calculado)}</span>
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {cuota.total_a_cobrar > 0 ? formatMoneda(cuota.total_a_cobrar) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {cuota.fecha_ultimo_pago ? formatFecha(cuota.fecha_ultimo_pago) : '—'}
                          </td>
                          <td className="px-4 py-3"><StatusBadge estado={cuota.estado} /></td>
                          <td className="px-4 py-3 text-right">
                            {esCobrable && (
                              <Button size="sm" onClick={() => handleCobrar(cuota)}
                                className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-500">
                                <DollarSign className="w-3.5 h-3.5" /> Cobrar
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historial">
            <HistorialPagos pagos={pagos as any} esAdmin={esAdmin} />
          </TabsContent>
        </Tabs>
      )}

      {!credito && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Buscá un crédito para cobrar</p>
          <p className="text-slate-400 text-sm mt-1">Ingresá el número de crédito, DNI o apellido</p>
        </div>
      )}

      {modalPago && cuotaSeleccionada && (
        <RegistrarPago open={modalPago} onClose={handlePagoCerrado} cuota={cuotaSeleccionada} />
      )}
      {modalCancelacion && credito && (
        <CancelacionAnticipada
          open={modalCancelacion}
          onClose={() => { setModalCancelacion(false); router.push(`/creditos/${credito.id}`) }}
          creditoId={credito.id}
          clienteId={credito.clientes?.id}
          numeroCredito={credito.numero_credito}
        />
      )}
    </div>
  )
}
