import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AutorizacionForm } from '@/components/autorizaciones/AutorizacionForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nueva Autorización' }

export default async function NuevaAutorizacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const [{ data: comercios }, { data: planes }] = await Promise.all([
    supabase.from('comercios').select('id, codigo, nombre').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('nombre'),
    supabase.from('planes_credito').select('id, codigo, descripcion, cantidad_cuotas, tasa_anual').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('codigo'),
  ])

  return (
    <div>
      <PageHeader
        titulo="Nueva Autorización"
        descripcion="Verificá el límite disponible antes de crear la solicitud"
        acciones={
          <Button variant="outline" asChild>
            <Link href="/autorizaciones" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <AutorizacionForm comercios={comercios ?? []} planes={planes ?? []} />
    </div>
  )
}
