'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { procesarMoraAction } from '@/lib/actions/mora'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatMoneda, formatDNI } from '@/lib/utils/formatters'
import { AlertTriangle, RefreshCw, DollarSign, Phone, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistroMora {
  id: string
  numero_credito: number
  monto_otorgado: number
  estado: string
  cliente: { id: string; nombre: string; apellido: string; numero_documento: string; tipo_documento: string; telefono: string | null; estado: string }
  cantidad_cuotas_vencidas: number
  dias_atraso: number
  saldo_vencido: number
  punitorio_teorico: number
  total_a_regularizar: number
  cuota_mas_antigua: string | null
}

function colorAtraso(dias: number) {
  if (dias > 90) return 'text-red-600 dark:text-red-400 font-bold'
  if (dias > 30) return 'text-orange-500 dark:text-orange-400 font-semibold'
  return 'text-amber-500 dark:text-amber-400'
}

function badgeAtraso(dias: number) {
  if (dias > 90) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (dias > 60) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (dias > 30) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
}

export function MoraTabla({
  registrosIniciales,
  totalInicial,
  resumen,
}: {
  registrosIniciales: RegistroMora[]
  totalInicial: number
  resumen: { creditos_en_mora: number; saldo_vencido_total: number; cuotas_vencidas_total: number }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filtro, setFiltro] = useState('')
  const [diasFiltro, setDiasFiltro] = useState('todos')

  // Filtrado local (rápido, sin refetch)
  const registros = registrosIniciales.filter(r => {
    const busq = filtro.toLowerCase()
    const matchBusq = !busq || r.cliente.apellido.toLowerCase().includes(busq)
      || r.cliente.nombre.toLowerCase().includes(busq)
      || r.cliente.numero_documento.includes(busq)
      || r.numero_credito.toString().includes(busq)

    const matchDias = diasFiltro === 'todos'
      || (diasFiltro === '1-30' && r.dias_atraso <= 30)
      || (diasFiltro === '31-60' && r.dias_atraso > 30 && r.dias_atraso <= 60)
      || (diasFiltro === '61-90' && r.dias_atraso > 60 && r.dias_atraso <= 90)
      || (diasFiltro === '90+' && r.dias_atraso > 90)

    return matchBusq && matchDias
  })

  function handleProcesarMora() {
    startTransition(async () => {
      const result = await procesarMoraAction()
      if (result?.success) {
        toast.success(`${result.actualizadas} cuotas actualizadas, ${result.creditosAfectados} créditos afectados`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-500">Créditos en mora</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{resumen.creditos_en_mora}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500">Saldo vencido total</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatMoneda(resumen.saldo_vencido_total)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-slate-500">Cuotas vencidas</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{resumen.cuotas_vencidas_total}</p>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, DNI o N° crédito..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select defaultValue="todos" onValueChange={setDiasFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Días de atraso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="1-30">1 a 30 días</SelectItem>
              <SelectItem value="31-60">31 a 60 días</SelectItem>
              <SelectItem value="61-90">61 a 90 días</SelectItem>
              <SelectItem value="90+">Más de 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleProcesarMora} disabled={isPending} className="gap-2 shrink-0">
          <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
          Actualizar vencidas
        </Button>
      </div>

      <p className="text-sm text-slate-500">{registros.length} crédito{registros.length !== 1 ? 's' : ''} en mora</p>

      {/* Tabla */}
      {registros.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay créditos en mora con los filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Días atraso</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuotas vencidas</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Saldo vencido</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Punitorio</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total a regularizar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {r.cliente.apellido}, {r.cliente.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.cliente.tipo_documento?.toUpperCase()} {formatDNI(r.cliente.numero_documento)}
                    </p>
                    {r.cliente.telefono && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {r.cliente.telefono}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      #{r.numero_credito}
                    </p>
                    <p className="text-xs text-slate-400">{formatMoneda(r.monto_otorgado)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-sm px-2 py-0.5 rounded-full', badgeAtraso(r.dias_atraso))}>
                      {r.dias_atraso}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-red-500">{r.cantidad_cuotas_vencidas}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatMoneda(r.saldo_vencido)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-500">
                    {r.punitorio_teorico > 0 ? formatMoneda(r.punitorio_teorico) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatMoneda(r.total_a_regularizar)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => router.push(`/creditos/${r.id}`)}
                      >
                        Ver crédito
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-green-600 hover:bg-green-500"
                        onClick={() => router.push(`/cobranza?credito_id=${r.id}`)}
                      >
                        Cobrar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totales */}
            <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  TOTALES ({registros.length} créditos)
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                  {formatMoneda(registros.reduce((a, r) => a + r.saldo_vencido, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-500">
                  {formatMoneda(registros.reduce((a, r) => a + r.punitorio_teorico, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                  {formatMoneda(registros.reduce((a, r) => a + r.total_a_regularizar, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
