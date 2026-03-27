import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ComerciosTabla } from '@/components/configuracion/ComerciosTabla'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Comercios' }

export default async function ComerciosPage() {
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

  const { data: comercios } = await supabase
    .from('comercios')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .order('nombre')

  return (
    <div>
      <PageHeader
        titulo="Comercios Adheridos"
        descripcion="Gestioná los comercios que operan con la financiera"
        acciones={
          <Button asChild className="gap-2">
            <Link href="/configuracion/comercios/nuevo">
              <Plus className="w-4 h-4" /> Nuevo comercio
            </Link>
          </Button>
        }
      />
      <ComerciosTabla comercios={comercios ?? []} />
    </div>
  )
}
