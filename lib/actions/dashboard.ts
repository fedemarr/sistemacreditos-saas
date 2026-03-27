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

// ─── MÉTRICAS PRINCIPALES ─────────────────────────────────────────────────────
export async function obtenerMetricasPrincipalesAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()
  const hoy = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const mesAnteriorInicio = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  const mesAnteriorFin = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]

  const [
    // Créditos
    { count: creditosActivos },
    { count: creditosEnMora },
    { count: creditosOtorgadosMes },
    { count: creditosOtorgadosMesAnterior },

    // Clientes
    { count: totalClientes },
    { count: clientesNuevosMes },

    // Cobranza del día
    cajaHoy,

    // Cobranza del mes
    cobradoMes,

    // Cuotas vencidas
    { data: cuotasVencidas },

    // Nuevos créditos este mes — montos
    creditosMesData,

    // Próximos vencimientos (7 días)
    { data: proximosVencimientos },
  ] = await Promise.all([
    supabase.from('creditos').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id).eq('estado', 'activo'),
    supabase.from('creditos').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id).eq('estado', 'en_mora'),
    supabase.from('creditos').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id).gte('fecha_otorgamiento', inicioMes),
    supabase.from('creditos').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .gte('fecha_otorgamiento', mesAnteriorInicio)
      .lte('fecha_otorgamiento', mesAnteriorFin),
    supabase.from('clientes').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id).neq('estado', 'baja'),
    supabase.from('clientes').select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id).gte('created_at', inicioMes),
    supabase.from('cierre_caja').select('total_neto, total_cobrado, total_punitorio')
      .eq('empresa_id', empresa_id).eq('fecha', hoy).single(),
    supabase.from('pagos').select('monto_pagado')
      .eq('empresa_id', empresa_id).eq('anulado', false)
      .gte('fecha_pago', inicioMes).lte('fecha_pago', hoy),
    supabase.from('cuotas').select('saldo_pendiente')
      .eq('empresa_id', empresa_id).eq('estado', 'vencida'),
    supabase.from('creditos').select('monto_otorgado, monto_total_financiado')
      .eq('empresa_id', empresa_id).gte('fecha_otorgamiento', inicioMes),
    supabase.from('cuotas').select('numero_cuota, fecha_vencimiento, total, saldo_pendiente, credito_id, creditos(numero_credito, clientes(nombre, apellido))')
      .eq('empresa_id', empresa_id)
      .in('estado', ['pendiente', 'parcial'])
      .gte('fecha_vencimiento', hoy)
      .lte('fecha_vencimiento', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('fecha_vencimiento').limit(10),
  ])

  const cobradoMesTotal = (cobradoMes.data ?? []).reduce((a, p) => a + p.monto_pagado, 0)
  const saldoVencidoTotal = (cuotasVencidas ?? []).reduce((a, c) => a + c.saldo_pendiente, 0)
  const capitalOtorgadoMes = (creditosMesData.data ?? []).reduce((a, c) => a + c.monto_otorgado, 0)

  // Variación créditos mes vs mes anterior
  const variacionCreditos = creditosOtorgadosMesAnterior && creditosOtorgadosMesAnterior > 0
    ? Math.round(((creditosOtorgadosMes ?? 0) - creditosOtorgadosMesAnterior) / creditosOtorgadosMesAnterior * 100)
    : 0

  return {
    creditos: {
      activos: creditosActivos ?? 0,
      en_mora: creditosEnMora ?? 0,
      otorgados_mes: creditosOtorgadosMes ?? 0,
      variacion_mes: variacionCreditos,
      capital_otorgado_mes: redondear(capitalOtorgadoMes),
    },
    clientes: {
      total: totalClientes ?? 0,
      nuevos_mes: clientesNuevosMes ?? 0,
    },
    cobranza: {
      cobrado_hoy: redondear(cajaHoy.data?.total_neto ?? 0),
      cobrado_mes: redondear(cobradoMesTotal),
      punitorio_hoy: redondear(cajaHoy.data?.total_punitorio ?? 0),
    },
    mora: {
      saldo_vencido: redondear(saldoVencidoTotal),
      cuotas_vencidas: cuotasVencidas?.length ?? 0,
      creditos_en_mora: creditosEnMora ?? 0,
    },
    proximos_vencimientos: proximosVencimientos ?? [],
  }
}

// ─── COBRANZA ÚLTIMOS 7 DÍAS (para gráfico de barras) ────────────────────────
export async function obtenerCobranzaSemanaAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const dias: { fecha: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const fecha = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    dias.push({ fecha, label })
  }

  const { data: pagos } = await supabase
    .from('pagos')
    .select('fecha_pago, monto_pagado')
    .eq('empresa_id', empresa_id)
    .eq('anulado', false)
    .gte('fecha_pago', dias[0].fecha)
    .lte('fecha_pago', dias[6].fecha)

  return dias.map(d => ({
    fecha: d.fecha,
    label: d.label,
    total: redondear(
      (pagos ?? [])
        .filter(p => p.fecha_pago === d.fecha)
        .reduce((a, p) => a + p.monto_pagado, 0)
    ),
  }))
}

// ─── DISTRIBUCIÓN DE CARTERA (para gráfico de torta) ─────────────────────────
export async function obtenerDistribucionCarteraAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const estados = ['activo', 'en_mora', 'cancelado', 'incobrable']

  const counts = await Promise.all(
    estados.map(estado =>
      supabase.from('creditos').select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresa_id).eq('estado', estado)
    )
  )

  return estados.map((estado, i) => ({
    estado,
    cantidad: counts[i].count ?? 0,
  }))
}

// ─── ÚLTIMOS CRÉDITOS OTORGADOS ───────────────────────────────────────────────
export async function obtenerUltimosCreditosAction() {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data } = await supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, estado, fecha_otorgamiento,
      clientes(nombre, apellido, numero_documento)
    `)
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data ?? []
}
