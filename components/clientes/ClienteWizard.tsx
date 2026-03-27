'use client'

// Wizard de alta de cliente en 4 pasos.
// Cada paso valida sus campos antes de avanzar.
// Al finalizar el paso 4 se envía todo al Server Action.

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearClienteAction } from '@/lib/actions/clientes'
import {
  paso1Schema, paso2Schema, paso3Schema, paso4Schema,
  type Paso1Data, type Paso2Data, type Paso3Data, type Paso4Data,
} from '@/lib/validations/cliente.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  User, MapPin, Briefcase, Star,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Pasos del wizard
const pasos = [
  { numero: 1, titulo: 'Identificación', icono: User },
  { numero: 2, titulo: 'Domicilio', icono: MapPin },
  { numero: 3, titulo: 'Laboral', icono: Briefcase },
  { numero: 4, titulo: 'Clasificación', icono: Star },
]

const provincias = [
  'BUENOS AIRES', 'CABA', 'CATAMARCA', 'CHACO', 'CHUBUT',
  'CÓRDOBA', 'CORRIENTES', 'ENTRE RÍOS', 'FORMOSA', 'JUJUY',
  'LA PAMPA', 'LA RIOJA', 'MENDOZA', 'MISIONES', 'NEUQUÉN',
  'RÍO NEGRO', 'SALTA', 'SAN JUAN', 'SAN LUIS', 'SANTA CRUZ',
  'SANTA FE', 'SANTIAGO DEL ESTERO', 'TIERRA DEL FUEGO', 'TUCUMÁN',
]

