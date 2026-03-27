import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  obtenerGestionesAction,
  obtenerPromesasPendientesAction,
  obtenerPromesasVencidasAction,
  obtenerResumenCRMAction,
} from '@/lib/actions/crm'
import { CRMView } from '@/components/crm/CRMView'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'CRM — Gestiones' }

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('empresa_id, rol').eq('usuario_id', user.id).single()
  if (!perfil) redirect('/login')

  const [resumen, { data: gestiones }, { data: promesasPendientes }, { data: promesasVencidas }] =
    await Promise.all([
      obtenerResumenCRMAction(),
      obtenerGestionesAction(),
      obtenerPromesasPendientesAction(),
      obtenerPromesasVencidasAction(),
    ])

  return (
    <div>
      <PageHeader
        titulo="CRM — Gestiones"
        descripcion="Historial de contactos, promesas de pago y seguimiento de mora"
      />
      <CRMView
        resumen={resumen as any}
        gestiones={gestiones}
        promesasPendientes={promesasPendientes}
        promesasVencidas={promesasVencidas}
      />
    </div>
  )
}
