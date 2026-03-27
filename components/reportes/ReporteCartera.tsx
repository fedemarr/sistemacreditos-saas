'use client'

import { useState, useTransition } from 'react'
import { reporteCarteraActivaAction } from '@/lib/actions/reportes'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatMoneda, formatFecha, formatDNI, formatPorcentaje } from '@/lib/utils/formatters'
import { CreditCard, RefreshCw } from 'lucide-react'

export function ReporteCartera() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)

  function cargar() {
    startTransition(async () => {
      const result = await reporteCarteraActivaAction()
      setDatos(result)
    })
  }

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
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total créditos', valor: datos.resumen.total_creditos.toString() },
              { label: 'Activos', valor: datos.resumen.activos.toString() },
              { label: 'En mora', valor: datos.resumen.en_mora.toString() },
              { label: 'Saldo total', valor: formatMoneda(datos.resumen.saldo_total) },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{valor}</p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Plan</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Capital</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Saldo</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuotas vencidas</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.creditos.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">
                      #{c.numero_credito}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-xs text-slate-900 dark:text-white">
                        {c.clientes?.apellido}, {c.clientes?.nombre}
                      </p>
                      <p className="text-xs text-slate-400">{c.clientes?.numero_documento}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs">
                      {c.planes_credito?.codigo ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs">{formatMoneda(c.monto_otorgado)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-xs">{formatMoneda(c.saldo_pendiente)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {c.cuotas_vencidas > 0
                        ? <span className="text-xs text-red-500 font-semibold">{c.cuotas_vencidas}</span>
                        : <span className="text-xs text-slate-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL ({datos.resumen.total_creditos})</td>
                  <td className="px-4 py-3 text-right font-bold">{formatMoneda(datos.resumen.capital_total)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatMoneda(datos.resumen.saldo_total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Hacé clic en "Generar reporte" para ver la cartera activa</p>
        </div>
      )}
    </div>
  )
}
