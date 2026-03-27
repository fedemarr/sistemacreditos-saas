'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcularPunitorio, redondear } from '@/lib/calculadora/cobranza'

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

// ─── OBTENER CARTERA EN MORA ──────────────────────────────────────────────────
// Devuelve créditos con cuotas vencidas, ordenados por días de atraso desc
export async function obtenerCarteraMoraAction(params?: {
  diasMinimos?: number
  pagina?: number
}) {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const pagina = params?.pagina ?? 1
  const porPagina = 25
  const desde = (pagina - 1) * porPagina
  const hoy = new Date().toISOString().split('T')[0]

  // Obtener créditos en mora con sus cuotas vencidas
  const { data: creditos, count } = await supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, estado, fecha_otorgamiento,
      clientes(id, nombre, apellido, numero_documento, tipo_documento, telefono, estado),
      cuotas!inner(
        id, numero_cuota, fecha_vencimiento, saldo_pendiente,
        capital, interes, estado, punitorio_aplicado, monto_acumulado_pagado
      )
    `, { count: 'exact' })
    .eq('empresa_id', empresa_id)
    .in('estado', ['en_mora', 'activo'])
    .in('cuotas.estado', ['vencida', 'parcial'])
    .lt('cuotas.fecha_vencimiento', hoy)
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (!creditos) return { data: [], total: 0 }

  // Calcular métricas por crédito
  const resultado = creditos.map((credito: any) => {
    const cuotasVencidas = (credito.cuotas as any[]).filter(
      (c: any) => c.estado === 'vencida' || c.estado === 'parcial'
    )

    // Cuota más antigua vencida (para calcular días de atraso máximo)
    const cuotaMasAntigua = cuotasVencidas.reduce((min: any, c: any) =>
      !min || c.fecha_vencimiento < min.fecha_vencimiento ? c : min
    , null)

    const diasAtraso = cuotaMasAntigua
      ? Math.max(0, Math.floor(
          (new Date(hoy).getTime() - new Date(cuotaMasAntigua.fecha_vencimiento + 'T00:00:00').getTime())
          / (1000 * 60 * 60 * 24)
        ))
      : 0

    // Saldo total pendiente
    const saldoTotal = cuotasVencidas.reduce((acc: number, c: any) => acc + c.saldo_pendiente, 0)

    // Punitorio teórico total
    const punitorioTotal = cuotasVencidas.reduce((acc: number, c: any) => {
      return acc + calcularPunitorio({
        saldoPendiente: c.saldo_pendiente,
        fechaVencimiento: c.fecha_vencimiento,
        tasaDiaria: config.tasaDiaria,
        diasGracia: config.diasGracia,
      })
    }, 0)

    return {
      id: credito.id,
      numero_credito: credito.numero_credito,
      monto_otorgado: credito.monto_otorgado,
      estado: credito.estado,
      cliente: credito.clientes,
      cantidad_cuotas_vencidas: cuotasVencidas.length,
      dias_atraso: diasAtraso,
      saldo_vencido: redondear(saldoTotal),
      punitorio_teorico: redondear(punitorioTotal),
      total_a_regularizar: redondear(saldoTotal + punitorioTotal),
      cuota_mas_antigua: cuotaMasAntigua?.fecha_vencimiento ?? null,
    }
  })

  // Filtrar por días mínimos si aplica
  const filtrado = params?.diasMinimos
    ? resultado.filter(r => r.dias_atraso >= params.diasMinimos!)
    : resultado

  // Ordenar por días de atraso descendente
  filtrado.sort((a, b) => b.dias_atraso - a.dias_atraso)

  return { data: filtrado, total: count ?? 0 }
}

// ─── OBTENER DETALLE DE MORA POR CRÉDITO ─────────────────────────────────────
export async function obtenerDetalleMoraAction(creditoId: string) {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const hoy = new Date().toISOString().split('T')[0]

  const { data: credito } = await supabase
    .from('creditos')
    .select(`
      *,
      clientes(id, nombre, apellido, numero_documento, tipo_documento, telefono, email, estado),
      planes_credito(codigo, descripcion)
    `)
    .eq('id', creditoId)
    .eq('empresa_id', empresa_id)
    .single()

  if (!credito) return { data: null }

  const { data: cuotas } = await supabase
    .from('cuotas')
    .select('*')
    .eq('credito_id', creditoId)
    .order('numero_cuota')

  const cuotasList = cuotas ?? []

  // Calcular punitorio teórico para cada cuota vencida
  const cuotasConPunitorio = cuotasList.map(c => {
    const estaVencida = c.estado === 'vencida' || c.estado === 'parcial'
    const punitorioTeorico = estaVencida
      ? calcularPunitorio({
          saldoPendiente: c.saldo_pendiente,
          fechaVencimiento: c.fecha_vencimiento,
          tasaDiaria: config.tasaDiaria,
          diasGracia: config.diasGracia,
        })
      : 0

    const diasAtraso = c.fecha_vencimiento < hoy
      ? Math.max(0, Math.floor(
          (new Date(hoy).getTime() - new Date(c.fecha_vencimiento + 'T00:00:00').getTime())
          / (1000 * 60 * 60 * 24)
        ))
      : 0

    return { ...c, punitorio_teorico_calculado: punitorioTeorico, dias_atraso: diasAtraso }
  })

  const vencidas = cuotasConPunitorio.filter(c => c.estado === 'vencida' || c.estado === 'parcial')
  const saldoVencido = vencidas.reduce((a, c) => a + c.saldo_pendiente, 0)
  const punitorioTotal = vencidas.reduce((a, c) => a + c.punitorio_teorico_calculado, 0)

  return {
    data: {
      credito,
      cuotas: cuotasConPunitorio,
      resumen: {
        cuotas_vencidas: vencidas.length,
        saldo_vencido: redondear(saldoVencido),
        punitorio_teorico: redondear(punitorioTotal),
        total_a_regularizar: redondear(saldoVencido + punitorioTotal),
      },
    },
  }
}

// ─── ACTUALIZAR CUOTAS VENCIDAS (proceso masivo) ─────────────────────────────
export async function procesarMoraAction() {
  const { supabase, empresa_id } = await getContexto()
  const config = await getConfigEmpresa(supabase, empresa_id)
  const hoy = new Date().toISOString().split('T')[0]

  // 1. Marcar cuotas como vencidas
  const { data: cuotasActualizadas } = await supabase
    .from('cuotas')
    .select('id, saldo_pendiente, fecha_vencimiento, credito_id')
    .eq('empresa_id', empresa_id)
    .in('estado', ['pendiente', 'parcial'])
    .lt('fecha_vencimiento', hoy)

  let actualizadas = 0
  if (cuotasActualizadas?.length) {
    for (const cuota of cuotasActualizadas) {
      const pt = calcularPunitorio({
        saldoPendiente: cuota.saldo_pendiente,
        fechaVencimiento: cuota.fecha_vencimiento,
        tasaDiaria: config.tasaDiaria,
        diasGracia: config.diasGracia,
      })
      await supabase.from('cuotas')
        .update({ estado: 'vencida', punitorio_teorico: pt })
        .eq('id', cuota.id)
    }
    actualizadas = cuotasActualizadas.length
  }

  // 2. Actualizar créditos a en_mora
  const creditosAfectados = [...new Set(cuotasActualizadas?.map(c => c.credito_id) ?? [])]
  for (const creditoId of creditosAfectados) {
    const { data: cuotas } = await supabase.from('cuotas').select('estado').eq('credito_id', creditoId)
    const hayVencidas = cuotas?.some(c => c.estado === 'vencida')
    if (hayVencidas) {
      await supabase.from('creditos').update({ estado: 'en_mora' })
        .eq('id', creditoId).eq('empresa_id', empresa_id).eq('estado', 'activo')
      const { data: cred } = await supabase.from('creditos').select('cliente_id').eq('id', creditoId).single()
      if (cred) {
        await supabase.from('clientes').update({ estado: 'moroso' })
          .eq('id', cred.cliente_id).eq('empresa_id', empresa_id).eq('estado', 'activo')
      }
    }
  }

  revalidatePath('/mora')
  return { success: true, actualizadas, creditosAfectados: creditosAfectados.length }
}

// ─── RESUMEN DE MORA (métricas para el header del módulo) ────────────────────
export async function obtenerResumenMoraAction() {
  const { supabase, empresa_id } = await getContexto()
  const hoy = new Date().toISOString().split('T')[0]

  const { count: totalEnMora } = await supabase
    .from('creditos').select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresa_id).eq('estado', 'en_mora')

  const { data: cuotasVencidas } = await supabase
    .from('cuotas')
    .select('saldo_pendiente')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'vencida')

  const saldoTotalVencido = (cuotasVencidas ?? []).reduce((a, c) => a + c.saldo_pendiente, 0)

  const { count: vencidas30 } = await supabase
    .from('creditos')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresa_id)
    .eq('estado', 'en_mora')

  return {
    creditos_en_mora: totalEnMora ?? 0,
    saldo_vencido_total: redondear(saldoTotalVencido),
    cuotas_vencidas_total: cuotasVencidas?.length ?? 0,
  }
}
