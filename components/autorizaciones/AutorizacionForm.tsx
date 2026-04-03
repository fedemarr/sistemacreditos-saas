'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearAutorizacionAction } from '@/lib/actions/autorizaciones'
import { autorizacionSchema, type AutorizacionData } from '@/lib/validations/autorizacion.schema'
import { calcularPlanDePagos, calcularTotalFinanciado, OPCIONES_REDONDEO } from '@/lib/calculadora/amortizacion'
import { SistemaAmortizacion } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search, User, AlertCircle, Calculator } from 'lucide-react'
import { formatMoneda, formatDNI } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'

interface AutorizacionFormProps {
  comercios: { id: string; codigo: string; nombre: string }[]
  planes: { id: string; codigo: string; descripcion: string; cantidad_cuotas: number; tasa_anual: number; sistema_amortizacion?: string }[]
}

export function AutorizacionForm({ comercios, planes }: AutorizacionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)
  const [busquedaDni, setBusquedaDni] = useState('')
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)
  const [simulacion, setSimulacion] = useState<{ cuota: number; cuotaRedondeada: number; total: number } | null>(null)
  const [redondeo, setRedondeo] = useState(0)
  const [redondeoHacia, setRedondeoHacia] = useState<'arriba' | 'abajo' | 'cercano'>('cercano')
  const supabase = createClient()

  const form = useForm<AutorizacionData>({
    resolver: zodResolver(autorizacionSchema),
    defaultValues: {
      capital_pedido: 0,
      cancelacion_deuda: false,
      con_tarjeta: false,
    },
  })

  const capital = form.watch('capital_pedido')

  // Simular cuota cuando cambian capital, plan o redondeo
  useEffect(() => {
    if (!planSeleccionado || !capital || capital <= 0) {
      setSimulacion(null)
      return
    }
    try {
      const hoy = new Date()
      hoy.setMonth(hoy.getMonth() + 1)
      const fechaVto = hoy.toISOString().split('T')[0]
      const sistema = (planSeleccionado.sistema_amortizacion ?? 'directo') as SistemaAmortizacion

      const planBase = calcularPlanDePagos(
        { monto: capital, tasaAnual: planSeleccionado.tasa_anual, cantidadCuotas: planSeleccionado.cantidad_cuotas, fechaPrimerVencimiento: fechaVto },
        sistema
      )
      const planRedondeado = redondeo > 0
        ? calcularPlanDePagos(
            { monto: capital, tasaAnual: planSeleccionado.tasa_anual, cantidadCuotas: planSeleccionado.cantidad_cuotas, fechaPrimerVencimiento: fechaVto, redondeo, redondeoHacia },
            sistema
          )
        : planBase

      setSimulacion({
        cuota: planBase[0]?.total ?? 0,
        cuotaRedondeada: planRedondeado[0]?.total ?? 0,
        total: calcularTotalFinanciado(planRedondeado),
      })
    } catch {
      setSimulacion(null)
    }
  }, [capital, planSeleccionado, redondeo, redondeoHacia])

  function handlePlanChange(planId: string) {
    const plan = planes.find(p => p.id === planId)
    setPlanSeleccionado(plan ?? null)
    form.setValue('plan_id', planId)
  }

  async function buscarCliente() {
    if (!busquedaDni.trim()) return
    setBuscandoCliente(true)
    setClienteEncontrado(null)

    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, numero_documento, tipo_documento, ingreso_mensual, limite_credito, estado, categoria, cumplimiento')
      .ilike('numero_documento', `%${busquedaDni.trim()}%`)
      .limit(1)
      .single()

    setBuscandoCliente(false)

    if (!data) { toast.error('No se encontró ningún cliente con ese documento'); return }
    if (data.estado === 'inhabilitado' || data.estado === 'baja') { toast.error('Este cliente está inhabilitado'); return }

    setClienteEncontrado(data)
    form.setValue('cliente_id', data.id)
  }

  function handleSubmit(data: AutorizacionData) {
    if (!clienteEncontrado) { toast.error('Seleccioná un cliente primero'); return }
    startTransition(async () => {
      const result = await crearAutorizacionAction(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-2xl space-y-6">

      {/* Búsqueda de cliente */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Buscar Cliente
        </h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Ingresá el DNI del cliente..."
            value={busquedaDni}
            onChange={e => setBusquedaDni(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarCliente())}
          />
          <Button type="button" variant="outline" onClick={buscarCliente} disabled={buscandoCliente} className="gap-2 shrink-0">
            {buscandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </Button>
        </div>

        {clienteEncontrado && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
            <p className="font-semibold text-slate-900 dark:text-white">
              {clienteEncontrado.apellido}, {clienteEncontrado.nombre}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {clienteEncontrado.tipo_documento?.toUpperCase()} {formatDNI(clienteEncontrado.numero_documento)}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-slate-500">Ingreso mensual</p>
                <p className="text-sm font-semibold">{formatMoneda(clienteEncontrado.ingreso_mensual)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Límite crédito</p>
                <p className="text-sm font-semibold">{formatMoneda(clienteEncontrado.limite_credito)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Categoría</p>
                <p className="text-sm font-semibold uppercase">{clienteEncontrado.categoria}</p>
              </div>
            </div>
          </div>
        )}

        {form.formState.errors.cliente_id && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {form.formState.errors.cliente_id.message}
          </div>
        )}
      </div>

      {/* Datos de la autorización */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Datos de la Autorización
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label>Capital pedido ($) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...form.register('capital_pedido', { valueAsNumber: true })}
            />
            {form.formState.errors.capital_pedido && (
              <p className="text-red-500 text-xs">{form.formState.errors.capital_pedido.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Comercio (opcional)</Label>
            <Select onValueChange={v => form.setValue('comercio_id', v)}>
              <SelectTrigger><SelectValue placeholder="Sin comercio" /></SelectTrigger>
              <SelectContent>
                {comercios.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plan (opcional)</Label>
            <Select onValueChange={handlePlanChange}>
              <SelectTrigger><SelectValue placeholder="Sin plan" /></SelectTrigger>
              <SelectContent>
                {planes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo} — {p.descripcion} ({p.cantidad_cuotas} cuotas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Redondeo — solo aparece si hay plan seleccionado */}
          {planSeleccionado && (
            <>
              <div className="space-y-2">
                <Label>Redondeo de cuota</Label>
                <Select defaultValue="0" onValueChange={v => setRedondeo(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPCIONES_REDONDEO.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {redondeo > 0 && (
                <div className="space-y-2">
                  <Label>Redondear hacia</Label>
                  <Select defaultValue="cercano" onValueChange={v => setRedondeoHacia(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cercano">Más cercano</SelectItem>
                      <SelectItem value="arriba">Arriba (favorece empresa)</SelectItem>
                      <SelectItem value="abajo">Abajo (favorece cliente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg self-end">
            <input type="checkbox" id="cancelacion_deuda" {...form.register('cancelacion_deuda')} className="w-4 h-4 rounded" />
            <Label htmlFor="cancelacion_deuda" className="cursor-pointer">Cancelación de deuda</Label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input type="checkbox" id="con_tarjeta" {...form.register('con_tarjeta')} className="w-4 h-4 rounded" />
            <Label htmlFor="con_tarjeta" className="cursor-pointer">Con tarjeta</Label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Textarea {...form.register('observaciones')} placeholder="Observaciones sobre la autorización..." rows={2} />
          </div>
        </div>

        {/* Simulador de cuota */}
        {simulacion && planSeleccionado && (
          <div className="mt-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4" /> Simulación — {planSeleccionado.codigo}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Cuota exacta</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{formatMoneda(simulacion.cuota)}</p>
              </div>
              {redondeo > 0 && simulacion.cuotaRedondeada !== simulacion.cuota && (
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Cuota redondeada</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatMoneda(simulacion.cuotaRedondeada)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Total a pagar</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{formatMoneda(simulacion.total)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Cuotas</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{planSeleccionado.cantidad_cuotas}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !clienteEncontrado} className="gap-2 min-w-40">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
            : 'Crear autorización'
          }
        </Button>
      </div>
    </form>
  )
}
