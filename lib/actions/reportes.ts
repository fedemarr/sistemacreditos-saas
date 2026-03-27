'use server'

import { createClient } from '@/lib/supabase/server'
import { redondear } from '@/lib/calculadora/cobranza'

async function getEmpresaId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('empresa_id').eq('usuario_id', user.id).single()
  if (!perfil) throw new Error('Perfil no encontrado')
  return perfil.empresa_id as string
}

// ─── REPORTE 1: COBRANZA POR PERÍODO ─────────────────────────────────────────
export async function reporteCobranzaAction(params: {
  desde: string
  hasta: string
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: pagos } = await supabase
    .from('pagos')
    .select(`
      id, fecha_pago, monto_pagado, medio_pago, tipo_pago, punitorio_cobrado, anulado,
      clientes(nombre, apellido, numero_documento, tipo_documento),
      creditos(numero_credito)
    `)
    .eq('empresa_id', empresa_id)
    .gte('fecha_pago', params.desde)
    .lte('fecha_pago', params.hasta)
    .order('fecha_pago', { ascending: false })

  const validos = (pagos ?? []).filter(p => !p.anulado)
  const anulados = (pagos ?? []).filter(p => p.anulado)

  // Agrupar por medio de pago
  const porMedio: Record<string, number> = {}
  validos.forEach(p => {
    porMedio[p.medio_pago] = redondear((porMedio[p.medio_pago] ?? 0) + p.monto_pagado)
  })

  // Agrupar por día
  const porDia: Record<string, number> = {}
  validos.forEach(p => {
    porDia[p.fecha_pago] = redondear((porDia[p.fecha_pago] ?? 0) + p.monto_pagado)
  })

  return {
    pagos: validos,
    resumen: {
      total_cobrado: redondear(validos.reduce((a, p) => a + p.monto_pagado, 0)),
      total_punitorio: redondear(validos.reduce((a, p) => a + p.punitorio_cobrado, 0)),
      total_anulado: redondear(anulados.reduce((a, p) => a + p.monto_pagado, 0)),
      cantidad_pagos: validos.length,
      cantidad_anulados: anulados.length,
      por_medio: porMedio,
      por_dia: porDia,
    },
  }
}

