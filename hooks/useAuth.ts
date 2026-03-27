'use client'

// Hook para acceder al usuario autenticado y su perfil desde componentes cliente.
// Encapsula la lógica de Supabase Auth para no repetirla en cada componente.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PerfilUsuario } from '@/types'
import { User } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  perfil: PerfilUsuario | null
  loading: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Obtener sesión actual al montar el componente
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Cargar perfil desde la base de datos
        const { data: perfil } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('usuario_id', user.id)
          .single()

        setPerfil(perfil as PerfilUsuario | null)
      }

      setLoading(false)
    }

    getUser()

    // Suscribirse a cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setPerfil(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, perfil, loading }
}
