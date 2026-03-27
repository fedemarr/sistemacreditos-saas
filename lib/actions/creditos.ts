'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getEmpresaId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) throw new Error('Perfil no encontrado')
  return perfil.empresa_id as string
}

// ─── OBTENER CRÉDITOS (para tabla con filtros) ────────────────────────────────
export async function obtenerCreditosAction(params?: {
  estado?: string
  busqueda?: string
  pagina?: number
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const pagina = params?.pagina ?? 1
  const porPagina = 20
  const desde = (pagina - 1) * porPagina

  let query = supabase
    .from('creditos')
    .select(`
      id, numero_credito, monto_otorgado, tasa_anual,
      cantidad_cuotas, estado, fecha_otorgamiento,
      fecha_primer_vencimiento, monto_total_financiado, cuota_retenida,
      clientes(id, nombre, apellido, numero_documento, tipo_documento),
      planes_credito(codigo, descripcion)
    `, { count: 'exact' })
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (params?.estado) query = query.eq('estado', params.estado)

  if (params?.busqueda) {
    const b = params.busqueda.trim()
    if (/^\d+$/.test(b)) {
      query = query.eq('numero_credito', parseInt(b))
    }
  }

  const { data, error, count } = await query
  if (error) return { data: [], total: 0 }
  return { data: data ?? [], total: count ?? 0 }
}

// ─── OBTENER CRÉDITO POR ID (con cuotas y garantes) ──────────────────────────
export async function obtenerCreditoAction(creditoId: string) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: credito, error } = await supabase
    .from('creditos')
    .select(`
      *,
      clientes(
        id, nombre, apellido, numero_documento, tipo_documento,
        telefono, email, ingreso_mensual, limite_credito, estado
      ),
      planes_credito(id, codigo, descripcion, cantidad_cuotas, tasa_anual, sistema_amortizacion),
      comercios(id, nombre, codigo)
    `)
    .eq('id', creditoId)
    .eq('empresa_id', empresa_id)
    .single()

  if (error || !credito) return { credito: null }

  // Cuotas con pagos
  const { data: cuotas } = await supabase
    .from('cuotas')
    .select('*, pagos(id, fecha_pago, monto_pagado, medio_pago, anulado)')
    .eq('credito_id', creditoId)
    .order('numero_cuota')

  // Garantes
  const { data: garantes } = await supabase
    .from('garantes_credito')
    .select('*, clientes_garante:garante_id(id, nombre, apellido, numero_documento, tipo_documento)')
    .eq('credito_id', creditoId)

  const cuotasList = cuotas ?? []

  // Calcular estadísticas
  const totalPagado = cuotasList.reduce((acc, c) => {
    const pagosValidos = (c.pagos as any[])?.filter((p: any) => !p.anulado) ?? []
    return acc + pagosValidos.reduce((s: number, p: any) => s + p.monto_pagado, 0)
  }, 0)

  const saldoPendiente = cuotasList.reduce((acc, c) => acc + (c.saldo_pendiente ?? 0), 0)
  const cuotasVencidas = cuotasList.filter(c => c.estado === 'vencida').length
  const cuotasPagadas = cuotasList.filter(c => c.estado === 'pagada').length
  const proximaVencer = cuotasList.find(c => c.estado === 'pendiente' || c.estado === 'parcial')

  return {
    credito,
    cuotas: cuotasList,
    garantes: garantes ?? [],
    stats: {
      totalPagado,
      saldoPendiente,
      cuotasVencidas,
      cuotasPagadas,
      proximaVencer,
      totalCuotas: cuotasList.length,
    },
  }
}

// ─── ACTUALIZAR CUOTAS VENCIDAS DE UN CRÉDITO ────────────────────────────────
export async function actualizarCuotasVencidasAction(creditoId: string) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()
  const hoy = new Date().toISOString().split('T')[0]

  await supabase
    .from('cuotas')
    .update({ estado: 'vencida' })
    .eq('credito_id', creditoId)
    .eq('empresa_id', empresa_id)
    .in('estado', ['pendiente', 'parcial'])
    .lt('fecha_vencimiento', hoy)

  // Si hay vencidas, pasar el crédito a en_mora
  const { data: vencidas } = await supabase
    .from('cuotas')
    .select('id')
    .eq('credito_id', creditoId)
    .eq('estado', 'vencida')
    .limit(1)

  if (vencidas && vencidas.length > 0) {
    await supabase
      .from('creditos')
      .update({ estado: 'en_mora' })
      .eq('id', creditoId)
      .eq('empresa_id', empresa_id)
      .eq('estado', 'activo')

    const { data: cred } = await supabase
      .from('creditos')
      .select('cliente_id')
      .eq('id', creditoId)
      .single()

    if (cred) {
      await supabase
        .from('clientes')
        .update({ estado: 'moroso' })
        .eq('id', cred.cliente_id)
        .eq('empresa_id', empresa_id)
        .eq('estado', 'activo')
    }
  }

  revalidatePath(`/creditos/${creditoId}`)
  return { success: true }
}

// ─── CANCELAR CRÉDITO MANUALMENTE ────────────────────────────────────────────
export async function cancelarCreditoAction(creditoId: string) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  // Verificar que no tenga saldo pendiente
  const { data: pendientes } = await supabase
    .from('cuotas')
    .select('id')
    .eq('credito_id', creditoId)
    .in('estado', ['pendiente', 'parcial', 'vencida'])
    .limit(1)

  if (pendientes && pendientes.length > 0) {
    return { error: 'El crédito tiene cuotas pendientes de pago' }
  }

  await supabase
    .from('creditos')
    .update({ estado: 'cancelado' })
    .eq('id', creditoId)
    .eq('empresa_id', empresa_id)

  // Revisar si el cliente puede volver a activo
  const { data: cred } = await supabase
    .from('creditos')
    .select('cliente_id')
    .eq('id', creditoId)
    .single()

  if (cred) {
    const { data: otros } = await supabase
      .from('creditos')
      .select('id')
      .eq('cliente_id', cred.cliente_id)
      .eq('empresa_id', empresa_id)
      .in('estado', ['activo', 'en_mora'])
      .neq('id', creditoId)
      .limit(1)

    if (!otros || otros.length === 0) {
      await supabase
        .from('clientes')
        .update({ estado: 'activo' })
        .eq('id', cred.cliente_id)
        .eq('estado', 'moroso')
    }
  }

  revalidatePath('/creditos')
  revalidatePath(`/creditos/${creditoId}`)
  return { success: true }
}
