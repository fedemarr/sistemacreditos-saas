import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AutorizacionesTabla } from '@/components/autorizaciones/AutorizacionesTabla'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Autorizaciones' }

export default async function AutorizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const { data } = await supabase
    .from('autorizaciones')
    .select(`
      *,
      clientes(nombre, apellido, numero_documento, tipo_documento),
      comercios(nombre, codigo)
    `)
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <PageHeader
        titulo="Autorizaciones"
        descripcion="Gestioná las autorizaciones previas a las solicitudes de crédito"
        acciones={
          <Button asChild className="gap-2">
            <Link href="/autorizaciones/nueva">
              <Plus className="w-4 h-4" /> Nueva autorización
            </Link>
          </Button>
        }
      />
      <AutorizacionesTabla autorizaciones={data ?? []} />
    </div>
  )
}
