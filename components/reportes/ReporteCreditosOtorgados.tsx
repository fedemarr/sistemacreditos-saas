'use client'

import { useState, useTransition } from 'react'
import { reporteCreditosOtorgadosAction } from '@/lib/actions/reportes'
import { FiltroFechas } from './FiltroFechas'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatMoneda, formatFecha, formatPorcentaje } from '@/lib/utils/formatters'
import { TrendingUp } from 'lucide-react'

export function ReporteCreditosOtorgados() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)

  function buscar(desde: string, hasta: string) {
    startTransition(async () => {
      const result = await reporteCreditosOtorgadosAction({ desde, hasta })
      setDatos(result)
    })
  }

  return (
    <div className="space-y-5">
      <FiltroFechas onBuscar={buscar} cargando={isPending} />

      {datos && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Créditos otorgados', valor: datos.resumen.total_creditos.toString() },
              { label: 'Capital total', valor: formatMoneda(datos.resumen.capital_total) },
              { label: 'Total financiado', valor: formatMoneda(datos.resumen.financiado_total) },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{valor}</p>
              </div>
            ))}
          </div>

          {/* Distribución por plan */}
          {Object.keys(datos.resumen.por_plan).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Por plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(datos.resumen.por_plan).map(([plan, info]: any) => (
                  <div key={plan} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{plan}</p>
                    <p className="text-xs text-slate-500">{info.cantidad} créditos</p>
                    <p className="text-sm font-bold mt-1">{formatMoneda(info.capital)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Capital</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total financiado</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuotas</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.creditos.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">#{c.numero_credito}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-xs text-slate-900 dark:text-white">
                        {c.clientes?.apellido}, {c.clientes?.nombre}
                      </p>
                      <p className="text-xs text-slate-400">{c.clientes?.numero_documento}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">{c.planes_credito?.codigo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{formatFecha(c.fecha_otorgamiento)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-xs">{formatMoneda(c.monto_otorgado)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-600 dark:text-slate-300">{formatMoneda(c.monto_total_financiado)}</td>
                    <td className="px-4 py-2.5 text-center text-xs text-slate-600 dark:text-slate-300">{c.cantidad_cuotas}</td>
                    <td className="px-4 py-2.5"><StatusBadge estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="px-4 py-3 font-semibold">TOTAL ({datos.resumen.total_creditos})</td>
                  <td className="px-4 py-3 text-right font-bold">{formatMoneda(datos.resumen.capital_total)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatMoneda(datos.resumen.financiado_total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Seleccioná un período para ver los créditos otorgados</p>
        </div>
      )}
    </div>
  )
}
