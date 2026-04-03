// Calculadora de amortización financiera.
// Soporta sistema francés (cuota fija), alemán (capital fijo) e interés directo.
// Esta lógica se usa al generar el plan de cuotas de un crédito.

import { addMonths, format } from 'date-fns'
import { SistemaAmortizacion, CuotaCalculada } from '@/types'
import { redondear } from '@/lib/utils/formatters'

interface ParametrosCredito {
  monto: number
  tasaAnual: number
  cantidadCuotas: number
  fechaPrimerVencimiento: string
  redondeo?: number        // Múltiplo de redondeo: 0 = sin redondeo, 50, 100, 500, etc.
  redondeoHacia?: 'arriba' | 'abajo' | 'cercano' // Por defecto 'cercano'
}

/**
 * Redondea un valor al múltiplo indicado.
 * Ej: redondearAMultiplo(19444.50, 100, 'arriba') => 19500
 *     redondearAMultiplo(19444.50, 100, 'abajo')  => 19400
 *     redondearAMultiplo(19444.50, 50, 'cercano') => 19450
 */
function redondearAMultiplo(
  valor: number,
  multiplo: number,
  hacia: 'arriba' | 'abajo' | 'cercano' = 'cercano'
): number {
  if (!multiplo || multiplo <= 0) return redondear(valor)
  if (hacia === 'arriba') return Math.ceil(valor / multiplo) * multiplo
  if (hacia === 'abajo') return Math.floor(valor / multiplo) * multiplo
  return Math.round(valor / multiplo) * multiplo
}

/**
 * SISTEMA FRANCÉS
 * Cuota mensual fija. Al principio más interés, al final más capital.
 * Fórmula: C = P * i / (1 - (1 + i)^-n)
 */
export function calcularAmortizacionFrancesa(
  params: ParametrosCredito
): CuotaCalculada[] {
  const {
    monto, tasaAnual, cantidadCuotas, fechaPrimerVencimiento,
    redondeo = 0, redondeoHacia = 'cercano',
  } = params

  const tasaMensual = tasaAnual / 100 / 12

  const cuotaBruta = tasaMensual === 0
    ? monto / cantidadCuotas
    : monto * (tasaMensual * Math.pow(1 + tasaMensual, cantidadCuotas)) /
      (Math.pow(1 + tasaMensual, cantidadCuotas) - 1)

  const cuotaFija = redondeo > 0
    ? redondearAMultiplo(cuotaBruta, redondeo, redondeoHacia)
    : redondear(cuotaBruta)

  const cuotas: CuotaCalculada[] = []
  let saldoRestante = monto
  const fechaBase = new Date(fechaPrimerVencimiento + 'T00:00:00')

  for (let i = 0; i < cantidadCuotas; i++) {
    const interes = redondear(saldoRestante * tasaMensual)
    const capital = redondear(cuotaFija - interes)

    const capitalReal = i === cantidadCuotas - 1
      ? redondear(saldoRestante)
      : capital

    const totalCuota = redondear(capitalReal + interes)
    saldoRestante = redondear(saldoRestante - capitalReal)

    cuotas.push({
      numero_cuota: i + 1,
      fecha_vencimiento: format(addMonths(fechaBase, i), 'yyyy-MM-dd'),
      capital: capitalReal,
      interes: interes,
      total: totalCuota,
      saldo_restante: Math.max(0, saldoRestante),
    })
  }

  return cuotas
}

/**
 * SISTEMA ALEMÁN
 * Capital fijo por cuota. Los intereses van bajando.
 * La cuota total decrece a lo largo del tiempo.
 */
export function calcularAmortizacionAlemana(
  params: ParametrosCredito
): CuotaCalculada[] {
  const {
    monto, tasaAnual, cantidadCuotas, fechaPrimerVencimiento,
  } = params

  const tasaMensual = tasaAnual / 100 / 12
  const capitalPorCuota = redondear(monto / cantidadCuotas)

  const cuotas: CuotaCalculada[] = []
  let saldoRestante = monto
  const fechaBase = new Date(fechaPrimerVencimiento + 'T00:00:00')

  for (let i = 0; i < cantidadCuotas; i++) {
    const interes = redondear(saldoRestante * tasaMensual)

    const capitalReal = i === cantidadCuotas - 1
      ? redondear(saldoRestante)
      : capitalPorCuota

    const totalCuota = redondear(capitalReal + interes)
    saldoRestante = redondear(saldoRestante - capitalReal)

    cuotas.push({
      numero_cuota: i + 1,
      fecha_vencimiento: format(addMonths(fechaBase, i), 'yyyy-MM-dd'),
      capital: capitalReal,
      interes: interes,
      total: totalCuota,
      saldo_restante: Math.max(0, saldoRestante),
    })
  }

  return cuotas
}

