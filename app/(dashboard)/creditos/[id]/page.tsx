import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { obtenerCreditoAction } from '@/lib/actions/creditos'
import { CreditoDetalle } from '@/components/creditos/CreditoDetalle'

export const metadata: Metadata = { title: 'Detalle Crédito' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalleCreditoPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('rol')
    .eq('usuario_id', user.id)
    .single()

  const resultado = await obtenerCreditoAction(id)
  if (!resultado.credito) notFound()

  return (
    <CreditoDetalle
      credito={resultado.credito as any}
      cuotas={resultado.cuotas as any}
      garantes={resultado.garantes as any}
      stats={resultado.stats as any}
      esAdmin={perfil?.rol === 'admin'}
    />
  )
}
