'use client'

import { useState, useTransition } from 'react'
import { reporteClientesNuevosAction } from '@/lib/actions/reportes'
import { FiltroFechas } from './FiltroFechas'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatFecha } from '@/lib/utils/formatters'
import { Users } from 'lucide-react'

export function ReporteClientes() {
  const [isPending, startTransition] = useTransition()
  const [datos, setDatos] = useState<any>(null)

  function buscar(desde: string, hasta: string) {
    startTransition(async () => {
      const result = await reporteClientesNuevosAction({ desde, hasta })
      setDatos(result)
    })
  }

  return (
    <div className="space-y-5">
      <FiltroFechas onBuscar={buscar} cargando={isPending} />

      {datos && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Clientes nuevos', valor: datos.resumen.total.toString() },
              { label: 'Activos', valor: datos.resumen.activos.toString() },
              { label: 'Pendientes verificación', valor: datos.resumen.pendientes.toString() },
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
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Alta</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.clientes.map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-xs text-slate-900 dark:text-white">
                        {c.apellido}, {c.nombre}
                      </p>
                      {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {c.tipo_documento?.toUpperCase()} {c.numero_documento}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {c.telefono ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 capitalize">
                      {c.categoria ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {formatFecha(c.created_at)}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!datos && !isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Seleccioná un período para ver los clientes nuevos</p>
        </div>
      )}
    </div>
  )
}
