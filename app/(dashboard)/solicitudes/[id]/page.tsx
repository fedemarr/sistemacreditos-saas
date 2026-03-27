import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { obtenerSolicitudAction } from '@/lib/actions/solicitudes'
import { SolicitudDetalle } from '@/components/solicitudes/SolicitudDetalle'

export const metadata: Metadata = { title: 'Solicitud de Crédito' }

interface Props { params: Promise<{ id: string }> }

export default async function SolicitudPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('usuario_id', user.id)
    .single()

  const { solicitud } = await obtenerSolicitudAction(id)
  if (!solicitud) notFound()

  return (
    <SolicitudDetalle
      solicitud={solicitud as any}
      esAdmin={perfil?.rol === 'admin'}
    />
  )
}
