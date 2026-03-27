import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientesTabla } from '@/components/clientes/ClientesTabla'
import { PageHeader } from '@/components/shared/PageHeader'
import { Cliente } from '@/types'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const supabase = await createClient()

  // Obtener empresa del usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // Cargar primera página de clientes en el servidor (SSR)
  const { data: clientes, count } = await supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false })
    .range(0, 19)

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        descripcion="Administrá tu base de clientes"
      />
      <ClientesTabla
        clientesIniciales={(clientes ?? []) as Cliente[]}
        totalInicial={count ?? 0}
      />
    </div>
  )
}
