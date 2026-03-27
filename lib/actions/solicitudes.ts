'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  solicitudSchema,
  resolverSolicitudSchema,
} from '@/lib/validations/solicitud.schema'
import { calcularPlanDePagos, calcularTotalFinanciado } from '@/lib/calculadora/amortizacion'
import { SistemaAmortizacion } from '@/types/enums'

async function getUsuarioYEmpresa() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id, rol')
    .eq('usuario_id', user.id)
    .single()
  if (!perfil) throw new Error('Perfil no encontrado')
  return { user, empresa_id: perfil.empresa_id as string, rol: perfil.rol as string }
}

// ─── CREAR SOLICITUD ──────────────────────────────────────────────────────────
export async function crearSolicitudAction(data: unknown) {
  const supabase = await createClient()
  const { user, empresa_id } = await getUsuarioYEmpresa()

  const parsed = solicitudSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data

  // Si tiene autorización, marcarla como utilizada
  if (d.autorizacion_id) {
    const { data: autorizacion } = await supabase
      .from('autorizaciones')
      .select('estado')
      .eq('id', d.autorizacion_id)
      .eq('empresa_id', empresa_id)
      .single()

    if (!autorizacion) return { error: 'Autorización no encontrada' }
    if (autorizacion.estado !== 'otorgada') {
      return { error: 'La autorización debe estar otorgada para crear la solicitud' }
    }
  }

  const { data: nueva, error } = await supabase
    .from('solicitudes_credito')
    .insert({
      empresa_id,
      cliente_id: d.cliente_id,
      autorizacion_id: d.autorizacion_id ?? null,
      comercio_id: d.comercio_id ?? null,
      vendedor_id: d.vendedor_id ?? null,
      plan_id: d.plan_id,
      capital_pedido: d.capital_pedido,
      tasa_anual: d.tasa_anual,
      cantidad_cuotas: d.cantidad_cuotas,
      sistema_amortizacion: d.sistema_amortizacion,
      gastos: d.gastos,
      descuento: d.descuento,
      cuota_retenida: d.cuota_retenida,
      fecha_primer_vencimiento: d.fecha_primer_vencimiento,
      fecha_levante: d.fecha_levante ?? null,
      numero_tanda: d.numero_tanda ?? null,
      es_renovacion: d.es_renovacion,
      es_plan_dni: d.es_plan_dni,
      avalada: d.avalada,
      con_tarjeta: d.con_tarjeta,
      relacion: d.relacion,
      observaciones: d.observaciones ?? null,
      estado: 'activada',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !nueva) return { error: 'Error al crear la solicitud: ' + error?.message }

  // Marcar autorización como utilizada
  if (d.autorizacion_id) {
    await supabase
      .from('autorizaciones')
      .update({ estado: 'utilizada' })
      .eq('id', d.autorizacion_id)
  }

  revalidatePath('/solicitudes')
  redirect(`/solicitudes/${nueva.id}`)
}

// ─── APROBAR SOLICITUD → GENERAR CRÉDITO ─────────────────────────────────────
export async function aprobarSolicitudAction(solicitudId: string) {
  const supabase = await createClient()
  const { user, empresa_id, rol } = await getUsuarioYEmpresa()

  if (rol !== 'admin') return { error: 'Solo el administrador puede aprobar solicitudes' }

  // Obtener solicitud completa
  const { data: solicitud } = await supabase
    .from('solicitudes_credito')
    .select('*')
    .eq('id', solicitudId)
    .eq('empresa_id', empresa_id)
    .single()

  if (!solicitud) return { error: 'Solicitud no encontrada' }
  if (solicitud.estado !== 'activada' && solicitud.estado !== 'pendiente') {
    return { error: 'La solicitud no está en estado válido para aprobar' }
  }

  if (!solicitud.fecha_primer_vencimiento) {
    return { error: 'La solicitud no tiene fecha de primer vencimiento' }
  }

  // Calcular plan de pagos
  const cuotasCalculadas = calcularPlanDePagos(
    {
      monto: solicitud.capital_pedido,
      tasaAnual: solicitud.tasa_anual,
      cantidadCuotas: solicitud.cantidad_cuotas,
      fechaPrimerVencimiento: solicitud.fecha_primer_vencimiento,
    },
    solicitud.sistema_amortizacion as SistemaAmortizacion
  )

  const totalFinanciado = calcularTotalFinanciado(cuotasCalculadas)

  // Crear el crédito
  const { data: credito, error: creditoError } = await supabase
    .from('creditos')
    .insert({
      empresa_id,
      solicitud_id: solicitudId,
      cliente_id: solicitud.cliente_id,
      plan_id: solicitud.plan_id,
      comercio_id: solicitud.comercio_id,
      monto_otorgado: solicitud.capital_pedido,
      tasa_anual: solicitud.tasa_anual,
      cantidad_cuotas: solicitud.cantidad_cuotas,
      sistema_amortizacion: solicitud.sistema_amortizacion,
      monto_total_financiado: totalFinanciado,
      gastos_otorgamiento: solicitud.gastos,
      cuota_retenida: solicitud.cuota_retenida,
      fecha_otorgamiento: new Date().toISOString().split('T')[0],
      fecha_primer_vencimiento: solicitud.fecha_primer_vencimiento,
      estado: 'activo',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (creditoError || !credito) {
    return { error: 'Error al crear el crédito: ' + creditoError?.message }
  }

  // Insertar las cuotas del plan de pagos
  const cuotasParaInsertar = cuotasCalculadas.map(c => ({
    credito_id: credito.id,
    empresa_id,
    numero_cuota: c.numero_cuota,
    fecha_vencimiento: c.fecha_vencimiento,
    capital: c.capital,
    interes: c.interes,
    punitorio: 0,
    total: c.total,
    saldo_pendiente: c.total,
    estado: 'pendiente',
  }))

  const { error: cuotasError } = await supabase
    .from('cuotas')
    .insert(cuotasParaInsertar)

  if (cuotasError) {
    // Rollback: eliminar el crédito si fallan las cuotas
    await supabase.from('creditos').delete().eq('id', credito.id)
    return { error: 'Error al generar las cuotas: ' + cuotasError.message }
  }

  // Actualizar estado de la solicitud
  await supabase
    .from('solicitudes_credito')
    .update({
      estado: 'aprobada',
      revisado_por: user.id,
      fecha_resolucion: new Date().toISOString(),
    })
    .eq('id', solicitudId)

  // Actualizar estado del cliente a activo si estaba pendiente
  await supabase
    .from('clientes')
    .update({ estado: 'activo' })
    .eq('id', solicitud.cliente_id)
    .eq('estado', 'pendiente_verificacion')

  revalidatePath('/solicitudes')
  revalidatePath('/creditos')
  redirect(`/creditos/${credito.id}`)
}

// ─── RECHAZAR SOLICITUD ───────────────────────────────────────────────────────
export async function rechazarSolicitudAction(
  solicitudId: string,
  data: unknown
) {
  const supabase = await createClient()
  const { user, empresa_id, rol } = await getUsuarioYEmpresa()

  if (rol !== 'admin') return { error: 'Solo el administrador puede rechazar solicitudes' }

  const parsed = resolverSolicitudSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase
    .from('solicitudes_credito')
    .update({
      estado: 'rechazada',
      motivo_rechazo: parsed.data.motivo_rechazo ?? null,
      revisado_por: user.id,
      fecha_resolucion: new Date().toISOString(),
    })
    .eq('id', solicitudId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al rechazar: ' + error.message }

  revalidatePath('/solicitudes')
  revalidatePath(`/solicitudes/${solicitudId}`)
  return { success: true }
}

// ─── OBTENER SOLICITUDES ──────────────────────────────────────────────────────
export async function obtenerSolicitudesAction(params?: {
  estado?: string
  pagina?: number
}) {
  const supabase = await createClient()
  const { empresa_id } = await getUsuarioYEmpresa()

  const pagina = params?.pagina ?? 1
  const porPagina = 20
  const desde = (pagina - 1) * porPagina

  let query = supabase
    .from('solicitudes_credito')
    .select(`
      *,
      clientes(nombre, apellido, numero_documento, tipo_documento),
      planes_credito(codigo, descripcion),
      comercios(nombre, codigo)
    `, { count: 'exact' })
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (params?.estado) query = query.eq('estado', params.estado)

  const { data, error, count } = await query
  if (error) return { data: [], total: 0 }
  return { data: data ?? [], total: count ?? 0 }
}

// ─── OBTENER SOLICITUD POR ID ─────────────────────────────────────────────────
export async function obtenerSolicitudAction(solicitudId: string) {
  const supabase = await createClient()
  const { empresa_id } = await getUsuarioYEmpresa()

  const { data, error } = await supabase
    .from('solicitudes_credito')
    .select(`
      *,
      clientes(id, nombre, apellido, numero_documento, tipo_documento, telefono, ingreso_mensual, limite_credito),
      planes_credito(id, codigo, descripcion, cantidad_cuotas, tasa_anual, sistema_amortizacion),
      comercios(id, nombre, codigo, telefono),
      vendedores(id, nombre, apellido, codigo),
      autorizaciones(id, numero_autorizacion, estado)
    `)
    .eq('id', solicitudId)
    .eq('empresa_id', empresa_id)
    .single()

  if (error || !data) return { solicitud: null }
  return { solicitud: data }
}
