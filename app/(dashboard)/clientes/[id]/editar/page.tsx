import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { obtenerClienteAction } from '@/lib/actions/clientes'
import { createClient } from '@/lib/supabase/server'
import { ClienteEditarForm } from '@/components/clientes/ClienteEditarForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Editar Cliente' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resultado = await obtenerClienteAction(id)
  if (!resultado.cliente) notFound()

  return (
    <div>
      <PageHeader
        titulo="Editar Cliente"
        descripcion={`${resultado.cliente.apellido}, ${resultado.cliente.nombre}`}
        acciones={
          <Button variant="outline" asChild>
            <Link href={`/clientes/${id}`} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <ClienteEditarForm
        cliente={resultado.cliente as any}
        laboral={resultado.laboral as any}
        referencias={resultado.referencias as any}
        familiar={resultado.familiar as any}
      />
    </div>
  )
}
