import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CobranzaView } from '@/components/cobranza/CobranzaView'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Cobranza' }

export default async function CobranzaPage({
  searchParams,
}: {
  searchParams: Promise<{ cuota_id?: string; credito_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id, rol')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  let creditoInicial = null
  if (params.credito_id) {
    const { data } = await supabase
      .from('creditos')
      .select('id, numero_credito, estado, monto_otorgado, clientes(id, nombre, apellido, numero_documento, tipo_documento)')
      .eq('id', params.credito_id)
      .eq('empresa_id', perfil.empresa_id)
      .single()
    creditoInicial = data
  }

  return (
    <div>
      <PageHeader
        titulo="Cobranza"
        descripcion="Registrá pagos, gestioná cobros y cerrá la caja del día"
      />
      <CobranzaView
        creditoInicial={creditoInicial as any}
        cuotaIdInicial={params.cuota_id}
        esAdmin={perfil.rol === 'admin'}
        empresaId={perfil.empresa_id as string}
      />
    </div>
  )
}
