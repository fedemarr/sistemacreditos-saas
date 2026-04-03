'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearSolicitudAction } from '@/lib/actions/solicitudes'
import { solicitudSchema, type SolicitudData } from '@/lib/validations/solicitud.schema'
import { calcularPlanDePagos, calcularTotalFinanciado, OPCIONES_REDONDEO } from '@/lib/calculadora/amortizacion'
import { SistemaAmortizacion } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search, Calculator, User, AlertCircle } from 'lucide-react'
import { formatMoneda, formatDNI, formatPorcentaje } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'

interface SolicitudFormProps {
  planes: any[]
  comercios: any[]
  autorizacion?: any
  clientePreseleccionado?: any
}

const SISTEMAS_AMORTIZACION = [
  { value: 'frances', label: 'Francés (cuota fija)' },
  { value: 'aleman', label: 'Alemán (capital fijo)' },
  { value: 'directo', label: 'Interés directo' },
]

export function SolicitudForm({ planes, comercios, autorizacion, clientePreseleccionado }: SolicitudFormProps) {
  const [isPending, startTransition] = useTransition()
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(
    autorizacion?.clientes ?? clientePreseleccionado ?? null
  )
  const [busquedaDni, setBusquedaDni] = useState('')
  const [simulacion, setSimulacion] = useState<{ cuota: number; total: number; cuotaRedondeada?: number } | null>(null)
  const [redondeo, setRedondeo] = useState(0)
  const [redondeoHacia, setRedondeoHacia] = useState<'arriba' | 'abajo' | 'cercano'>('cercano')
  const supabase = createClient()

  const form = useForm<SolicitudData>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      cliente_id: autorizacion?.cliente_id ?? clientePreseleccionado?.id ?? '',
      autorizacion_id: autorizacion?.id ?? undefined,
      capital_pedido: autorizacion?.capital_pedido ?? 0,
      tasa_anual: 0,
      cantidad_cuotas: 12,
      sistema_amortizacion: 'frances',
      gastos: 0,
      descuento: 0,
      cuota_retenida: false,
      es_renovacion: false,
      es_plan_dni: false,
      avalada: false,
      con_tarjeta: false,
      relacion: 'generica',
      garantes: [],
    },
  })

  const capital = form.watch('capital_pedido')
  const tasa = form.watch('tasa_anual')
  const cuotas = form.watch('cantidad_cuotas')
  const sistema = form.watch('sistema_amortizacion')
  const fechaVto = form.watch('fecha_primer_vencimiento')

  useEffect(() => {
    if (capital > 0 && tasa > 0 && cuotas > 0 && fechaVto) {
      try {
        // Sin redondeo para mostrar cuota exacta
        const planBase = calcularPlanDePagos(
          { monto: capital, tasaAnual: tasa, cantidadCuotas: cuotas, fechaPrimerVencimiento: fechaVto },
          sistema as SistemaAmortizacion
        )
        // Con redondeo si está configurado
        const planRedondeado = redondeo > 0
          ? calcularPlanDePagos(
              { monto: capital, tasaAnual: tasa, cantidadCuotas: cuotas, fechaPrimerVencimiento: fechaVto, redondeo, redondeoHacia },
              sistema as SistemaAmortizacion
            )
          : planBase

        setSimulacion({
          cuota: planBase[0]?.total ?? 0,
          total: calcularTotalFinanciado(planBase),
          cuotaRedondeada: redondeo > 0 ? planRedondeado[0]?.total : undefined,
        })
      } catch {
        setSimulacion(null)
      }
    } else {
      setSimulacion(null)
    }
  }, [capital, tasa, cuotas, sistema, fechaVto, redondeo, redondeoHacia])

  function handlePlanChange(planId: string) {
    const plan = planes.find(p => p.id === planId)
    if (plan) {
      form.setValue('plan_id', planId)
      form.setValue('tasa_anual', plan.tasa_anual)
      form.setValue('cantidad_cuotas', plan.cantidad_cuotas)
      form.setValue('sistema_amortizacion', plan.sistema_amortizacion ?? 'frances')
      form.setValue('gastos', plan.gastos_otorgamiento ?? 0)
      form.setValue('cuota_retenida', plan.cuota_retenida ?? false)
      form.setValue('es_plan_dni', plan.es_plan_dni ?? false)
    }
  }

  async function buscarCliente() {
    if (!busquedaDni.trim()) return
    setBuscandoCliente(true)
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, numero_documento, tipo_documento, ingreso_mensual, limite_credito, estado')
      .ilike('numero_documento', `%${busquedaDni.trim()}%`)
      .limit(1)
      .single()
    setBuscandoCliente(false)
    if (!data) { toast.error('Cliente no encontrado'); return }
    if (data.estado === 'inhabilitado' || data.estado === 'baja') { toast.error('Cliente inhabilitado'); return }
    setClienteSeleccionado(data)
    form.setValue('cliente_id', data.id)
  }

  function handleSubmit(data: SolicitudData) {
    if (!clienteSeleccionado) { toast.error('Seleccioná un cliente'); return }
    startTransition(async () => {
      const result = await crearSolicitudAction(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-3xl space-y-6">

      {/* Cliente */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Cliente
        </h2>

        {autorizacion ? (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-400 font-medium">
              Autorización #{autorizacion.numero_autorizacion} vinculada
            </p>
          </div>
        ) : (
          !clienteSeleccionado && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Buscar por DNI..."
                value={busquedaDni}
                onChange={e => setBusquedaDni(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarCliente())}
              />
              <Button type="button" variant="outline" onClick={buscarCliente} disabled={buscandoCliente} className="gap-2 shrink-0">
                {buscandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </Button>
            </div>
          )
        )}

        {clienteSeleccionado && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <p className="font-semibold text-slate-900 dark:text-white">
              {clienteSeleccionado.apellido}, {clienteSeleccionado.nombre}
            </p>
            <p className="text-sm text-slate-500">
              {clienteSeleccionado.tipo_documento?.toUpperCase()} {formatDNI(clienteSeleccionado.numero_documento)}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <p className="text-xs text-slate-500">Ingreso</p>
                <p className="text-sm font-medium">{formatMoneda(clienteSeleccionado.ingreso_mensual)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Límite</p>
                <p className="text-sm font-medium">{formatMoneda(clienteSeleccionado.limite_credito)}</p>
              </div>
            </div>
            {!autorizacion && (
              <button type="button" onClick={() => { setClienteSeleccionado(null); form.setValue('cliente_id', '') }}
                className="text-xs text-blue-500 hover:underline mt-2">
                Cambiar cliente
              </button>
            )}
          </div>
        )}

        {form.formState.errors.cliente_id && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" /> {form.formState.errors.cliente_id.message}
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Plan de Crédito</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2 md:col-span-2">
            <Label>Plan *</Label>
            <Select onValueChange={handlePlanChange}>
              <SelectTrigger><SelectValue placeholder="Seleccioná un plan" /></SelectTrigger>
              <SelectContent>
                {planes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo} — {p.descripcion} ({p.cantidad_cuotas} cuotas, {formatPorcentaje(p.tasa_anual)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.plan_id && <p className="text-red-500 text-xs">{form.formState.errors.plan_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Capital pedido ($) *</Label>
            <Input type="number" step="0.01" {...form.register('capital_pedido', { valueAsNumber: true })} />
            {form.formState.errors.capital_pedido && <p className="text-red-500 text-xs">{form.formState.errors.capital_pedido.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Fecha 1° vencimiento *</Label>
            <Input type="date" {...form.register('fecha_primer_vencimiento')} />
            {form.formState.errors.fecha_primer_vencimiento && <p className="text-red-500 text-xs">{form.formState.errors.fecha_primer_vencimiento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tasa anual (%)</Label>
            <Input type="number" step="0.01" {...form.register('tasa_anual', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>Cantidad de cuotas</Label>
            <Input type="number" {...form.register('cantidad_cuotas', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>Sistema de amortización</Label>
            <Select
              defaultValue="frances"
              value={sistema}
              onValueChange={v => form.setValue('sistema_amortizacion', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SISTEMAS_AMORTIZACION.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sistema === 'directo' && (
              <p className="text-xs text-slate-500">
                Cuota = (Capital + Interés total) ÷ Cuotas. Todas las cuotas son iguales.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gastos ($)</Label>
            <Input type="number" step="0.01" {...form.register('gastos', { valueAsNumber: true })} />
          </div>

          {/* Redondeo de cuotas */}
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

          <div className="space-y-2">
            <Label>Descuento ($)</Label>
            <Input type="number" step="0.01" {...form.register('descuento', { valueAsNumber: true })} />
          </div>
        </div>

        {/* Simulador de cuota */}
        {simulacion && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4" /> Simulación
              {sistema === 'directo' && <span className="text-xs font-normal">(interés directo)</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Cuota exacta</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{formatMoneda(simulacion.cuota)}</p>
              </div>
              {simulacion.cuotaRedondeada && simulacion.cuotaRedondeada !== simulacion.cuota && (
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Cuota redondeada</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatMoneda(simulacion.cuotaRedondeada)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Total a pagar</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{formatMoneda(simulacion.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Datos adicionales */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Datos Adicionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
            <Label>Fecha de levante</Label>
            <Input type="date" {...form.register('fecha_levante')} />
          </div>

          <div className="space-y-2">
            <Label>N° de tanda</Label>
            <Input {...form.register('numero_tanda')} placeholder="001" />
          </div>

          <div className="space-y-2">
            <Label>Relación</Label>
            <Select defaultValue="generica" onValueChange={v => form.setValue('relacion', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="generica">Genérica</SelectItem>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input type="checkbox" id="es_renovacion" {...form.register('es_renovacion')} className="w-4 h-4 rounded" />
            <Label htmlFor="es_renovacion" className="cursor-pointer">Es renovación</Label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input type="checkbox" id="avalada" {...form.register('avalada')} className="w-4 h-4 rounded" />
            <Label htmlFor="avalada" className="cursor-pointer">Avalada</Label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Textarea {...form.register('observaciones')} placeholder="Observaciones adicionales..." rows={2} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !clienteSeleccionado} className="gap-2 min-w-40">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
            : 'Crear solicitud'
          }
        </Button>
      </div>
    </form>
  )
}
