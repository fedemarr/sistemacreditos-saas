// Encabezado de página reutilizable.
// Se usa al inicio de cada página del dashboard para mantener consistencia visual.
// Acepta título, descripción y acciones opcionales (botones).

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  descripcion?: string
  acciones?: ReactNode  // Botones o controles en el lado derecho
  className?: string
}

export function PageHeader({ titulo, descripcion, acciones, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-8', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {titulo}
        </h1>
        {descripcion && (
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && (
        <div className="flex items-center gap-3 ml-4">
          {acciones}
        </div>
      )}
    </div>
  )
}
