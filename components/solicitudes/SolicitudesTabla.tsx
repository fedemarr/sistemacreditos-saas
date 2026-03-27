'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { FileText } from 'lucide-react'

export function SolicitudesTabla({
  solicitudes,
  esAdmin,
}: {
  solicitudes: any[]
  esAdmin: boolean
}) {
  const router = useRouter()

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No hay solicitudes registradas</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Plan</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Comercio</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Capital</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuotas</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((s: any) => (
            <tr
              key={s.id}
              className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/solicitudes/${s.id}`)}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-white">
                  {s.clientes?.apellido}, {s.clientes?.nombre}
                </p>
                <p className="text-xs text-slate-400">
                  {s.clientes?.tipo_documento?.toUpperCase()} {formatDNI(s.clientes?.numero_documento ?? '')}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {s.planes_credito ? (
                  <div>
                    <p className="font-medium">{s.planes_credito.codigo}</p>
                    <p className="text-xs text-slate-400">{s.planes_credito.descripcion}</p>
                  </div>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {s.comercios?.nombre ?? '—'}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {formatMoneda(s.capital_pedido)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {s.cantidad_cuotas}
              </td>
              <td className="px-4 py-3">
                <StatusBadge estado={s.estado} />
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">
                {formatFecha(s.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
