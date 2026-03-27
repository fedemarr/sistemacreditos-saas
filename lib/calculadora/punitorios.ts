// Cálculo de punitorios (intereses de mora) sobre cuotas vencidas.
// Se aplica sobre el saldo pendiente de la cuota por cada día de atraso.
// Se llama desde el proceso de actualización de cuotas vencidas.

import { differenceInDays, parseISO } from 'date-fns'
import { redondear } from '@/lib/utils/formatters'

interface ParametrosPunitorio {
  saldoPendiente: number       // Monto que aún no fue pagado
  fechaVencimiento: string     // ISO string de cuando vencía la cuota
  tasaPunitorioDiaria: number  // Porcentaje diario (ej: 0.1 para 0.1% diario)
  diasGracia?: number          // Días después del vencimiento antes de aplicar punitorio
  fechaCalculo?: Date          // Fecha para calcular (por defecto hoy)
}

/**
 * Calcula el monto de punitorio para una cuota vencida.
 * Formula: saldo * tasaDiaria * diasAtraso
 */
export function calcularPunitorio(params: ParametrosPunitorio): number {
  const {
    saldoPendiente,
    fechaVencimiento,
    tasaPunitorioDiaria,
    diasGracia = 0,
    fechaCalculo = new Date(),
  } = params

  const vencimiento = parseISO(fechaVencimiento)

  // Calcular días de atraso reales
  const diasAtraso = differenceInDays(fechaCalculo, vencimiento)

  // Si no hay atraso o está dentro del período de gracia, no hay punitorio
  if (diasAtraso <= diasGracia) return 0

  // Días efectivos de punitorio (descontando días de gracia)
  const diasEfectivos = diasAtraso - diasGracia

  // Punitorio = saldo * (tasa diaria / 100) * días efectivos
  const punitorio = saldoPendiente * (tasaPunitorioDiaria / 100) * diasEfectivos

  return redondear(punitorio)
}

/**
 * Calcula el total a pagar de una cuota vencida (saldo + punitorio).
 */
export function calcularTotalConPunitorio(params: ParametrosPunitorio): {
  saldoPendiente: number
  punitorio: number
  totalAPagar: number
  diasAtraso: number
} {
  const {
    saldoPendiente,
    fechaVencimiento,
    diasGracia = 0,
    fechaCalculo = new Date(),
  } = params

  const vencimiento = parseISO(fechaVencimiento)
  const diasAtraso = Math.max(0, differenceInDays(fechaCalculo, vencimiento) - diasGracia)
  const punitorio = calcularPunitorio(params)
  const totalAPagar = redondear(saldoPendiente + punitorio)

  return {
    saldoPendiente,
    punitorio,
    totalAPagar,
    diasAtraso,
  }
}
