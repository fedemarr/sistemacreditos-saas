'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import {
  ClipboardList, Calendar, AlertTriangle,
  Phone, MessageSquare, DollarSign, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tipoLabel: Record<string, string> = {
  llamado: 'Llamado', whatsapp: 'WhatsApp', email: 'Email',
  carta: 'Carta', visita: 'Visita', convenio: 'Convenio', otro: 'Otro',
}

const resultadoLabel: Record<string, string> = {
  contactado: 'Contactado', sin_respuesta: 'Sin respuesta',
  numero_incorrecto: 'N° incorrecto', promesa_pago: 'Promesa de pago',
  rechazo: 'Rechazo', pago_recibido: 'Pago recibido',
  convenio_acordado: 'Convenio acordado', otro: 'Otro',
}

const resultadoColor: Record<string, string> = {
  contactado: 'bg-green-100 text-green-700',
  sin_respuesta: 'bg-slate-100 text-slate-600',
  numero_incorrecto: 'bg-red-100 text-red-600',
  promesa_pago: 'bg-blue-100 text-blue-700',
  rechazo: 'bg-red-100 text-red-700',
  pago_recibido: 'bg-emerald-100 text-emerald-700',
  convenio_acordado: 'bg-purple-100 text-purple-700',
  otro: 'bg-slate-100 text-slate-600',
}

interface CRMViewProps {
  resumen: {
    total_gestiones: number
    gestiones_semana: number
    promesas_pendientes: number
    promesas_vencidas: number
  }
  gestiones: any[]
  promesasPendientes: any[]
  promesasVencidas: any[]
}

export function CRMView({ resumen, gestiones, promesasPendientes, promesasVencidas }: CRMViewProps) {
  const router = useRouter()
  const [filtroResultado, setFiltroResultado] = useState('todos')

  const gestionesFiltradas = gestiones.filter(g =>
    filtroResultado === 'todos' || g.resultado === filtroResultado
  )

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total gestiones', valor: resumen.total_gestiones, icono: ClipboardList, color: 'text-blue-500' },
          { label: 'Última semana', valor: resumen.gestiones_semana, icono: TrendingUp, color: 'text-green-500' },
          { label: 'Promesas pendientes', valor: resumen.promesas_pendientes, icono: Calendar, color: 'text-blue-500' },
          { label: 'Promesas vencidas', valor: resumen.promesas_vencidas, icono: AlertTriangle, color: 'text-red-500', valColor: 'text-red-600' },
        ].map(({ label, valor, icono: Icono, color, valColor }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icono className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${valColor ?? 'text-slate-900 dark:text-white'}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gestiones">
        <TabsList>
          <TabsTrigger value="gestiones" className="gap-2">
            <ClipboardList className="w-4 h-4" /> Todas las gestiones
          </TabsTrigger>
          <TabsTrigger value="promesas" className="gap-2">
            <Calendar className="w-4 h-4" />
            Promesas pendientes
            {resumen.promesas_pendientes > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {resumen.promesas_pendientes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vencidas" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Promesas vencidas
            {resumen.promesas_vencidas > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {resumen.promesas_vencidas}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Todas las gestiones */}
        <TabsContent value="gestiones" className="space-y-4">
          <div className="flex gap-3">
            <Select defaultValue="todos" onValueChange={setFiltroResultado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los resultados</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="promesa_pago">Promesa de pago</SelectItem>
                <SelectItem value="sin_respuesta">Sin respuesta</SelectItem>
                <SelectItem value="rechazo">Rechazo</SelectItem>
                <SelectItem value="pago_recibido">Pago recibido</SelectItem>
                <SelectItem value="convenio_acordado">Convenio acordado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 self-center">{gestionesFiltradas.length} gestiones</p>
          </div>

          {!gestionesFiltradas.length ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-8 text-center">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No hay gestiones registradas</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Resultado</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Observaciones</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {gestionesFiltradas.map((g: any) => (
                    <tr key={g.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatFecha(g.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white text-xs">
                          {g.clientes?.apellido}, {g.clientes?.nombre}
                        </p>
                        {g.clientes?.telefono && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {g.clientes.telefono}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          #{g.creditos?.numero_credito}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {tipoLabel[g.tipo] ?? g.tipo}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${resultadoColor[g.resultado] ?? 'bg-slate-100 text-slate-600'}`}>
                          {resultadoLabel[g.resultado] ?? g.resultado}
                        </span>
                        {g.resultado === 'promesa_pago' && g.promesa_fecha && (
                          <p className="text-xs text-blue-600 mt-1">{formatFecha(g.promesa_fecha)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                        {g.observaciones ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => router.push(`/creditos/${g.creditos?.id}`)}>
                          Ver crédito
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* TAB: Promesas pendientes */}
        <TabsContent value="promesas">
          <PromesasTabla
            promesas={promesasPendientes}
            tipo="pendientes"
            onVerCredito={id => router.push(`/creditos/${id}`)}
            onCobrar={id => router.push(`/cobranza?credito_id=${id}`)}
          />
        </TabsContent>

        {/* TAB: Promesas vencidas */}
        <TabsContent value="vencidas">
          <PromesasTabla
            promesas={promesasVencidas}
            tipo="vencidas"
            onVerCredito={id => router.push(`/creditos/${id}`)}
            onCobrar={id => router.push(`/cobranza?credito_id=${id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PromesasTabla({ promesas, tipo, onVerCredito, onCobrar }: {
  promesas: any[]
  tipo: 'pendientes' | 'vencidas'
  onVerCredito: (id: string) => void
  onCobrar: (id: string) => void
}) {
  const hoy = new Date().toISOString().split('T')[0]

  if (!promesas.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-8 text-center">
        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">
          {tipo === 'pendientes' ? 'No hay promesas de pago pendientes' : 'No hay promesas vencidas'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
              {tipo === 'pendientes' ? 'Fecha prometida' : 'Fecha vencida'}
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Monto prometido</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Observaciones</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {promesas.map((p: any) => {
            const diasDiff = p.promesa_fecha
              ? Math.floor((new Date(hoy).getTime() - new Date(p.promesa_fecha + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
              : 0
            return (
              <tr key={p.id} className={cn(
                'border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40',
                tipo === 'vencidas' && 'bg-red-50/30 dark:bg-red-950/10'
              )}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white text-xs">
                    {p.clientes?.apellido}, {p.clientes?.nombre}
                  </p>
                  {p.clientes?.telefono && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {p.clientes.telefono}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">
                    #{p.creditos?.numero_credito}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className={cn('text-sm font-medium', tipo === 'vencidas' ? 'text-red-600' : 'text-slate-900 dark:text-white')}>
                    {formatFecha(p.promesa_fecha)}
                  </p>
                  {tipo === 'vencidas' && diasDiff > 0 && (
                    <p className="text-xs text-red-500">{diasDiff}d vencida</p>
                  )}
                  {tipo === 'pendientes' && diasDiff < 0 && (
                    <p className="text-xs text-blue-500">en {Math.abs(diasDiff)}d</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                  {p.promesa_monto ? formatMoneda(p.promesa_monto) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                  {p.observaciones ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => onVerCredito(p.creditos?.id)}>
                      Ver
                    </Button>
                    <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-500"
                      onClick={() => onCobrar(p.creditos?.id)}>
                      Cobrar
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
