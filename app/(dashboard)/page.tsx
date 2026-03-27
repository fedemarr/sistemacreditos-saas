import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  obtenerMetricasPrincipalesAction,
  obtenerCobranzaSemanaAction,
  obtenerUltimosCreditosAction,
} from '@/lib/actions/dashboard'
import { MetricaCard } from '@/components/dashboard/MetricaCard'
import { GraficoCobranza } from '@/components/dashboard/GraficoCobranza'
import { ProximosVencimientos } from '@/components/dashboard/ProximosVencimientos'
import { UltimosCreditosDashboard } from '@/components/dashboard/UltimosCreditosDashboard'
import {
  CreditCard, Users, DollarSign, AlertTriangle,
  TrendingUp, Wallet, ClipboardList,
} from 'lucide-react'
import { formatMoneda } from '@/lib/utils/formatters'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id, nombre, apellido')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const [metricas, cobranzaSemana, ultimosCreditos] = await Promise.all([
    obtenerMetricasPrincipalesAction(),
    obtenerCobranzaSemanaAction(),
    obtenerUltimosCreditosAction(),
  ])

  const horaActual = new Date().getHours()
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {saludo}, {perfil.nombre} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Métricas principales — fila 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricaCard
          titulo="Créditos activos"
          valor={metricas.creditos.activos.toString()}
          subtitulo={`${metricas.creditos.otorgados_mes} otorgados este mes`}
          icono={<CreditCard className="w-5 h-5" />}
          colorIcono="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          variacion={metricas.creditos.variacion_mes}
          variacionLabel="vs mes anterior"
        />
        <MetricaCard
          titulo="En mora"
          valor={metricas.mora.creditos_en_mora.toString()}
          subtitulo={`${metricas.mora.cuotas_vencidas} cuotas vencidas`}
          icono={<AlertTriangle className="w-5 h-5" />}
          colorIcono="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
        <MetricaCard
          titulo="Cobrado hoy"
          valor={formatMoneda(metricas.cobranza.cobrado_hoy)}
          subtitulo={`${formatMoneda(metricas.cobranza.cobrado_mes)} este mes`}
          icono={<DollarSign className="w-5 h-5" />}
          colorIcono="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
        <MetricaCard
          titulo="Total clientes"
          valor={metricas.clientes.total.toString()}
          subtitulo={`${metricas.clientes.nuevos_mes} nuevos este mes`}
          icono={<Users className="w-5 h-5" />}
          colorIcono="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Métricas secundarias — fila 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricaCard
          titulo="Saldo vencido total"
          valor={formatMoneda(metricas.mora.saldo_vencido)}
          icono={<AlertTriangle className="w-5 h-5" />}
          colorIcono="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
        <MetricaCard
          titulo="Capital otorgado mes"
          valor={formatMoneda(metricas.creditos.capital_otorgado_mes)}
          subtitulo={`${metricas.creditos.otorgados_mes} créditos`}
          icono={<TrendingUp className="w-5 h-5" />}
          colorIcono="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <MetricaCard
          titulo="Punitorio cobrado hoy"
          valor={formatMoneda(metricas.cobranza.punitorio_hoy)}
          icono={<Wallet className="w-5 h-5" />}
          colorIcono="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Gráfico + Vencimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GraficoCobranza datos={cobranzaSemana} />
        <ProximosVencimientos vencimientos={metricas.proximos_vencimientos as any} />
      </div>

      {/* Últimos créditos */}
      <UltimosCreditosDashboard creditos={ultimosCreditos as any} />
    </div>
  )
}
