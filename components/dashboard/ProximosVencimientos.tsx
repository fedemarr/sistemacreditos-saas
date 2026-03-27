import { formatMoneda, formatFecha } from '@/lib/utils/formatters'
import { Calendar, AlertTriangle } from 'lucide-react'

interface Vencimiento {
  numero_cuota: number
  fecha_vencimiento: string
  total: number
  saldo_pendiente: number
  credito_id: string
  creditos: { numero_credito: number; clientes: { nombre: string; apellido: string } | null } | null
}

export function ProximosVencimientos({ vencimientos }: { vencimientos: Vencimiento[] }) {
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-500" />
        Próximos vencimientos (7 días)
      </h3>

      {!vencimientos.length ? (
        <p className="text-sm text-slate-400 text-center py-4">No hay vencimientos en los próximos 7 días</p>
      ) : (
        <div className="space-y-2">
          {vencimientos.map((v, i) => {
            const diasRestantes = Math.ceil(
              (new Date(v.fecha_vencimiento + 'T00:00:00').getTime() - new Date(hoy + 'T00:00:00').getTime())
              / (1000 * 60 * 60 * 24)
            )
            const esHoy = v.fecha_vencimiento === hoy
            const esMañana = diasRestantes === 1

            return (
              <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                esHoy ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30'
                  : esMañana ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30'
                  : 'bg-slate-50 dark:bg-slate-800/50'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {v.creditos?.clientes?.apellido}, {v.creditos?.clientes?.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    Crédito #{v.creditos?.numero_credito} · Cuota {v.numero_cuota}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatMoneda(v.saldo_pendiente)}
                  </p>
                  <p className={`text-xs font-medium ${
                    esHoy ? 'text-red-600' : esMañana ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {esHoy ? '⚠ Hoy' : esMañana ? 'Mañana' : formatFecha(v.fecha_vencimiento)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
