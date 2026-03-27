import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanForm } from '@/components/configuracion/PlanForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Editar Plan' }

interface Props { params: Promise<{ id: string }> }

export default async function EditarPlanPage({ params }: Props) {
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

  const { data: plan } = await supabase
    .from('planes_credito')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!plan) notFound()

  return (
    <div>
      <PageHeader
        titulo={`Plan ${plan.codigo}`}
        descripcion={plan.descripcion}
        acciones={
          <Button variant="outline" asChild>
            <Link href="/configuracion/planes" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <PlanForm plan={plan as any} />
    </div>
  )
}
