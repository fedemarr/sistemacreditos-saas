// Calculadora de amortización financiera.
// Soporta sistema francés (cuota fija) y alemán (capital fijo).
// Esta lógica se usa al generar el plan de cuotas de un crédito.
// CRÍTICO: testeada con casos reales antes de usar en producción.

import { addMonths, format } from 'date-fns'
import { SistemaAmortizacion, CuotaCalculada } from '@/types'
import { redondear } from '@/lib/utils/formatters'

interface ParametrosCredito {
  monto: number           // Monto otorgado en pesos
  tasaAnual: number       // Tasa nominal anual en % (ej: 36 para 36%)
  cantidadCuotas: number  // Número de cuotas mensuales
  fechaPrimerVencimiento: string // ISO string "YYYY-MM-DD"
}

/**
 * SISTEMA FRANCÉS
 * La cuota mensual es fija durante toda la vida del crédito.
 * Al principio se paga más interés y menos capital.
 * Al final se paga más capital y menos interés (amortización creciente).
 *
 * Fórmula de la cuota: C = P * i / (1 - (1 + i)^-n)
 * Donde: P = capital, i = tasa mensual, n = número de cuotas
 */
export function calcularAmortizacionFrancesa(
  params: ParametrosCredito
): CuotaCalculada[] {
  const { monto, tasaAnual, cantidadCuotas, fechaPrimerVencimiento } = params

  // Convertir tasa anual a mensual
  const tasaMensual = tasaAnual / 100 / 12

  // Calcular cuota fija (formula del sistema francés)
  const cuotaFija = tasaMensual === 0
    ? monto / cantidadCuotas
    : monto * (tasaMensual * Math.pow(1 + tasaMensual, cantidadCuotas)) /
      (Math.pow(1 + tasaMensual, cantidadCuotas) - 1)

  const cuotas: CuotaCalculada[] = []
  let saldoRestante = monto
  const fechaBase = new Date(fechaPrimerVencimiento + 'T00:00:00')

  for (let i = 0; i < cantidadCuotas; i++) {
    const interes = redondear(saldoRestante * tasaMensual)
    const capital = redondear(cuotaFija - interes)
    
    // En la última cuota, ajustar por diferencias de redondeo
    const capitalReal = i === cantidadCuotas - 1
      ? redondear(saldoRestante)
      : capital

    const totalCuota = redondear(capitalReal + interes)
    saldoRestante = redondear(saldoRestante - capitalReal)

    // Calcular fecha de vencimiento (primer vencimiento + i meses)
    const fechaVencimiento = addMonths(fechaBase, i)

    cuotas.push({
      numero_cuota: i + 1,
      fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
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
 * El capital que se amortiza en cada cuota es fijo (monto / n).
 * Los intereses se calculan sobre el saldo, por lo que van bajando.
 * La cuota total decrece a lo largo del tiempo.
 * Paga menos intereses totales que el sistema francés.
 */
export function calcularAmortizacionAlemana(
  params: ParametrosCredito
): CuotaCalculada[] {
  const { monto, tasaAnual, cantidadCuotas, fechaPrimerVencimiento } = params

  const tasaMensual = tasaAnual / 100 / 12
  const capitalPorCuota = redondear(monto / cantidadCuotas)

  const cuotas: CuotaCalculada[] = []
  let saldoRestante = monto
  const fechaBase = new Date(fechaPrimerVencimiento + 'T00:00:00')

  for (let i = 0; i < cantidadCuotas; i++) {
    const interes = redondear(saldoRestante * tasaMensual)

    // En la última cuota, usar el saldo real para evitar diferencias de redondeo
    const capitalReal = i === cantidadCuotas - 1
      ? redondear(saldoRestante)
      : capitalPorCuota

    const totalCuota = redondear(capitalReal + interes)
    saldoRestante = redondear(saldoRestante - capitalReal)

    const fechaVencimiento = addMonths(fechaBase, i)

    cuotas.push({
      numero_cuota: i + 1,
      fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
      capital: capitalReal,
      interes: interes,
      total: totalCuota,
      saldo_restante: Math.max(0, saldoRestante),
    })
  }

  return cuotas
}

/**
 * Función principal que elige el sistema según parámetro.
 * Esta es la que se llama desde el Server Action de creación de crédito.
 */
export function calcularPlanDePagos(
  params: ParametrosCredito,
  sistema: SistemaAmortizacion
): CuotaCalculada[] {
  if (sistema === SistemaAmortizacion.ALEMAN) {
    return calcularAmortizacionAlemana(params)
  }
  return calcularAmortizacionFrancesa(params)
}

/**
 * Calcula el monto total financiado (suma de todas las cuotas).
 * Se guarda en el crédito para mostrar al cliente.
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
