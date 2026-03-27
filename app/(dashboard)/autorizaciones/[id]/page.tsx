import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { obtenerAutorizacionAction } from '@/lib/actions/autorizaciones'
import { AutorizacionDetalle } from '@/components/autorizaciones/AutorizacionDetalle'

export const metadata: Metadata = { title: 'Autorización' }

interface Props { params: Promise<{ id: string }> }

export default async function AutorizacionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('usuario_id', user.id)
    .maybeSingle()

  const { autorizacion } = await obtenerAutorizacionAction(id)
  if (!autorizacion) notFound()

  return (
    <AutorizacionDetalle
      autorizacion={autorizacion as any}
      esAdmin={(perfil as any)?.rol === 'admin'}
    />
  )
}
