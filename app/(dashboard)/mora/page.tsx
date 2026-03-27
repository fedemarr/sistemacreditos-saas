import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { obtenerCarteraMoraAction, obtenerResumenMoraAction } from '@/lib/actions/mora'
import { MoraTabla } from '@/components/mora/MoraTabla'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Mora' }

export default async function MoraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id, rol')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const [{ data: registros, total }, resumen] = await Promise.all([
    obtenerCarteraMoraAction(),
    obtenerResumenMoraAction(),
  ])

  return (
    <div>
      <PageHeader
        titulo="Mora"
        descripcion="Cartera de créditos con cuotas vencidas"
      />
      <MoraTabla
        registrosIniciales={registros as any}
        totalInicial={total}
        resumen={resumen as any}
      />
    </div>
  )
}
