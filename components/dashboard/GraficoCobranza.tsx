'use client'

import { formatMoneda } from '@/lib/utils/formatters'

interface DiaCobranza {
  fecha: string
  label: string
  total: number
}

export function GraficoCobranza({ datos }: { datos: DiaCobranza[] }) {
  const maximo = Math.max(...datos.map(d => d.total), 1)
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Cobranza — últimos 7 días
      </h3>
      <p className="text-xs text-slate-400 mb-5">
        Total: {formatMoneda(datos.reduce((a, d) => a + d.total, 0))}
      </p>

      <div className="flex items-end gap-2 h-32">
        {datos.map(d => {
          const altura = maximo > 0 ? Math.max((d.total / maximo) * 100, d.total > 0 ? 8 : 0) : 0
          const esHoy = d.fecha === hoy

          return (
            <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="relative">
                {d.total > 0 && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatMoneda(d.total)}
                  </div>
                )}
              </div>
              {/* Barra */}
              <div className="w-full flex items-end justify-center" style={{ height: '112px' }}>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    esHoy ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-300 dark:group-hover:bg-blue-700'
                  }`}
                  style={{ height: `${altura}%`, minHeight: d.total > 0 ? '4px' : '2px' }}
                />
              </div>
              {/* Label */}
              <p className={`text-xs capitalize truncate w-full text-center ${esHoy ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                {d.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
