import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SolicitudForm } from '@/components/solicitudes/SolicitudForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nueva Solicitud' }

export default async function NuevaSolicitudPage({
  searchParams,
}: {
  searchParams: Promise<{ autorizacion_id?: string; cliente_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  // Cargar datos necesarios para el formulario
  const [{ data: planes }, { data: comercios }, autorizacionData] = await Promise.all([
    supabase
      .from('planes_credito')
      .select('id, codigo, descripcion, cantidad_cuotas, tasa_anual, sistema_amortizacion, gastos_otorgamiento, cuota_retenida, es_plan_dni')
      .eq('empresa_id', perfil.empresa_id)
      .eq('activo', true)
      .order('codigo'),
    supabase
      .from('comercios')
      .select('id, codigo, nombre')
      .eq('empresa_id', perfil.empresa_id)
      .eq('activo', true)
      .order('nombre'),
    params.autorizacion_id
      ? supabase
          .from('autorizaciones')
          .select('*, clientes(id, nombre, apellido, numero_documento, tipo_documento, ingreso_mensual, limite_credito)')
          .eq('id', params.autorizacion_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // Si viene con cliente_id preseleccionado
  let clientePreseleccionado = null
  if (params.cliente_id && !autorizacionData?.data) {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, numero_documento, tipo_documento, ingreso_mensual, limite_credito')
      .eq('id', params.cliente_id)
      .single()
    clientePreseleccionado = data
  }

  return (
    <div>
      <PageHeader
        titulo="Nueva Solicitud de Crédito"
        descripcion="Completá los datos para crear la solicitud"
        acciones={
          <Button variant="outline" asChild>
            <Link href="/solicitudes" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <SolicitudForm
        planes={planes ?? []}
        comercios={comercios ?? []}
        autorizacion={autorizacionData?.data as any}
        clientePreseleccionado={clientePreseleccionado as any}
      />
    </div>
  )
}
