import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar sesión activa
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener perfil del usuario desde la base de datos
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('nombre, apellido, rol, empresa_id')
    .eq('usuario_id', user.id)
    .single()

  // Si no tiene perfil, el usuario existe en Auth pero no fue configurado correctamente
  if (!perfil) redirect('/login')

  const usuarioHeader = {
    nombre: perfil.nombre as string,
    apellido: perfil.apellido as string,
    rol: perfil.rol as string,
    email: user.email ?? '',
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={usuarioHeader} />

        {/* Área de contenido scrolleable */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
