// Helpers de cálculo para cobranza. Funciones puras, sin side effects.

export interface CuotaParaPago {
  id: string
  credito_id: string
  numero_cuota: number
  fecha_vencimiento: string
  capital: number
  interes: number
  iva: number
  importe_total: number
  punitorio_aplicado: number
  monto_acumulado_pagado: number
  saldo_pendiente: number
  estado: string
}

export interface ResultadoCancelacionAnticipada {
  total_vencido: number
  total_capital_futuro: number
  total_punitorios: number
  total_a_pagar: number
  ahorro_intereses: number
  detalle: {
    cuota_id: string
    numero_cuota: number
    tipo: 'vencida' | 'futura'
    monto_capital: number
    monto_interes: number
    monto_iva: number
    monto_punitorio: number
    monto_total: number
  }[]
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcularPunitorio(params: {
  saldoPendiente: number
  fechaVencimiento: string
  tasaDiaria: number
  diasGracia: number
  fechaCalculo?: Date
}): number {
  const { saldoPendiente, fechaVencimiento, tasaDiaria, diasGracia, fechaCalculo = new Date() } = params
  const vencimiento = new Date(fechaVencimiento + 'T00:00:00')
  const hoy = new Date(fechaCalculo.toISOString().split('T')[0] + 'T00:00:00')
  if (hoy <= vencimiento) return 0
  const msPerDay = 1000 * 60 * 60 * 24
  const diasAtraso = Math.floor((hoy.getTime() - vencimiento.getTime()) / msPerDay)
  const diasEfectivos = Math.max(0, diasAtraso - diasGracia)
  if (diasEfectivos === 0) return 0
  return redondear(saldoPendiente * (tasaDiaria / 100) * diasEfectivos)
}

export function distribuirPagoParcial(params: {
  montoPagado: number
  cuota: CuotaParaPago
}): { capital: number; interes: number; iva: number } {
  const { montoPagado, cuota } = params
  const base = Math.max(cuota.importe_total, 1)
  const capitalPagado = redondear(cuota.monto_acumulado_pagado * (cuota.capital / base))
  const interesPagado = redondear(cuota.monto_acumulado_pagado * (cuota.interes / base))
  const ivaPagado = redondear(cuota.monto_acumulado_pagado * (cuota.iva / base))
  const capitalPend = redondear(cuota.capital - capitalPagado)
  const interesPend = redondear(cuota.interes - interesPagado)
  const ivaPend = redondear(cuota.iva - ivaPagado)
  const total = cuota.saldo_pendiente
  if (total <= 0) return { capital: 0, interes: 0, iva: 0 }
  return {
    capital: redondear(montoPagado * (capitalPend / total)),
    interes: redondear(montoPagado * (interesPend / total)),
    iva: redondear(montoPagado * (ivaPend / total)),
  }
}

export function calcularNuevoEstadoCuota(params: {
  nuevoSaldo: number
  fechaVencimiento: string
  fechaCalculo?: Date
}): 'pagada' | 'parcial' | 'vencida' | 'pendiente' {
  const { nuevoSaldo, fechaVencimiento, fechaCalculo = new Date() } = params
  if (nuevoSaldo <= 0) return 'pagada'
  const vencimiento = new Date(fechaVencimiento + 'T00:00:00')
  const hoy = new Date(fechaCalculo.toISOString().split('T')[0] + 'T00:00:00')
  if (hoy > vencimiento) return 'vencida'
  return 'parcial'
}

export function calcularImputacionPagoTotal(params: {
  cuota: CuotaParaPago
  punitorio: number
}) {
  const { cuota, punitorio } = params
  const base = Math.max(cuota.importe_total, 1)
  const capitalPagado = redondear(cuota.monto_acumulado_pagado * (cuota.capital / base))
  const interesPagado = redondear(cuota.monto_acumulado_pagado * (cuota.interes / base))
  const ivaPagado = redondear(cuota.monto_acumulado_pagado * (cuota.iva / base))
  return {
    monto_capital: redondear(cuota.capital - capitalPagado),
    monto_interes: redondear(cuota.interes - interesPagado),
    monto_iva: redondear(cuota.iva - ivaPagado),
    monto_punitorio: punitorio,
    monto_total: redondear(cuota.saldo_pendiente + punitorio),
  }
}

export function calcularCancelacionAnticipada(params: {
  cuotas: CuotaParaPago[]
  tasaDiaria: number
  diasGracia: number
  fechaCalculo?: Date
}): ResultadoCancelacionAnticipada {
  const { cuotas, tasaDiaria, diasGracia, fechaCalculo = new Date() } = params
  const hoy = new Date(fechaCalculo.toISOString().split('T')[0] + 'T00:00:00')
  let totalVencido = 0
  let totalCapitalFuturo = 0
  let totalPunitorios = 0
  let ahorroIntereses = 0
  const detalle: ResultadoCancelacionAnticipada['detalle'] = []

  const pendientes = cuotas.filter(c => c.estado !== 'pagada' && c.saldo_pendiente > 0)

  for (const cuota of pendientes) {
    const vencimiento = new Date(cuota.fecha_vencimiento + 'T00:00:00')
    const estaVencida = hoy > vencimiento

    if (estaVencida) {
      const punitorio = calcularPunitorio({
        saldoPendiente: cuota.saldo_pendiente,
        fechaVencimiento: cuota.fecha_vencimiento,
        tasaDiaria, diasGracia, fechaCalculo,
      })
      const montoTotal = redondear(cuota.saldo_pendiente + punitorio)
      totalVencido += montoTotal
      totalPunitorios += punitorio
      detalle.push({
        cuota_id: cuota.id, numero_cuota: cuota.numero_cuota, tipo: 'vencida',
        monto_capital: cuota.capital, monto_interes: cuota.interes,
        monto_iva: cuota.iva, monto_punitorio: punitorio, monto_total: montoTotal,
      })
    } else {
      const base = Math.max(cuota.importe_total, 1)
      const capitalPagado = redondear(cuota.monto_acumulado_pagado * (cuota.capital / base))
      const capitalPend = redondear(cuota.capital - capitalPagado)
      totalCapitalFuturo += capitalPend
      ahorroIntereses += redondear(cuota.interes + cuota.iva)
      detalle.push({
        cuota_id: cuota.id, numero_cuota: cuota.numero_cuota, tipo: 'futura',
        monto_capital: capitalPend, monto_interes: 0, monto_iva: 0,
        monto_punitorio: 0, monto_total: capitalPend,
      })
    }
  }

  return {
    total_vencido: redondear(totalVencido),
    total_capital_futuro: redondear(totalCapitalFuturo),
    total_punitorios: redondear(totalPunitorios),
    total_a_pagar: redondear(totalVencido + totalCapitalFuturo),
    ahorro_intereses: redondear(ahorroIntereses),
    detalle,
  }
}
