'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { FileText } from 'lucide-react'

export function AutorizacionesTabla({ autorizaciones }: { autorizaciones: any[] }) {
  const router = useRouter()

  if (autorizaciones.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No hay autorizaciones registradas</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Comercio</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Capital pedido</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {autorizaciones.map((a: any) => (
            <tr
              key={a.id}
              className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/autorizaciones/${a.id}`)}
            >
              <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                #{a.numero_autorizacion}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-white">
                  {a.clientes?.apellido}, {a.clientes?.nombre}
                </p>
                <p className="text-xs text-slate-400">
                  {a.clientes?.tipo_documento?.toUpperCase()} {formatDNI(a.clientes?.numero_documento ?? '')}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {a.comercios ? `${a.comercios.codigo} - ${a.comercios.nombre}` : '—'}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {formatMoneda(a.capital_pedido)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge estado={a.estado} />
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">
                {formatFecha(a.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
