import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanesTabla } from '@/components/configuracion/PlanesTabla'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Planes de Crédito' }

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id, rol')
    .eq('usuario_id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (perfil.rol !== 'admin') redirect('/')

  const { data: planes } = await supabase
    .from('planes_credito')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .order('codigo')

  return (
    <div>
      <PageHeader
        titulo="Planes de Crédito"
        descripcion="Configurá los productos financieros disponibles"
        acciones={
          <Button asChild className="gap-2">
            <Link href="/configuracion/planes/nuevo">
              <Plus className="w-4 h-4" /> Nuevo plan
            </Link>
          </Button>
        }
      />
      <PlanesTabla planes={planes ?? []} />
    </div>
  )
}
