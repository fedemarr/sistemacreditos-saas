'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearAutorizacionAction } from '@/lib/actions/autorizaciones'
import { autorizacionSchema, type AutorizacionData } from '@/lib/validations/autorizacion.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search, User, AlertCircle } from 'lucide-react'
import { formatMoneda, formatDNI } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'

interface AutorizacionFormProps {
  comercios: { id: string; codigo: string; nombre: string }[]
  planes: { id: string; codigo: string; descripcion: string; cantidad_cuotas: number; tasa_anual: number }[]
}

export function AutorizacionForm({ comercios, planes }: AutorizacionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null)
  const [busquedaDni, setBusquedaDni] = useState('')
  const supabase = createClient()

  const form = useForm<AutorizacionData>({
    resolver: zodResolver(autorizacionSchema),
    defaultValues: {
      capital_pedido: 0,
      cancelacion_deuda: false,
      con_tarjeta: false,
    },
  })

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

    if (!data) {
      toast.error('No se encontró ningún cliente con ese documento')
      return
    }

    if (data.estado === 'inhabilitado' || data.estado === 'baja') {
      toast.error('Este cliente está inhabilitado')
      return
    }

    setClienteEncontrado(data)
    form.setValue('cliente_id', data.id)
  }

  function handleSubmit(data: AutorizacionData) {
    if (!clienteEncontrado) {
      toast.error('Seleccioná un cliente primero')
      return
    }
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
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plan (opcional)</Label>
            <Select onValueChange={v => form.setValue('plan_id', v)}>
              <SelectTrigger><SelectValue placeholder="Sin plan" /></SelectTrigger>
              <SelectContent>
                {planes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo} — {p.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
