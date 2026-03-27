'use client'

import { useState, useTransition } from 'react'
import { reporteMoraDetalladaAction } from '@/lib/actions/reportes'
import { Button } from '@/components/ui/button'
import { formatMoneda, formatFecha } from '@/lib/utils/formatters'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

function colorTramo(tramo: string) {
  if (tramo === '+90') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (tramo === '61-90') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (tramo === '31-60') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
}

function colorFilaTramo(tramo: string) {
  if (tramo === '+90') return 'bg-red-50/40 dark:bg-red-950/10'
  if (tramo === '61-90') return 'bg-orange-50/40 dark:bg-orange-950/10'
  if (tramo === '31-60') return 'bg-amber-50/40 dark:bg-amber-950/10'
  return ''
}

export function ReporteMora() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)
  const [tramoFiltro, setTramoFiltro] = useState('todos')

  function cargar() {
    startTransition(async () => {
      const result = await reporteMoraDetalladaAction()
      setDatos(result)
    })
  }

  const cuotasFiltradas = datos?.cuotas?.filter((c: any) =>
    tramoFiltro === 'todos' || c.tramo === tramoFiltro
  ) ?? []

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={cargar} disabled={isPending} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          {datos ? 'Actualizar' : 'Generar reporte'}
        </Button>
      </div>

      {datos && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Cuotas vencidas</p>
              <p className="text-2xl font-bold text-red-600">{datos.resumen.total_cuotas_vencidas}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Saldo vencido total</p>
              <p className="text-2xl font-bold text-amber-600">{formatMoneda(datos.resumen.saldo_vencido_total)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 md:col-span-1 col-span-2">
              <p className="text-xs text-slate-500 mb-2">Distribución por tramo</p>
              <div className="space-y-1">
                {datos.resumen.por_tramo.map((t: any) => (
                  <div key={t.tramo} className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${colorTramo(t.tramo)}`}>
                      {t.tramo} días
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {t.cantidad} cuotas · {formatMoneda(t.saldo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filtro por tramo */}
          <div className="flex gap-2 flex-wrap">
            {['todos', '1-30', '31-60', '61-90', '+90'].map(t => (
              <button key={t} onClick={() => setTramoFiltro(t)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  tramoFiltro === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                )}>
                {t === 'todos' ? 'Todos' : `${t} días`}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuota</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Vencimiento</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Días</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Saldo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tramo</th>
                </tr>
              </thead>
              <tbody>
                {cuotasFiltradas.map((c: any, i: number) => (
                  <tr key={i} className={cn('border-t border-slate-100 dark:border-slate-800', colorFilaTramo(c.tramo))}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-xs text-slate-900 dark:text-white">
                        {c.creditos?.clientes?.apellido}, {c.creditos?.clientes?.nombre}
                      </p>
                      {c.creditos?.clientes?.telefono && (
                        <p className="text-xs text-slate-400">{c.creditos.clientes.telefono}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      #{c.creditos?.numero_credito}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">#{c.numero_cuota}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {formatFecha(c.fecha_vencimiento)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', colorTramo(c.tramo))}>
                        {c.dias_atraso}d
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-xs">
                      {formatMoneda(c.saldo_pendiente)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', colorTramo(c.tramo))}>
                        {c.tramo}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={5} className="px-4 py-3 font-semibold">
                    TOTAL ({cuotasFiltradas.length} cuotas)
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatMoneda(cuotasFiltradas.reduce((a: number, c: any) => a + c.saldo_pendiente, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Hacé clic en "Generar reporte" para ver la mora detallada</p>
        </div>
      )}
    </div>
  )
}