export function ClienteWizard() {
  const [pasoActual, setPasoActual] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Almacena los datos de cada paso completado
  const [datosPaso1, setDatosPaso1] = useState<Paso1Data | null>(null)
  const [datosPaso2, setDatosPaso2] = useState<Paso2Data | null>(null)
  const [datosPaso3, setDatosPaso3] = useState<Paso3Data | null>(null)

  // Form del paso 1
  const form1 = useForm<Paso1Data>({
    resolver: zodResolver(paso1Schema),
    defaultValues: datosPaso1 ?? {
      tipo_documento: 'dni',
      nacionalidad: 'ARGENTINA',
      estado_civil: 'soltero',
      sexo: 'masculino',
    },
  })

  // Form del paso 2
  const form2 = useForm<Paso2Data>({
    resolver: zodResolver(paso2Schema),
    defaultValues: datosPaso2 ?? {
      domicilio_provincia: 'BUENOS AIRES',
    },
  })

  // Form del paso 3
  const form3 = useForm<Paso3Data>({
    resolver: zodResolver(paso3Schema),
    defaultValues: datosPaso3 ?? { ingreso_mensual: 0 },
  })

  // Form del paso 4
  const form4 = useForm<Paso4Data>({
    resolver: zodResolver(paso4Schema),
    defaultValues: {
      limite_credito: 0,
      categoria: 'a',
      cumplimiento: 'activo',
      cantidad_hijos: 0,
      presenta_escritura: false,
      es_especial: false,
    },
  })

  // Avanzar del paso 1 al 2
  const handlePaso1 = form1.handleSubmit(data => {
    setDatosPaso1(data)
    setPasoActual(2)
  })

  // Avanzar del paso 2 al 3
  const handlePaso2 = form2.handleSubmit(data => {
    setDatosPaso2(data)
    setPasoActual(3)
  })

  // Avanzar del paso 3 al 4
  const handlePaso3 = form3.handleSubmit(data => {
    setDatosPaso3(data)
    setPasoActual(4)
  })

  // Enviar todo al servidor
  const handlePaso4 = form4.handleSubmit(data => {
    if (!datosPaso1 || !datosPaso2 || !datosPaso3) return

    const datosCompletos = {
      ...datosPaso1,
      ...datosPaso2,
      ...datosPaso3,
      ...data,
    }

    startTransition(async () => {
      const result = await crearClienteAction(datosCompletos)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  })

  return (
    <div className="max-w-3xl mx-auto">
      {/* Barra de progreso */}
      <div className="flex items-center justify-between mb-8">
        {pasos.map((paso, idx) => {
          const Icono = paso.icono
          const completado = pasoActual > paso.numero
          const activo = pasoActual === paso.numero

          return (
            <div key={paso.numero} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all border-2',
                  completado
                    ? 'bg-green-600 border-green-600 text-white'
                    : activo
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400'
                )}>
                  {completado
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <Icono className="w-4 h-4" />
                  }
                </div>
                <span className={cn(
                  'text-xs mt-1 font-medium',
                  activo ? 'text-blue-600' : completado ? 'text-green-600' : 'text-slate-400'
                )}>
                  {paso.titulo}
                </span>
              </div>
              {idx < pasos.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-18px]',
                  completado ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* PASO 1 — Identificación personal */}
      {pasoActual === 1 && (
        <form onSubmit={handlePaso1}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Datos personales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo y número de documento */}
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  defaultValue={form1.getValues('tipo_documento')}
                  onValueChange={v => form1.setValue('tipo_documento', v as 'dni')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="lc">LC</SelectItem>
                    <SelectItem value="le">LE</SelectItem>
                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de documento *</Label>
                <Input
                  {...form1.register('numero_documento')}
                  placeholder="12345678"
                />
                {form1.formState.errors.numero_documento && (
                  <p className="text-red-500 text-xs">
                    {form1.formState.errors.numero_documento.message}
                  </p>
                )}
              </div>

              {/* CUIL */}
              <div className="space-y-2 md:col-span-2">
                <Label>CUIL</Label>
                <Input
                  {...form1.register('cuil')}
                  placeholder="20-12345678-9"
                />
                {form1.formState.errors.cuil && (
                  <p className="text-red-500 text-xs">
                    {form1.formState.errors.cuil.message}
                  </p>
                )}
              </div>

              {/* Nombre y apellido */}
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  {...form1.register('apellido')}
                  placeholder="GARCÍA"
                  className="uppercase"
                />
                {form1.formState.errors.apellido && (
                  <p className="text-red-500 text-xs">
                    {form1.formState.errors.apellido.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  {...form1.register('nombre')}
                  placeholder="JUAN"
                  className="uppercase"
                />
                {form1.formState.errors.nombre && (
                  <p className="text-red-500 text-xs">
                    {form1.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="space-y-2">
                <Label>Fecha de nacimiento *</Label>
                <Input
                  {...form1.register('fecha_nacimiento')}
                  type="date"
                />
                {form1.formState.errors.fecha_nacimiento && (
                  <p className="text-red-500 text-xs">
                    {form1.formState.errors.fecha_nacimiento.message}
                  </p>
                )}
              </div>

              {/* Nacionalidad */}
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input
                  {...form1.register('nacionalidad')}
                  placeholder="ARGENTINA"
                  className="uppercase"
                />
              </div>

              {/* Estado civil */}
              <div className="space-y-2">
                <Label>Estado civil</Label>
                <Select
                  defaultValue={form1.getValues('estado_civil')}
                  onValueChange={v => form1.setValue('estado_civil', v as 'soltero')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero/a</SelectItem>
                    <SelectItem value="casado">Casado/a</SelectItem>
                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                    <SelectItem value="viudo">Viudo/a</SelectItem>
                    <SelectItem value="union_convivencial">Unión convivencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sexo */}
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select
                  defaultValue={form1.getValues('sexo')}
                  onValueChange={v => form1.setValue('sexo', v as 'masculino')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" className="gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PASO 2 — Domicilio y contacto */}
      {pasoActual === 2 && (
        <form onSubmit={handlePaso2}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Domicilio y contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Calle *</Label>
                <Input {...form2.register('domicilio_calle')} placeholder="AV. SAN MARTÍN" />
                {form2.formState.errors.domicilio_calle && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.domicilio_calle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Número</Label>
                <Input {...form2.register('domicilio_nro')} placeholder="1234" />
              </div>

              <div className="space-y-2">
                <Label>Piso / Depto</Label>
                <Input {...form2.register('domicilio_piso')} placeholder="2°B" />
              </div>

              <div className="space-y-2">
                <Label>Entre calles</Label>
                <Input {...form2.register('domicilio_entre')} placeholder="Belgrano y Mitre" />
              </div>

              <div className="space-y-2">
                <Label>Barrio</Label>
                <Input {...form2.register('domicilio_barrio')} placeholder="Centro" />
              </div>

              <div className="space-y-2">
                <Label>Provincia *</Label>
                <Select
                  defaultValue={form2.getValues('domicilio_provincia') || 'BUENOS AIRES'}
                  onValueChange={v => form2.setValue('domicilio_provincia', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {provincias.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Localidad *</Label>
                <Input {...form2.register('domicilio_localidad')} placeholder="20 DE JUNIO" />
                {form2.formState.errors.domicilio_localidad && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.domicilio_localidad.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código Postal</Label>
                <Input {...form2.register('domicilio_codigo_postal')} placeholder="1761" />
              </div>

              <div className="space-y-2 md:col-span-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Contacto</p>
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input {...form2.register('telefono')} placeholder="011-4567890" />
                {form2.formState.errors.telefono && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.telefono.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Teléfono de referencia</Label>
                <Input {...form2.register('telefono_referencia')} placeholder="011-9876543" />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form2.register('email')} type="email" placeholder="juan@email.com" />
                {form2.formState.errors.email && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setPasoActual(1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button type="submit" className="gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PASO 3 — Laboral y referencias */}
      {pasoActual === 3 && (
        <form onSubmit={handlePaso3}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Situación laboral
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ingreso mensual *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...form3.register('ingreso_mensual', { valueAsNumber: true })}
                />
                {form3.formState.errors.ingreso_mensual && (
                  <p className="text-red-500 text-xs">{form3.formState.errors.ingreso_mensual.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha recibo de ingresos</Label>
                <Input {...form3.register('recibo_ingresos')} type="date" />
              </div>

              <div className="space-y-2">
                <Label>Empleador</Label>
                <Input {...form3.register('empleador_nombre')} placeholder="EMPRESA S.A." className="uppercase" />
              </div>

              <div className="space-y-2">
                <Label>CUIT empleador</Label>
                <Input {...form3.register('empleador_cuit')} placeholder="30-12345678-9" />
              </div>

              <div className="space-y-2">
                <Label>Sección / Área</Label>
                <Input {...form3.register('seccion')} placeholder="ADMINISTRACIÓN" />
              </div>

              <div className="space-y-2">
                <Label>Tipo de ocupación</Label>
                <Input {...form3.register('tipo_ocupacion')} placeholder="EMPLEADO" />
              </div>

              <div className="space-y-2">
                <Label>Legajo laboral</Label>
                <Input {...form3.register('legajo_laboral')} placeholder="12345" />
              </div>

              <div className="space-y-2">
                <Label>Fecha ingreso laboral</Label>
                <Input {...form3.register('fecha_ingreso')} type="date" />
              </div>
            </div>

            {/* Referencias personales */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Referencias personales
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre referencia 1</Label>
                  <Input {...form3.register('referencia1_nombre')} placeholder="PEDRO GÓMEZ" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Relación</Label>
                  <Input {...form3.register('referencia1_relacion')} placeholder="HERMANO" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input {...form3.register('referencia1_telefono')} placeholder="011-4567890" />
                </div>

                <div className="space-y-2">
                  <Label>Nombre referencia 2</Label>
                  <Input {...form3.register('referencia2_nombre')} placeholder="ANA LÓPEZ" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Relación</Label>
                  <Input {...form3.register('referencia2_relacion')} placeholder="AMIGO" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input {...form3.register('referencia2_telefono')} placeholder="011-9876543" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setPasoActual(2)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button type="submit" className="gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PASO 4 — Clasificación */}
      {pasoActual === 4 && (
        <form onSubmit={handlePaso4}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Clasificación crediticia
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Límite de crédito ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...form4.register('limite_credito', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  defaultValue="a"
                  onValueChange={v => form4.setValue('categoria', v as 'a')}
                >
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

              <div className="space-y-2">
                <Label>Cumplimiento</Label>
                <Select
                  defaultValue="activo"
                  onValueChange={v => form4.setValue('cumplimiento', v as 'activo')}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ramo</Label>
                <Input {...form4.register('ramo' as any)} placeholder="ALIMENTACIÓN - INSUMOS" />
              </div>
            </div>

            {/* Datos familiares */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Datos familiares (opcional)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del padre</Label>
                  <Input {...form4.register('nombre_padre')} placeholder="CARLOS GARCÍA" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la madre</Label>
                  <Input {...form4.register('nombre_madre')} placeholder="MARÍA PÉREZ" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad de hijos</Label>
                  <Input
                    type="number"
                    min="0"
                    {...form4.register('cantidad_hijos', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                {...form4.register('observaciones')}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => setPasoActual(3)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-500">
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Crear cliente</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
