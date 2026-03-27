'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  calcularPunitorio, calcularNuevoEstadoCuota,
  calcularImputacionPagoTotal, distribuirPagoParcial,
  calcularCancelacionAnticipada, redondear,
  type CuotaParaPago,
} from '@/lib/calculadora/cobranza'

async function getContexto() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('empresa_id, rol').eq('usuario_id', user.id).single()
  if (!perfil) throw new Error('Perfil no encontrado')
  return { supabase, user, empresa_id: perfil.empresa_id as string, rol: perfil.rol as string }
}

async function getConfigEmpresa(supabase: any, empresa_id: string) {
  const { data } = await supabase.from('empresas')
    .select('punitorio_diario_default, dias_gracia').eq('id', empresa_id).single()
  return { tasaDiaria: data?.punitorio_diario_default ?? 0.10, diasGracia: data?.dias_gracia ?? 0 }
}

async function obtenerOCrearCierreCaja(supabase: any, empresa_id: string): Promise<string> {
  const hoy = new Date().toISOString().split('T')[0]
  const { data: existente } = await supabase.from('cierre_caja')
    .select('id, estado').eq('empresa_id', empresa_id).eq('fecha', hoy).is('sucursal_id', null).single()
  if (existente) {
    if (existente.estado === 'cerrado') throw new Error('La caja del día ya fue cerrada.')
    return existente.id
  }
  const { data: nuevo, error } = await supabase.from('cierre_caja').insert({
    empresa_id, fecha: hoy, estado: 'abierto',
    total_cobrado: 0, total_anulado: 0, total_punitorio: 0, desglose_medios: {},
  }).select('id').single()
  if (error || !nuevo) throw new Error('Error al crear cierre de caja: ' + error?.message)
  return nuevo.id
}

async function actualizarCaja(
  supabase: any, cierreCajaId: string, monto: number,
  medioPago: string, punitorio: number = 0, esAnulacion: boolean = false
) {
  const { data: caja } = await supabase.from('cierre_caja')
    .select('total_cobrado, total_anulado, total_punitorio, desglose_medios').eq('id', cierreCajaId).single()
  if (!caja) return
  const desglose = caja.desglose_medios ?? {}
  if (!esAnulacion) desglose[medioPago] = redondear((desglose[medioPago] ?? 0) + monto)
  await supabase.from('cierre_caja').update({
    total_cobrado: esAnulacion ? caja.total_cobrado : redondear(caja.total_cobrado + monto),
    total_anulado: esAnulacion ? redondear(caja.total_anulado + monto) : caja.total_anulado,
    total_punitorio: esAnulacion ? caja.total_punitorio : redondear(caja.total_punitorio + punitorio),
    desglose_medios: desglose,
  }).eq('id', cierreCajaId)
}

async function recalcularEstadoCredito(supabase: any, credito_id: string, empresa_id: string) {
  const { data: cuotas } = await supabase.from('cuotas').select('estado').eq('credito_id', credito_id)
  if (!cuotas?.length) return
  const todasPagadas = cuotas.every((c: any) => c.estado === 'pagada')
  const hayVencidas = cuotas.some((c: any) => c.estado === 'vencida')
  const nuevoEstado = todasPagadas ? 'cancelado' : hayVencidas ? 'en_mora' : 'activo'
  const { data: credito } = await supabase.from('creditos').select('estado, cliente_id').eq('id', credito_id).single()
  if (!credito || credito.estado === nuevoEstado) return
  await supabase.from('creditos').update({ estado: nuevoEstado }).eq('id', credito_id)
  if (nuevoEstado === 'cancelado') {
    const { data: otros } = await supabase.from('creditos').select('id')
      .eq('cliente_id', credito.cliente_id).eq('empresa_id', empresa_id)
      .in('estado', ['activo', 'en_mora']).neq('id', credito_id).limit(1)
    if (!otros?.length) {
      await supabase.from('clientes').update({ estado: 'activo' })
        .eq('id', credito.cliente_id).eq('empresa_id', empresa_id)
        .in('estado', ['moroso', 'pendiente_verificacion'])
    }
  }
  if (nuevoEstado === 'en_mora') {
    await supabase.from('clientes').update({ estado: 'moroso' })
      .eq('id', credito.cliente_id).eq('empresa_id', empresa_id).eq('estado', 'activo')
  }
}

