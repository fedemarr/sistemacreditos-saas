import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReporteCobranza } from '@/components/reportes/ReporteCobranza'
import { ReporteCartera } from '@/components/reportes/ReporteCartera'
import { ReporteMora } from '@/components/reportes/ReporteMora'
import { ReporteVencimientos } from '@/components/reportes/ReporteVencimientos'
import { ReporteCreditosOtorgados } from '@/components/reportes/ReporteCreditosOtorgados'
import { ReporteClientes } from '@/components/reportes/ReporteClientes'
import {
  DollarSign, CreditCard, AlertTriangle,
  Calendar, TrendingUp, Users,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) redirect('/login')

  return (
    <div>
      <PageHeader
        titulo="Reportes"
        descripcion="Análisis completo de la operatoria"
      />

      <Tabs defaultValue="cobranza">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="cobranza" className="gap-2">
            <DollarSign className="w-4 h-4" /> Cobranza
          </TabsTrigger>
          <TabsTrigger value="cartera" className="gap-2">
            <CreditCard className="w-4 h-4" /> Cartera activa
          </TabsTrigger>
          <TabsTrigger value="mora" className="gap-2">
            <AlertTriangle className="w-4 h-4" /> Mora
          </TabsTrigger>
          <TabsTrigger value="vencimientos" className="gap-2">
            <Calendar className="w-4 h-4" /> Vencimientos
          </TabsTrigger>
          <TabsTrigger value="creditos" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Créditos otorgados
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="w-4 h-4" /> Clientes nuevos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cobranza"><ReporteCobranza /></TabsContent>
        <TabsContent value="cartera"><ReporteCartera /></TabsContent>
        <TabsContent value="mora"><ReporteMora /></TabsContent>
        <TabsContent value="vencimientos"><ReporteVencimientos /></TabsContent>
        <TabsContent value="creditos"><ReporteCreditosOtorgados /></TabsContent>
        <TabsContent value="clientes"><ReporteClientes /></TabsContent>
      </Tabs>
    </div>
  )
}
