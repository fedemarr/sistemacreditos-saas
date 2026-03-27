import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditosTabla } from '@/components/creditos/CreditosTabla'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Créditos' }

export default async function CreditosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const { data: creditos, count } = await supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, tasa_anual,
      cantidad_cuotas, estado, fecha_otorgamiento,
      monto_total_financiado, cuota_retenida,
      clientes(id, nombre, apellido, numero_documento, tipo_documento),
      planes_credito(codigo, descripcion)
    `, { count: 'exact' })
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <PageHeader
        titulo="Créditos"
        descripcion="Cartera de créditos activos y cancelados"
      />
      <CreditosTabla
        creditosIniciales={creditos ?? []}
        totalInicial={count ?? 0}
      />
    </div>
  )
}