// ─── ACTION 1: REGISTRAR PAGO ─────────────────────────────────────────────────
export async function registrarPagoAction(params: {
  cuota_id: string
  credito_id: string
  cliente_id: string
  monto_pagado: number
  medio_pago: string
  fecha_pago?: string
  observaciones?: string
}) {
  const { supabase, user, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const fecha = params.fecha_pago ?? new Date().toISOString().split('T')[0]

  const { data: cuota } = await supabase.from('cuotas').select('*').eq('id', params.cuota_id).single()
  if (!cuota) return { error: 'Cuota no encontrada' }
  if (cuota.estado === 'pagada') return { error: 'La cuota ya está pagada' }
  if (params.monto_pagado <= 0) return { error: 'El monto debe ser mayor a 0' }

  const punitorio = calcularPunitorio({
    saldoPendiente: cuota.saldo_pendiente,
    fechaVencimiento: cuota.fecha_vencimiento,
    tasaDiaria: config.tasaDiaria,
    diasGracia: config.diasGracia,
  })
  const montoConPunitorio = redondear(cuota.saldo_pendiente + punitorio)
  const esPagoTotal = params.monto_pagado >= montoConPunitorio

  let cierreCajaId: string
  try { cierreCajaId = await obtenerOCrearCierreCaja(supabase, empresa_id) }
  catch (e: any) { return { error: e.message } }

  const { data: pago, error: pagoError } = await supabase.from('pagos').insert({
    empresa_id, cuota_id: params.cuota_id, credito_id: params.credito_id,
    cliente_id: params.cliente_id, fecha_pago: fecha, monto_pagado: params.monto_pagado,
    medio_pago: params.medio_pago, tipo_pago: esPagoTotal ? 'normal' : 'parcial',
    punitorio_cobrado: esPagoTotal ? punitorio : 0, registrado_por: user.id,
    observaciones: params.observaciones ?? null, cierre_caja_id: cierreCajaId, anulado: false,
  }).select('id').single()

  if (pagoError || !pago) return { error: 'Error al registrar el pago: ' + pagoError?.message }

  let imputacion: any
  if (esPagoTotal) {
    const calc = calcularImputacionPagoTotal({ cuota: cuota as CuotaParaPago, punitorio })
    imputacion = {
      empresa_id, pago_id: pago.id, cuota_id: params.cuota_id,
      credito_id: params.credito_id, cliente_id: params.cliente_id,
      monto_capital: calc.monto_capital, monto_interes: calc.monto_interes,
      monto_iva: calc.monto_iva, monto_punitorio: punitorio,
      monto_total: params.monto_pagado, tipo: 'normal', registrado_por: user.id,
    }
  } else {
    const dist = distribuirPagoParcial({ montoPagado: params.monto_pagado, cuota: cuota as CuotaParaPago })
    imputacion = {
      empresa_id, pago_id: pago.id, cuota_id: params.cuota_id,
      credito_id: params.credito_id, cliente_id: params.cliente_id,
      monto_capital: dist.capital, monto_interes: dist.interes, monto_iva: dist.iva,
      monto_punitorio: 0, monto_total: params.monto_pagado, tipo: 'parcial', registrado_por: user.id,
    }
  }

  const { error: impError } = await supabase.from('imputaciones_pago').insert(imputacion)
  if (impError) {
    await supabase.from('pagos').delete().eq('id', pago.id)
    return { error: 'Error al imputar: ' + impError.message }
  }

  const nuevoSaldo = esPagoTotal ? 0 : redondear(cuota.saldo_pendiente - params.monto_pagado)
  const nuevoEstado = calcularNuevoEstadoCuota({ nuevoSaldo, fechaVencimiento: cuota.fecha_vencimiento })

  await supabase.from('cuotas').update({
    saldo_pendiente: nuevoSaldo,
    monto_acumulado_pagado: redondear(cuota.monto_acumulado_pagado + params.monto_pagado),
    punitorio_aplicado: esPagoTotal ? redondear((cuota.punitorio_aplicado ?? 0) + punitorio) : (cuota.punitorio_aplicado ?? 0),
    punitorio: esPagoTotal ? punitorio : (cuota.punitorio ?? 0),
    fecha_ultimo_pago: fecha, estado: nuevoEstado,
  }).eq('id', params.cuota_id)

  await recalcularEstadoCredito(supabase, params.credito_id, empresa_id)
  await actualizarCaja(supabase, cierreCajaId, params.monto_pagado, params.medio_pago, esPagoTotal ? punitorio : 0)

  revalidatePath(`/creditos/${params.credito_id}`)
  revalidatePath('/cobranza')
  revalidatePath('/caja')

  return { success: true, pago_id: pago.id, es_pago_total: esPagoTotal, punitorio_aplicado: esPagoTotal ? punitorio : 0, nuevo_estado_cuota: nuevoEstado }
}

// ─── ACTION 2: ANULAR PAGO ────────────────────────────────────────────────────
export async function anularPagoAction(params: {
  pago_id: string; motivo: string; observaciones?: string
}) {
  const { supabase, user, empresa_id, rol } = await getContexto()
  if (rol !== 'admin') return { error: 'Solo el administrador puede anular pagos' }

  const { data: pago } = await supabase.from('pagos').select('*')
    .eq('id', params.pago_id).eq('empresa_id', empresa_id).single()
  if (!pago) return { error: 'Pago no encontrado' }
  if (pago.anulado) return { error: 'El pago ya fue anulado' }

  if (pago.cierre_caja_id) {
    const { data: caja } = await supabase.from('cierre_caja').select('estado').eq('id', pago.cierre_caja_id).single()
    if (caja?.estado === 'cerrado') return { error: 'No se puede anular un pago de una caja cerrada' }
  }

  const { data: imputaciones } = await supabase.from('imputaciones_pago').select('*').eq('pago_id', params.pago_id)
  if (!imputaciones?.length) return { error: 'No se encontraron imputaciones para este pago' }

  const { error: anulErr } = await supabase.from('anulaciones_pago').insert({
    empresa_id, pago_id: params.pago_id, motivo: params.motivo,
    observaciones: params.observaciones ?? null,
    snapshot_pago: { pago, imputaciones, anulado_en: new Date().toISOString() },
    anulado_por: user.id,
  })
  if (anulErr) return { error: 'Error al registrar la anulación: ' + anulErr.message }

  await supabase.from('pagos').update({ anulado: true, anulado_at: new Date().toISOString() }).eq('id', params.pago_id)

  for (const imp of imputaciones) {
    const { data: cuota } = await supabase.from('cuotas').select('*').eq('id', imp.cuota_id).single()
    if (!cuota) continue
    const nuevoSaldo = redondear(cuota.saldo_pendiente + imp.monto_total)
    const nuevoEstado = calcularNuevoEstadoCuota({ nuevoSaldo, fechaVencimiento: cuota.fecha_vencimiento })
    await supabase.from('cuotas').update({
      saldo_pendiente: nuevoSaldo,
      monto_acumulado_pagado: redondear(Math.max(0, cuota.monto_acumulado_pagado - imp.monto_total)),
      punitorio_aplicado: redondear(Math.max(0, (cuota.punitorio_aplicado ?? 0) - imp.monto_punitorio)),
      estado: nuevoEstado,
    }).eq('id', imp.cuota_id)
    await recalcularEstadoCredito(supabase, imp.credito_id, empresa_id)
  }

  if (pago.cierre_caja_id) {
    await actualizarCaja(supabase, pago.cierre_caja_id, pago.monto_pagado, pago.medio_pago, 0, true)
  }

  revalidatePath('/cobranza')
  revalidatePath('/caja')
  return { success: true }
}

// ─── ACTION 3: CALCULAR CANCELACIÓN ──────────────────────────────────────────
export async function calcularCancelacionAction(credito_id: string) {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const { data: cuotas } = await supabase.from('cuotas').select('*').eq('credito_id', credito_id).order('numero_cuota')
  if (!cuotas?.length) return { error: 'No se encontraron cuotas' }
  const resultado = calcularCancelacionAnticipada({ cuotas: cuotas as CuotaParaPago[], tasaDiaria: config.tasaDiaria, diasGracia: config.diasGracia })
  return { success: true, calculo: resultado }
}

// ─── ACTION 4: EJECUTAR CANCELACIÓN ANTICIPADA ───────────────────────────────
export async function ejecutarCancelacionAnticipadaAction(params: {
  credito_id: string; cliente_id: string; medio_pago: string; observaciones?: string
}) {
  const { supabase, user, empresa_id, rol } = await getContexto()
  if (rol !== 'admin') return { error: 'Solo el administrador puede ejecutar cancelaciones' }

  const config = await getConfigEmpresa(supabase, empresa_id)
  const { data: credito } = await supabase.from('creditos').select('estado')
    .eq('id', params.credito_id).eq('empresa_id', empresa_id).single()
  if (!credito) return { error: 'Crédito no encontrado' }
  if (!['activo', 'en_mora'].includes(credito.estado)) return { error: 'El crédito no está en estado válido' }

  const { data: cuotas } = await supabase.from('cuotas').select('*')
    .eq('credito_id', params.credito_id).neq('estado', 'pagada').order('numero_cuota')
  if (!cuotas?.length) return { error: 'No hay cuotas pendientes' }

  const calculo = calcularCancelacionAnticipada({ cuotas: cuotas as CuotaParaPago[], tasaDiaria: config.tasaDiaria, diasGracia: config.diasGracia })
  const hoy = new Date().toISOString().split('T')[0]

  let cierreCajaId: string
  try { cierreCajaId = await obtenerOCrearCierreCaja(supabase, empresa_id) }
  catch (e: any) { return { error: e.message } }

  const { data: pago, error: pagoError } = await supabase.from('pagos').insert({
    empresa_id, cuota_id: cuotas[0].id, credito_id: params.credito_id,
    cliente_id: params.cliente_id, fecha_pago: hoy, monto_pagado: calculo.total_a_pagar,
    medio_pago: params.medio_pago, tipo_pago: 'cancelacion_anticipada',
    punitorio_cobrado: calculo.total_punitorios, registrado_por: user.id,
    observaciones: params.observaciones ?? 'Cancelación anticipada',
    cierre_caja_id: cierreCajaId, anulado: false,
  }).select('id').single()
  if (pagoError || !pago) return { error: 'Error al crear el pago: ' + pagoError?.message }

  const imputaciones = calculo.detalle.map(d => ({
    empresa_id, pago_id: pago.id, cuota_id: d.cuota_id,
    credito_id: params.credito_id, cliente_id: params.cliente_id,
    monto_capital: d.monto_capital, monto_interes: d.monto_interes,
    monto_iva: d.monto_iva, monto_punitorio: d.monto_punitorio,
    monto_total: d.monto_total, tipo: 'cancelacion_anticipada', registrado_por: user.id,
  }))

  const { error: impError } = await supabase.from('imputaciones_pago').insert(imputaciones)
  if (impError) {
    await supabase.from('pagos').delete().eq('id', pago.id)
    return { error: 'Error al crear imputaciones: ' + impError.message }
  }

  for (const d of calculo.detalle) {
    await supabase.from('cuotas').update({
      saldo_pendiente: 0, monto_acumulado_pagado: d.monto_total,
      punitorio_aplicado: d.monto_punitorio,
      fecha_ultimo_pago: hoy, fecha_cancelacion: hoy, estado: 'pagada',
    }).eq('id', d.cuota_id)
  }

  await supabase.from('creditos').update({ estado: 'cancelado' }).eq('id', params.credito_id)

  const { data: otros } = await supabase.from('creditos').select('id')
    .eq('cliente_id', params.cliente_id).eq('empresa_id', empresa_id)
    .in('estado', ['activo', 'en_mora']).neq('id', params.credito_id).limit(1)
  if (!otros?.length) {
    await supabase.from('clientes').update({ estado: 'activo' })
      .eq('id', params.cliente_id).eq('empresa_id', empresa_id)
  }

  await actualizarCaja(supabase, cierreCajaId, calculo.total_a_pagar, params.medio_pago, calculo.total_punitorios)

  revalidatePath(`/creditos/${params.credito_id}`)
  revalidatePath('/cobranza')
  revalidatePath('/caja')
  return { success: true, pago_id: pago.id, calculo }
}

// ─── ACTION 5: CERRAR CAJA ────────────────────────────────────────────────────
export async function cerrarCajaAction(cierre_caja_id: string) {
  const { supabase, user, empresa_id, rol } = await getContexto()
  if (rol !== 'admin') return { error: 'Solo el administrador puede cerrar la caja' }
  const { data: caja } = await supabase.from('cierre_caja').select('*')
    .eq('id', cierre_caja_id).eq('empresa_id', empresa_id).single()
  if (!caja) return { error: 'Caja no encontrada' }
  if (caja.estado === 'cerrado') return { error: 'La caja ya está cerrada' }
  const { error } = await supabase.from('cierre_caja').update({
    estado: 'cerrado', cerrado_por: user.id, cerrado_at: new Date().toISOString(),
  }).eq('id', cierre_caja_id)
  if (error) return { error: 'Error al cerrar la caja: ' + error.message }
  revalidatePath('/caja')
  return { success: true }
}

// ─── ACTION 6: OBTENER PAGOS DE UN CRÉDITO ───────────────────────────────────
export async function obtenerPagosCreditoAction(credito_id: string) {
  const { supabase, empresa_id } = await getContexto()
  const { data, error } = await supabase.from('pagos')
    .select(`
      id, fecha_pago, monto_pagado, medio_pago, tipo_pago,
      punitorio_cobrado, anulado, observaciones, created_at,
      imputaciones_pago(cuota_id, monto_total, tipo, cuotas(numero_cuota, fecha_vencimiento))
    `)
    .eq('credito_id', credito_id).eq('empresa_id', empresa_id)
    .order('fecha_pago', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

// ─── ACTION 7: OBTENER CUOTAS CON PUNITORIO TEÓRICO ──────────────────────────
export async function obtenerCuotasConPunitoriAction(credito_id: string) {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const { data: cuotas, error } = await supabase.from('cuotas').select('*')
    .eq('credito_id', credito_id).order('numero_cuota')
  if (error || !cuotas) return { data: [], error: error?.message }

  const cuotasConPunitorio = cuotas.map(cuota => {
    const punitorioTeorico = ['vencida', 'parcial'].includes(cuota.estado)
      ? calcularPunitorio({
          saldoPendiente: cuota.saldo_pendiente,
          fechaVencimiento: cuota.fecha_vencimiento,
          tasaDiaria: config.tasaDiaria,
          diasGracia: config.diasGracia,
        })
      : 0
    return {
      ...cuota,
      punitorio_teorico_calculado: punitorioTeorico,
      total_a_cobrar: redondear(cuota.saldo_pendiente + punitorioTeorico),
    }
  })
  return { data: cuotasConPunitorio }
}

// ─── ACTION 8: OBTENER CAJA DEL DÍA ──────────────────────────────────────────
export async function obtenerCajaDelDiaAction(fecha?: string) {
  const { supabase, empresa_id } = await getContexto()
  const dia = fecha ?? new Date().toISOString().split('T')[0]
  const { data: caja } = await supabase.from('cierre_caja').select('*')
    .eq('empresa_id', empresa_id).eq('fecha', dia).single()
  if (!caja) return { data: null, mensaje: 'No hay movimientos de caja para este día' }
  const { data: pagos } = await supabase.from('pagos')
    .select(`
      id, fecha_pago, monto_pagado, medio_pago, tipo_pago, punitorio_cobrado, anulado,
      clientes(nombre, apellido, numero_documento),
      creditos(numero_credito),
      imputaciones_pago(cuotas(numero_cuota))
    `)
    .eq('cierre_caja_id', caja.id).eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
  return { data: { caja, pagos: pagos ?? [] } }
}

// ─── ACTION 9: ACTUALIZAR CUOTAS VENCIDAS ────────────────────────────────────
export async function actualizarCuotasVencidasAction() {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const hoy = new Date().toISOString().split('T')[0]
  const { data: cuotas } = await supabase.from('cuotas')
    .select('id, saldo_pendiente, fecha_vencimiento, credito_id')
    .eq('empresa_id', empresa_id).in('estado', ['pendiente', 'parcial']).lt('fecha_vencimiento', hoy)
  if (!cuotas?.length) return { success: true, actualizadas: 0 }
  for (const cuota of cuotas) {
    const pt = calcularPunitorio({
      saldoPendiente: cuota.saldo_pendiente, fechaVencimiento: cuota.fecha_vencimiento,
      tasaDiaria: config.tasaDiaria, diasGracia: config.diasGracia,
    })
    await supabase.from('cuotas').update({ estado: 'vencida', punitorio_teorico: pt }).eq('id', cuota.id)
  }
  const creditos = [...new Set(cuotas.map(c => c.credito_id))]
  for (const cid of creditos) await recalcularEstadoCredito(supabase, cid, empresa_id)
  revalidatePath('/cobranza')
  revalidatePath('/mora')
  return { success: true, actualizadas: cuotas.length }
}
