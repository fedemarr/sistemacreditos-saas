import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientesTabla } from '@/components/clientes/ClientesTabla'
import { PageHeader } from '@/components/shared/PageHeader'
import { Cliente } from '@/types'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // No cargamos clientes al inicio — la tabla arranca vacía
  // El usuario tiene que buscar para ver resultados

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        descripcion="Buscá un cliente por nombre, apellido o DNI"
      />
      <ClientesTabla
        clientesIniciales={[]}
        totalInicial={0}
      />
    </div>
  )
}
