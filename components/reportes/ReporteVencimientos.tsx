'use client'

import { useState, useTransition } from 'react'
import { reporteVencimientosAction } from '@/lib/actions/reportes'
import { FiltroFechas } from './FiltroFechas'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatMoneda, formatFecha } from '@/lib/utils/formatters'
import { Calendar } from 'lucide-react'

export function ReporteVencimientos() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)

  function buscar(desde: string, hasta: string) {
    startTransition(async () => {
      const result = await reporteVencimientosAction({ desde, hasta })
      setDatos(result)
    })
  }

  return (
    <div className="space-y-5">
      <FiltroFechas onBuscar={buscar} cargando={isPending} />

      {datos && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total cuotas', valor: datos.resumen.total_cuotas.toString() },
              { label: 'Monto esperado', valor: formatMoneda(datos.resumen.total_esperado) },
              { label: 'Pendientes', valor: datos.resumen.pendientes.toString() },
              { label: 'Vencidas en período', valor: datos.resumen.vencidas.toString() },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{valor}</p>
              </div>
            ))}
          </div>

          {/* Tabla agrupada por fecha */}
          <div className="space-y-4">
            {Object.entries(datos.por_fecha).map(([fecha, cuotas]: any) => (
              <div key={fecha} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {formatFecha(fecha)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {cuotas.length} cuota{cuotas.length !== 1 ? 's' : ''} · {formatMoneda(cuotas.reduce((a: number, c: any) => a + c.saldo_pendiente, 0))}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {cuotas.map((c: any, i: number) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800 first:border-t-0">
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-medium text-slate-900 dark:text-white">
                            {c.creditos?.clientes?.apellido}, {c.creditos?.clientes?.nombre}
                          </p>
                          {c.creditos?.clientes?.telefono && (
                            <p className="text-xs text-slate-400">{c.creditos.clientes.telefono}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          #{c.creditos?.numero_credito}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">Cuota #{c.numero_cuota}</td>
                        <td className="px-4 py-2.5"><StatusBadge estado={c.estado} /></td>
                        <td className="px-4 py-2.5 text-right font-semibold text-xs">
                          {formatMoneda(c.saldo_pendiente)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Seleccioná un período para ver los vencimientos</p>
        </div>
      )}
    </div>
  )
}
