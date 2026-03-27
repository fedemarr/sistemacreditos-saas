import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { obtenerClienteAction } from '@/lib/actions/clientes'
import { ClienteDetalle } from '@/components/clientes/ClienteDetalle'

export const metadata: Metadata = { title: 'Detalle Cliente' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalleClientePage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resultado = await obtenerClienteAction(id)

  if (!resultado.cliente) notFound()

  return (
    <ClienteDetalle
      cliente={resultado.cliente as any}
      laboral={resultado.laboral as any}
      referencias={resultado.referencias as any}
      familiar={resultado.familiar as any}
      tramites={resultado.tramites as any}
      creditos={resultado.creditos as any}
    />
  )
}
