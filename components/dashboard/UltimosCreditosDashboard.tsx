import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Credito {
  id: string
  numero_credito: number
  monto_otorgado: number
  estado: string
  fecha_otorgamiento: string
  clientes: { nombre: string; apellido: string; numero_documento: string } | null
}

export function UltimosCreditosDashboard({ creditos }: { creditos: Credito[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-500" />
          Últimos créditos
        </h3>
        <Link href="/creditos" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
      </div>

      {!creditos.length ? (
        <p className="text-sm text-slate-400 text-center py-4">Sin créditos registrados</p>
      ) : (
        <div className="space-y-2">
          {creditos.map(c => (
            <Link
              key={c.id}
              href={`/creditos/${c.id}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {c.clientes?.apellido}, {c.clientes?.nombre}
                </p>
                <p className="text-xs text-slate-500">
                  #{c.numero_credito} · {formatFecha(c.fecha_otorgamiento)}
                </p>
              </div>
              <div className="text-right ml-3 shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatMoneda(c.monto_otorgado)}
                  </p>
                </div>
                <StatusBadge estado={c.estado} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
