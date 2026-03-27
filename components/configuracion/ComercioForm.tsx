'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearComercioAction, actualizarComercioAction } from '@/lib/actions/planes'
import { comercioSchema, type ComercioData } from '@/lib/validations/comercio.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface ComercioFormProps {
  comercio?: Record<string, any>
}

export function ComercioForm({ comercio }: ComercioFormProps) {
  const [isPending, startTransition] = useTransition()
  const esEdicion = !!comercio

  const form = useForm<ComercioData>({
    resolver: zodResolver(comercioSchema),
    defaultValues: {
      nombre: comercio?.nombre ?? '',
      codigo: comercio?.codigo ?? '',
      razon_social: comercio?.razon_social ?? '',
      cuit: comercio?.cuit ?? '',
      domicilio: comercio?.domicilio ?? '',
      localidad: comercio?.localidad ?? '',
      provincia: comercio?.provincia ?? '',
      telefono: comercio?.telefono ?? '',
      email: comercio?.email ?? '',
      contacto_nombre: comercio?.contacto_nombre ?? '',
      activo: comercio?.activo ?? true,
    },
  })

  function handleSubmit(data: ComercioData) {
    startTransition(async () => {
      const result = esEdicion
        ? await actualizarComercioAction(comercio.id, data)
        : await crearComercioAction(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Código *</Label>
            <Input {...form.register('codigo')} placeholder="COM001" className="uppercase" />
            {form.formState.errors.codigo && <p className="text-red-500 text-xs">{form.formState.errors.codigo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...form.register('nombre')} placeholder="ELECTRODOMÉSTICOS EL RAYO" />
            {form.formState.errors.nombre && <p className="text-red-500 text-xs">{form.formState.errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Razón social</Label>
            <Input {...form.register('razon_social')} placeholder="EL RAYO S.R.L." />
          </div>
          <div className="space-y-2">
            <Label>CUIT</Label>
            <Input {...form.register('cuit')} placeholder="30-12345678-9" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Domicilio</Label>
            <Input {...form.register('domicilio')} placeholder="San Martín 456" />
          </div>
          <div className="space-y-2">
            <Label>Localidad</Label>
            <Input {...form.register('localidad')} placeholder="20 DE JUNIO" />
          </div>
          <div className="space-y-2">
            <Label>Provincia</Label>
            <Input {...form.register('provincia')} placeholder="BUENOS AIRES" />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...form.register('telefono')} placeholder="0221-4567890" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...form.register('email')} type="email" placeholder="contacto@comercio.com" />
            {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nombre del contacto</Label>
            <Input {...form.register('contacto_nombre')} placeholder="Juan García" />
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isPending} className="gap-2 min-w-36">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {esEdicion ? 'Guardar cambios' : 'Crear comercio'}</>
          }
        </Button>
      </div>
    </form>
  )
}
