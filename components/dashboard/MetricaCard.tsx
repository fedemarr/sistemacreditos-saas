import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricaCardProps {
  titulo: string
  valor: string
  subtitulo?: string
  icono: React.ReactNode
  colorIcono?: string
  variacion?: number   // % de variación vs período anterior
  variacionLabel?: string
  onClick?: () => void
}

export function MetricaCard({
  titulo, valor, subtitulo, icono, colorIcono = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  variacion, variacionLabel, onClick,
}: MetricaCardProps) {
  const tieneVariacion = variacion !== undefined
  const positivo = (variacion ?? 0) > 0
  const neutro = (variacion ?? 0) === 0

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5 transition-all',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorIcono)}>
          {icono}
        </div>
        {tieneVariacion && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            neutro ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : positivo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {neutro ? <Minus className="w-3 h-3" />
              : positivo ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {neutro ? 'Sin cambios' : `${positivo ? '+' : ''}${variacion}%`}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{valor}</p>
      <p className="text-sm text-slate-500">{titulo}</p>
      {subtitulo && <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>}
      {variacionLabel && <p className="text-xs text-slate-400 mt-1">{variacionLabel}</p>}
    </div>
  )
}