/**
 * INTERÉS DIRECTO (el más usado en financieras pequeñas)
 *
 * Cuota = (Capital + Interés total) / Cantidad cuotas
 * Interés total = Capital × Tasa mensual × Cantidad cuotas
 *
 * Todas las cuotas son iguales. No hay amortización decreciente.
 * El capital se divide en partes iguales.
 * El interés es el mismo en cada cuota.
 */
export function calcularAmortizacionDirecta(
  params: ParametrosCredito
): CuotaCalculada[] {
  const {
    monto, tasaAnual, cantidadCuotas, fechaPrimerVencimiento,
    redondeo = 0, redondeoHacia = 'cercano',
  } = params

  const tasaMensual = tasaAnual / 100 / 12

  // Interés total del crédito
  const interesTotalCredito = redondear(monto * tasaMensual * cantidadCuotas)

  // Total a pagar
  const totalCredito = monto + interesTotalCredito

  // Cuota bruta (sin redondeo)
  const cuotaBruta = totalCredito / cantidadCuotas

  // Cuota con redondeo opcional
  const cuotaFija = redondeo > 0
    ? redondearAMultiplo(cuotaBruta, redondeo, redondeoHacia)
    : redondear(cuotaBruta)

  // Capital e interés por cuota (proporcional)
  const capitalPorCuota = redondear(monto / cantidadCuotas)
  const interesPorCuota = redondear(cuotaFija - capitalPorCuota)

  const cuotas: CuotaCalculada[] = []
  let saldoRestante = monto
  const fechaBase = new Date(fechaPrimerVencimiento + 'T00:00:00')

  for (let i = 0; i < cantidadCuotas; i++) {
    const esUltima = i === cantidadCuotas - 1

    // En la última cuota ajustar capital para no dejar saldo residual
    const capitalReal = esUltima ? redondear(saldoRestante) : capitalPorCuota
    const totalCuota = esUltima
      ? redondear(capitalReal + interesPorCuota)
      : cuotaFija

    saldoRestante = redondear(saldoRestante - capitalReal)

    cuotas.push({
      numero_cuota: i + 1,
      fecha_vencimiento: format(addMonths(fechaBase, i), 'yyyy-MM-dd'),
      capital: capitalReal,
      interes: interesPorCuota,
      total: totalCuota,
      saldo_restante: Math.max(0, saldoRestante),
    })
  }

  return cuotas
}

/**
 * Función principal que elige el sistema según parámetro.
 */
export function calcularPlanDePagos(
  params: ParametrosCredito,
  sistema: SistemaAmortizacion
): CuotaCalculada[] {
  if (sistema === SistemaAmortizacion.ALEMAN) {
    return calcularAmortizacionAlemana(params)
  }
  if (sistema === SistemaAmortizacion.DIRECTO) {
    return calcularAmortizacionDirecta(params)
  }
  return calcularAmortizacionFrancesa(params)
}

/**
 * Calcula el monto total financiado (suma de todas las cuotas).
 */
export function calcularTotalFinanciado(cuotas: CuotaCalculada[]): number {
  return redondear(cuotas.reduce((acc, c) => acc + c.total, 0))
}

/**
 * Calcula el total de intereses que pagará el cliente.
 */
export function calcularTotalIntereses(cuotas: CuotaCalculada[]): number {
  return redondear(cuotas.reduce((acc, c) => acc + c.interes, 0))
}

/**
 * Opciones de redondeo disponibles para mostrar en el formulario.
 */
export const OPCIONES_REDONDEO = [
  { value: 0, label: 'Sin redondeo' },
  { value: 50, label: 'Múltiplo de $50' },
  { value: 100, label: 'Múltiplo de $100' },
  { value: 500, label: 'Múltiplo de $500' },
  { value: 1000, label: 'Múltiplo de $1.000' },
]
