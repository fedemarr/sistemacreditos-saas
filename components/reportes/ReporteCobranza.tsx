'use client'

import { useState, useTransition } from 'react'
import { reporteCobranzaAction } from '@/lib/actions/reportes'
import { FiltroFechas } from './FiltroFechas'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { DollarSign, TrendingUp, XCircle } from 'lucide-react'

const mediosLabel: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  cheque: 'Cheque', debito: 'Débito',
  retencion_haberes: 'Ret. haberes', otro: 'Otro',
}

export function ReporteCobranza() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)

  function buscar(desde: string, hasta: string) {
    startTransition(async () => {
      const result = await reporteCobranzaAction({ desde, hasta })
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
              { label: 'Total cobrado', valor: formatMoneda(datos.resumen.total_cobrado), icono: DollarSign, color: 'text-green-500' },
              { label: 'Punitorio cobrado', valor: formatMoneda(datos.resumen.total_punitorio), icono: TrendingUp, color: 'text-amber-500' },
              { label: 'Anulaciones', valor: formatMoneda(datos.resumen.total_anulado), icono: XCircle, color: 'text-red-500' },
              { label: 'Cantidad de pagos', valor: datos.resumen.cantidad_pagos.toString(), icono: DollarSign, color: 'text-blue-500' },
            ].map(({ label, valor, icono: Icono, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icono className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{valor}</p>
              </div>
            ))}
          </div>

          {/* Desglose por medio de pago */}
          {Object.keys(datos.resumen.por_medio).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Por medio de pago</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(datos.resumen.por_medio).map(([medio, monto]: any) => (
                  <div key={medio} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{mediosLabel[medio] ?? medio}</span>
                    <span className="font-semibold text-sm">{formatMoneda(monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de pagos */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Detalle de pagos ({datos.pagos.length})
              </h3>
            </div>
            {!datos.pagos.length ? (
              <div className="p-8 text-center text-slate-400 text-sm">Sin pagos en el período seleccionado</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Medio</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Monto</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Punitorio</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.pagos.map((p: any) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{formatFecha(p.fecha_pago)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-xs text-slate-900 dark:text-white">
                          {p.clientes?.apellido}, {p.clientes?.nombre}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.clientes?.tipo_documento?.toUpperCase()} {p.clientes?.numero_documento}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">
                        #{p.creditos?.numero_credito}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs capitalize">
                        {mediosLabel[p.medio_pago] ?? p.medio_pago}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatMoneda(p.monto_pagado)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-500 text-xs">
                        {p.punitorio_cobrado > 0 ? formatMoneda(p.punitorio_cobrado) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 font-semibold">TOTAL</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoneda(datos.resumen.total_cobrado)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">
                      {formatMoneda(datos.resumen.total_punitorio)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Seleccioná un período para ver el reporte</p>
        </div>
      )}
    </div>
  )
}
