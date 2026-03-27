'use client'

// Formulario de edición del cliente organizado en tabs.
// Pre-carga todos los datos existentes del cliente.

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { actualizarClienteAction } from '@/lib/actions/clientes'
import { clienteCompletoSchema, type ClienteCompletoData } from '@/lib/validations/cliente.schema'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save, User, MapPin, Briefcase, Star } from 'lucide-react'

const provincias = [
  'BUENOS AIRES', 'CABA', 'CATAMARCA', 'CHACO', 'CHUBUT',
  'CÓRDOBA', 'CORRIENTES', 'ENTRE RÍOS', 'FORMOSA', 'JUJUY',
  'LA PAMPA', 'LA RIOJA', 'MENDOZA', 'MISIONES', 'NEUQUÉN',
  'RÍO NEGRO', 'SALTA', 'SAN JUAN', 'SAN LUIS', 'SANTA CRUZ',
  'SANTA FE', 'SANTIAGO DEL ESTERO', 'TIERRA DEL FUEGO', 'TUCUMÁN',
]

interface ClienteEditarFormProps {
  cliente: Record<string, any>
  laboral: Record<string, any> | null
  referencias: Record<string, any>[]
  familiar: Record<string, any> | null
}

export function ClienteEditarForm({ cliente, laboral, referencias, familiar }: ClienteEditarFormProps) {
  const [isPending, startTransition] = useTransition()

  const ref1 = referencias?.find((r: any) => r.orden === 1)
  const ref2 = referencias?.find((r: any) => r.orden === 2)

  const form = useForm<ClienteCompletoData>({
    resolver: zodResolver(clienteCompletoSchema),
    defaultValues: {
      // Paso 1
      tipo_documento: cliente.tipo_documento ?? 'dni',
      numero_documento: cliente.numero_documento ?? '',
      cuil: cliente.cuil ?? '',
      nombre: cliente.nombre ?? '',
      apellido: cliente.apellido ?? '',
      fecha_nacimiento: cliente.fecha_nacimiento ?? '',
      nacionalidad: cliente.nacionalidad ?? 'ARGENTINA',
      estado_civil: cliente.estado_civil ?? 'soltero',
      sexo: cliente.sexo ?? 'masculino',
      // Paso 2
      domicilio_calle: cliente.domicilio_calle ?? '',
      domicilio_nro: cliente.domicilio_nro ?? '',
      domicilio_piso: cliente.domicilio_piso ?? '',
      domicilio_entre: cliente.domicilio_entre ?? '',
      domicilio_barrio: cliente.domicilio_barrio ?? '',
      domicilio_localidad: cliente.domicilio_localidad ?? '',
      domicilio_provincia: cliente.domicilio_provincia ?? 'BUENOS AIRES',
      domicilio_codigo_postal: cliente.domicilio_codigo_postal ?? '',
      telefono: cliente.telefono ?? '',
      telefono_referencia: cliente.telefono_referencia ?? '',
      email: cliente.email ?? '',
      // Paso 3
      ingreso_mensual: cliente.ingreso_mensual ?? 0,
      recibo_ingresos: cliente.recibo_ingresos ?? '',
      ramo: cliente.ramo ?? '',
      empleador_nombre: laboral?.empleador_nombre ?? '',
      empleador_cuit: laboral?.empleador_cuit ?? '',
      seccion: laboral?.seccion ?? '',
      tipo_ocupacion: laboral?.tipo_ocupacion ?? '',
      legajo_laboral: laboral?.legajo_laboral ?? '',
      fecha_ingreso: laboral?.fecha_ingreso ?? '',
      empleo_calle: laboral?.empleo_calle ?? '',
      empleo_nro: laboral?.empleo_nro ?? '',
      empleo_provincia: laboral?.empleo_provincia ?? '',
      empleo_localidad: laboral?.empleo_localidad ?? '',
      empleo_telefono: laboral?.empleo_telefono ?? '',
      empleo_interno: laboral?.empleo_interno ?? '',
      empleo_horario: laboral?.empleo_horario ?? '',
      referencia1_nombre: ref1?.nombre ?? '',
      referencia1_relacion: ref1?.relacion ?? '',
      referencia1_telefono: ref1?.telefono ?? '',
      referencia2_nombre: ref2?.nombre ?? '',
      referencia2_relacion: ref2?.relacion ?? '',
      referencia2_telefono: ref2?.telefono ?? '',
      // Paso 4
      limite_credito: cliente.limite_credito ?? 0,
      categoria: cliente.categoria ?? 'a',
      cumplimiento: cliente.cumplimiento ?? 'activo',
      nombre_padre: familiar?.nombre_padre ?? '',
      nombre_madre: familiar?.nombre_madre ?? '',
      conyuge_documento: familiar?.conyuge_documento ?? '',
      conyuge_nombre: familiar?.conyuge_nombre ?? '',
      conyuge_apellido: familiar?.conyuge_apellido ?? '',
      cantidad_hijos: familiar?.cantidad_hijos ?? 0,
      vencimiento_alquiler: cliente.vencimiento_alquiler ?? '',
      presenta_escritura: cliente.presenta_escritura ?? false,
      tarjeta_fecha_emision: cliente.tarjeta_fecha_emision ?? '',
      tarjeta_fecha_vencimiento: cliente.tarjeta_fecha_vencimiento ?? '',
      es_especial: cliente.es_especial ?? false,
      observaciones: cliente.observaciones ?? '',
    },
  })

  function handleSubmit(data: ClienteCompletoData) {
    startTransition(async () => {
      const result = await actualizarClienteAction(cliente.id, data)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Cliente actualizado correctamente')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Tabs defaultValue="personal">
        <TabsList className="mb-6">
          <TabsTrigger value="personal" className="gap-2">
            <User className="w-4 h-4" /> Personal
          </TabsTrigger>
          <TabsTrigger value="domicilio" className="gap-2">
            <MapPin className="w-4 h-4" /> Domicilio
          </TabsTrigger>
          <TabsTrigger value="laboral" className="gap-2">
            <Briefcase className="w-4 h-4" /> Laboral
          </TabsTrigger>
          <TabsTrigger value="clasificacion" className="gap-2">
            <Star className="w-4 h-4" /> Clasificación
          </TabsTrigger>
        </TabsList>

        {/* Personal */}
        <TabsContent value="personal">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo documento</Label>
                <Select defaultValue={form.getValues('tipo_documento')} onValueChange={v => form.setValue('tipo_documento', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número documento *</Label>
                <Input {...form.register('numero_documento')} />
                {form.formState.errors.numero_documento && <p className="text-red-500 text-xs">{form.formState.errors.numero_documento.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CUIL</Label>
                <Input {...form.register('cuil')} placeholder="20-12345678-9" />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input {...form.register('apellido')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input {...form.register('nombre')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input {...form.register('fecha_nacimiento')} type="date" />
              </div>
              <div className="space-y-2">
                <Label>Estado civil</Label>
                <Select defaultValue={form.getValues('estado_civil')} onValueChange={v => form.setValue('estado_civil', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero/a</SelectItem>
                    <SelectItem value="casado">Casado/a</SelectItem>
                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                    <SelectItem value="viudo">Viudo/a</SelectItem>
                    <SelectItem value="union_convivencial">Unión convivencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select defaultValue={form.getValues('sexo')} onValueChange={v => form.setValue('sexo', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Domicilio */}
        <TabsContent value="domicilio">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Calle *</Label>
                <Input {...form.register('domicilio_calle')} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input {...form.register('domicilio_nro')} />
              </div>
              <div className="space-y-2">
                <Label>Piso/Depto</Label>
                <Input {...form.register('domicilio_piso')} />
              </div>
              <div className="space-y-2">
                <Label>Barrio</Label>
                <Input {...form.register('domicilio_barrio')} />
              </div>
              <div className="space-y-2">
                <Label>Provincia *</Label>
                <Select defaultValue={form.getValues('domicilio_provincia')} onValueChange={v => form.setValue('domicilio_provincia', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {provincias.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Localidad *</Label>
                <Input {...form.register('domicilio_localidad')} />
              </div>
              <div className="space-y-2">
                <Label>Código postal</Label>
                <Input {...form.register('domicilio_codigo_postal')} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input {...form.register('telefono')} />
              </div>
              <div className="space-y-2">
                <Label>Tel. referencia</Label>
                <Input {...form.register('telefono_referencia')} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register('email')} type="email" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Laboral */}
        <TabsContent value="laboral">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ingreso mensual *</Label>
                <Input type="number" {...form.register('ingreso_mensual', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Empleador</Label>
                <Input {...form.register('empleador_nombre')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Sección</Label>
                <Input {...form.register('seccion')} />
              </div>
              <div className="space-y-2">
                <Label>Legajo</Label>
                <Input {...form.register('legajo_laboral')} />
              </div>
              <div className="space-y-2">
                <Label>Ref. 1 — Nombre</Label>
                <Input {...form.register('referencia1_nombre')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Ref. 1 — Teléfono</Label>
                <Input {...form.register('referencia1_telefono')} />
              </div>
              <div className="space-y-2">
                <Label>Ref. 2 — Nombre</Label>
                <Input {...form.register('referencia2_nombre')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Ref. 2 — Teléfono</Label>
                <Input {...form.register('referencia2_telefono')} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Clasificación */}
        <TabsContent value="clasificacion">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Límite de crédito ($)</Label>
                <Input type="number" {...form.register('limite_credito', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select defaultValue={form.getValues('categoria')} onValueChange={v => form.setValue('categoria', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A — Sin deuda</SelectItem>
                    <SelectItem value="b">B — Atraso menor</SelectItem>
                    <SelectItem value="c">C — Atraso mayor</SelectItem>
                    <SelectItem value="d">D — Incobrable</SelectItem>
                    <SelectItem value="e">E — Judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observaciones</Label>
                <Textarea {...form.register('observaciones')} rows={3} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botón guardar fijo abajo */}
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isPending} className="gap-2 min-w-32">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> Guardar cambios</>
          }
        </Button>
      </div>
    </form>
  )
}
