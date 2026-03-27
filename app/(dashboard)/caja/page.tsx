import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { obtenerCajaDelDiaAction } from '@/lib/actions/pagos'
import { CajaDelDia } from '@/components/cobranza/CajaDelDia'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatFecha } from '@/lib/utils/formatters'

export const metadata: Metadata = { title: 'Caja del Día' }

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
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

  const resultado = await obtenerCajaDelDiaAction(params.fecha)
  const fechaMostrar = params.fecha ?? new Date().toISOString().split('T')[0]

  return (
    <div>
      <PageHeader titulo="Caja" descripcion={`Movimientos del ${formatFecha(fechaMostrar)}`} />
      {resultado.data ? (
        <CajaDelDia
          caja={resultado.data.caja as any}
          pagos={resultado.data.pagos}
          esAdmin={perfil.rol === 'admin'}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <p className="text-slate-400 text-sm">No hay movimientos de caja para este día.</p>
          <p className="text-slate-400 text-xs mt-1">La caja se crea automáticamente al registrar el primer pago.</p>
        </div>
      )}
    </div>
  )
}
