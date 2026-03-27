'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearPlanAction, actualizarPlanAction } from '@/lib/actions/planes'
import { planCreditoSchema, type PlanCreditoData } from '@/lib/validations/plan.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface PlanFormProps {
  plan?: Record<string, any>
}

export function PlanForm({ plan }: PlanFormProps) {
  const [isPending, startTransition] = useTransition()
  const esEdicion = !!plan

  const form = useForm<PlanCreditoData>({
    resolver: zodResolver(planCreditoSchema),
    defaultValues: {
      codigo: plan?.codigo ?? '',
      descripcion: plan?.descripcion ?? '',
      cantidad_cuotas: plan?.cantidad_cuotas ?? 12,
      tasa_anual: plan?.tasa_anual ?? 0,
      sistema_amortizacion: plan?.sistema_amortizacion ?? 'frances',
      gastos_otorgamiento: plan?.gastos_otorgamiento ?? 0,
      cuota_retenida: plan?.cuota_retenida ?? false,
      es_plan_dni: plan?.es_plan_dni ?? false,
      activo: plan?.activo ?? true,
    },
  })

  function handleSubmit(data: PlanCreditoData) {
    startTransition(async () => {
      const result = esEdicion
        ? await actualizarPlanAction(plan.id, data)
        : await crearPlanAction(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2">
            <Label>Código *</Label>
            <Input {...form.register('codigo')} placeholder="P12" className="uppercase" />
            {form.formState.errors.codigo && (
              <p className="text-red-500 text-xs">{form.formState.errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input {...form.register('descripcion')} placeholder="PLAN 12 CUOTAS" />
            {form.formState.errors.descripcion && (
              <p className="text-red-500 text-xs">{form.formState.errors.descripcion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cantidad de cuotas *</Label>
            <Input
              type="number"
              min="1"
              {...form.register('cantidad_cuotas', { valueAsNumber: true })}
            />
            {form.formState.errors.cantidad_cuotas && (
              <p className="text-red-500 text-xs">{form.formState.errors.cantidad_cuotas.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tasa anual (%) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="42.00"
              {...form.register('tasa_anual', { valueAsNumber: true })}
            />
            {form.formState.errors.tasa_anual && (
              <p className="text-red-500 text-xs">{form.formState.errors.tasa_anual.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sistema de amortización</Label>
            <Select
              defaultValue={form.getValues('sistema_amortizacion')}
              onValueChange={v => form.setValue('sistema_amortizacion', v as 'frances')}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="frances">Francés (cuota fija)</SelectItem>
                <SelectItem value="aleman">Alemán (capital fijo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gastos de otorgamiento ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...form.register('gastos_otorgamiento', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input
              type="checkbox"
              id="cuota_retenida"
              {...form.register('cuota_retenida')}
              className="w-4 h-4 rounded"
            />
            <div>
              <Label htmlFor="cuota_retenida" className="cursor-pointer">Cuota retenida</Label>
              <p className="text-xs text-slate-500">Descuento directo de haberes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input
              type="checkbox"
              id="es_plan_dni"
              {...form.register('es_plan_dni')}
              className="w-4 h-4 rounded"
            />
            <div>
              <Label htmlFor="es_plan_dni" className="cursor-pointer">Plan DNI</Label>
              <p className="text-xs text-slate-500">Modalidad especial plan DNI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isPending} className="gap-2 min-w-32">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {esEdicion ? 'Guardar cambios' : 'Crear plan'}</>
          }
        </Button>
      </div>
    </form>
  )
}
