// ⚠️  SOLO usar en Server Actions o API Routes — NUNCA importar desde el frontend
// Este cliente usa la service_role key que bypasea el RLS (Row Level Security)
// Tener acceso total a la base de datos — usar con extremo cuidado
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
