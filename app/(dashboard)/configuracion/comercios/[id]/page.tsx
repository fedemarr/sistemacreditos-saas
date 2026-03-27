import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComercioForm } from '@/components/configuracion/ComercioForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Editar Comercio' }

interface Props { params: Promise<{ id: string }> }

export default async function EditarComercioPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const { data: comercio } = await supabase
    .from('comercios')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!comercio) notFound()

  return (
    <div>
      <PageHeader
        titulo={comercio.nombre}
        descripcion={`Código: ${comercio.codigo}`}
        acciones={
          <Button variant="outline" asChild>
            <Link href="/configuracion/comercios" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <ComercioForm comercio={comercio as any} />
    </div>
  )
}