// ─── REPORTE 2: CARTERA ACTIVA ────────────────────────────────────────────────
export async function reporteCarteraActivaAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: creditos } = await supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, monto_total_financiado,
      tasa_anual, cantidad_cuotas, estado, fecha_otorgamiento, fecha_primer_vencimiento,
      clientes(nombre, apellido, numero_documento, tipo_documento, telefono),
      planes_credito(codigo, descripcion)
    `)
    .eq('empresa_id', empresa_id)
    .in('estado', ['activo', 'en_mora'])
    .order('numero_credito')

  const { data: cuotas } = await supabase
    .from('cuotas')
    .select('credito_id, saldo_pendiente, estado')
    .eq('empresa_id', empresa_id)

  // Calcular saldo por crédito
  const saldosPorCredito: Record<string, number> = {}
  const cuotasVencidasPorCredito: Record<string, number> = {}
  ;(cuotas ?? []).forEach(c => {
    saldosPorCredito[c.credito_id] = redondear((saldosPorCredito[c.credito_id] ?? 0) + c.saldo_pendiente)
    if (c.estado === 'vencida') {
      cuotasVencidasPorCredito[c.credito_id] = (cuotasVencidasPorCredito[c.credito_id] ?? 0) + 1
    }
  })

  const creditosConSaldo = (creditos ?? []).map(c => ({
    ...c,
    saldo_pendiente: saldosPorCredito[c.id] ?? 0,
    cuotas_vencidas: cuotasVencidasPorCredito[c.id] ?? 0,
  }))

  const totalSaldo = redondear(creditosConSaldo.reduce((a, c) => a + c.saldo_pendiente, 0))
  const totalCapital = redondear(creditosConSaldo.reduce((a, c) => a + c.monto_otorgado, 0))

  return {
    creditos: creditosConSaldo,
    resumen: {
      total_creditos: creditosConSaldo.length,
      activos: creditosConSaldo.filter(c => c.estado === 'activo').length,
      en_mora: creditosConSaldo.filter(c => c.estado === 'en_mora').length,
      capital_total: totalCapital,
      saldo_total: totalSaldo,
    },
  }
}

// ─── REPORTE 3: MORA DETALLADA ────────────────────────────────────────────────
export async function reporteMoraDetalladaAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()
  const hoy = new Date().toISOString().split('T')[0]

  const { data: cuotasVencidas } = await supabase
    .from('cuotas')
    .select(`
      id, numero_cuota, fecha_vencimiento, saldo_pendiente, capital, interes, estado,
      creditos!inner(
        id, numero_credito, monto_otorgado, estado,
        clientes(nombre, apellido, numero_documento, tipo_documento, telefono)
      )
    `)
    .eq('empresa_id', empresa_id)
    .eq('estado', 'vencida')
    .order('fecha_vencimiento')

  const resultado = (cuotasVencidas ?? []).map((c: any) => {
    const diasAtraso = Math.max(0, Math.floor(
      (new Date(hoy).getTime() - new Date(c.fecha_vencimiento + 'T00:00:00').getTime())
      / (1000 * 60 * 60 * 24)
    ))
    return {
      ...c,
      dias_atraso: diasAtraso,
      tramo: diasAtraso <= 30 ? '1-30' : diasAtraso <= 60 ? '31-60' : diasAtraso <= 90 ? '61-90' : '+90',
    }
  })

  // Agrupar por tramo
  const porTramo = {
    '1-30': resultado.filter(r => r.tramo === '1-30'),
    '31-60': resultado.filter(r => r.tramo === '31-60'),
    '61-90': resultado.filter(r => r.tramo === '61-90'),
    '+90': resultado.filter(r => r.tramo === '+90'),
  }

  return {
    cuotas: resultado,
    resumen: {
      total_cuotas_vencidas: resultado.length,
      saldo_vencido_total: redondear(resultado.reduce((a, c) => a + c.saldo_pendiente, 0)),
      por_tramo: Object.entries(porTramo).map(([tramo, items]) => ({
        tramo,
        cantidad: items.length,
        saldo: redondear(items.reduce((a, c) => a + c.saldo_pendiente, 0)),
      })),
    },
  }
}

// ─── REPORTE 4: VENCIMIENTOS POR PERÍODO ─────────────────────────────────────
export async function reporteVencimientosAction(params: {
  desde: string
  hasta: string
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: cuotas } = await supabase
    .from('cuotas')
    .select(`
      id, numero_cuota, fecha_vencimiento, total, saldo_pendiente, estado,
      creditos(
        id, numero_credito, estado,
        clientes(nombre, apellido, numero_documento, telefono)
      )
    `)
    .eq('empresa_id', empresa_id)
    .gte('fecha_vencimiento', params.desde)
    .lte('fecha_vencimiento', params.hasta)
    .in('estado', ['pendiente', 'parcial', 'vencida'])
    .order('fecha_vencimiento')

  // Agrupar por fecha
  const porFecha: Record<string, any[]> = {}
  ;(cuotas ?? []).forEach((c: any) => {
    if (!porFecha[c.fecha_vencimiento]) porFecha[c.fecha_vencimiento] = []
    porFecha[c.fecha_vencimiento].push(c)
  })

  const totalEsperado = redondear((cuotas ?? []).reduce((a, c) => a + c.saldo_pendiente, 0))

  return {
    cuotas: cuotas ?? [],
    por_fecha: porFecha,
    resumen: {
      total_cuotas: cuotas?.length ?? 0,
      total_esperado: totalEsperado,
      pendientes: cuotas?.filter(c => c.estado === 'pendiente').length ?? 0,
      parciales: cuotas?.filter(c => c.estado === 'parcial').length ?? 0,
      vencidas: cuotas?.filter(c => c.estado === 'vencida').length ?? 0,
    },
  }
}

// ─── REPORTE 5: CRÉDITOS OTORGADOS POR PERÍODO ───────────────────────────────
export async function reporteCreditosOtorgadosAction(params: {
  desde: string
  hasta: string
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: creditos } = await supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, monto_total_financiado,
      tasa_anual, cantidad_cuotas, sistema_amortizacion, estado,
      fecha_otorgamiento,
      clientes(nombre, apellido, numero_documento, tipo_documento),
      planes_credito(codigo, descripcion),
      comercios(nombre, codigo)
    `)
    .eq('empresa_id', empresa_id)
    .gte('fecha_otorgamiento', params.desde)
    .lte('fecha_otorgamiento', params.hasta)
    .order('fecha_otorgamiento', { ascending: false })

  const lista = creditos ?? []
  const capitalTotal = redondear(lista.reduce((a, c) => a + c.monto_otorgado, 0))
  const financiadoTotal = redondear(lista.reduce((a, c) => a + c.monto_total_financiado, 0))

  // Agrupar por plan
  const porPlan: Record<string, { cantidad: number; capital: number }> = {}
  lista.forEach((c: any) => {
    const plan = c.planes_credito?.codigo ?? 'Sin plan'
    if (!porPlan[plan]) porPlan[plan] = { cantidad: 0, capital: 0 }
    porPlan[plan].cantidad++
    porPlan[plan].capital = redondear(porPlan[plan].capital + c.monto_otorgado)
  })

  return {
    creditos: lista,
    resumen: {
      total_creditos: lista.length,
      capital_total: capitalTotal,
      financiado_total: financiadoTotal,
      por_plan: porPlan,
    },
  }
}

// ─── REPORTE 6: CLIENTES NUEVOS POR PERÍODO ──────────────────────────────────
export async function reporteClientesNuevosAction(params: {
  desde: string
  hasta: string
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: clientes } = await supabase
    .from('clientes')
    .select(`
      id, nombre, apellido, numero_documento, tipo_documento,
      telefono, email, estado, categoria, created_at
    `)
    .eq('empresa_id', empresa_id)
    .gte('created_at', params.desde + 'T00:00:00')
    .lte('created_at', params.hasta + 'T23:59:59')
    .order('created_at', { ascending: false })

  const lista = clientes ?? []

  return {
    clientes: lista,
    resumen: {
      total: lista.length,
      activos: lista.filter(c => c.estado === 'activo').length,
      pendientes: lista.filter(c => c.estado === 'pendiente_verificacion').length,
    },
  }
}
