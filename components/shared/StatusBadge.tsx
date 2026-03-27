// Badge de estado para mostrar en tablas y detalles.
// Cada estado tiene su color específico para reconocimiento visual rápido.
// Importar y usar con el enum correspondiente.

import { cn } from '@/lib/utils'
import { EstadoCliente, EstadoSolicitud, EstadoCredito, EstadoCuota } from '@/types/enums'

// Mapa de estados a estilos visuales
const estilosEstado: Record<string, string> = {
  // Cliente
  activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  moroso: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  inhabilitado: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  baja: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',

  // Solicitud
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  aprobado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rechazado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelado: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',

  // Crédito
  en_mora: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refinanciado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  incobrable: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',

  // Cuota
  pagada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  vencida: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  parcial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

// Mapa de estados a texto en español
const textoEstado: Record<string, string> = {
  activo: 'Activo',
  moroso: 'Moroso',
  inhabilitado: 'Inhabilitado',
  baja: 'Baja',
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  en_mora: 'En mora',
  refinanciado: 'Refinanciado',
  incobrable: 'Incobrable',
  pagada: 'Pagada',
  vencida: 'Vencida',
  parcial: 'Parcial',
}

type EstadoTipo =
  | EstadoCliente
  | EstadoSolicitud
  | EstadoCredito
  | EstadoCuota
  | string

interface StatusBadgeProps {
  estado: EstadoTipo
  className?: string
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const estilo = estilosEstado[estado] ?? 'bg-slate-100 text-slate-600'
  const texto = textoEstado[estado] ?? estado

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        estilo,
        className
      )}
    >
      {texto}
    </span>
  )
}
