'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  autorizacionSchema,
  resolverAutorizacionSchema,
} from '@/lib/validations/autorizacion.schema'

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

// ─── CREAR AUTORIZACIÓN ───────────────────────────────────────────────────────
export async function crearAutorizacionAction(data: unknown) {
  const supabase = await createClient()
  const { user, empresa_id } = await getUsuarioYEmpresa()

  const parsed = autorizacionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data

  // Obtener snapshot del cliente al momento de la autorización
  const { data: cliente } = await supabase
    .from('clientes')
    .select('ingreso_mensual, limite_credito, estado, cumplimiento')
    .eq('id', d.cliente_id)
    .eq('empresa_id', empresa_id)
    .single()

  if (!cliente) return { error: 'Cliente no encontrado' }
  if (cliente.estado === 'inhabilitado' || cliente.estado === 'baja') {
    return { error: 'El cliente está inhabilitado y no puede recibir créditos' }
  }

  // Contar autorizaciones pendientes del cliente
  const { count: pendientes } = await supabase
    .from('autorizaciones')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', d.cliente_id)
    .eq('empresa_id', empresa_id)
    .eq('estado', 'pendiente')

  // Calcular saldo en cuenta corriente (suma de cuotas pendientes activas)
  const { data: cuotasPendientes } = await supabase
    .from('cuotas')
    .select('saldo_pendiente, creditos!inner(cliente_id, empresa_id, estado)')
    .eq('creditos.cliente_id', d.cliente_id)
    .eq('creditos.empresa_id', empresa_id)
    .in('estado', ['pendiente', 'vencida', 'parcial'])

  const saldoCuentaCorriente = cuotasPendientes?.reduce(
    (acc, c) => acc + (c.saldo_pendiente ?? 0), 0
  ) ?? 0

  const { data: nueva, error } = await supabase
    .from('autorizaciones')
    .insert({
      empresa_id,
      cliente_id: d.cliente_id,
      comercio_id: d.comercio_id ?? null,
      plan_id: d.plan_id ?? null,
      capital_pedido: d.capital_pedido,
      cancelacion_deuda: d.cancelacion_deuda,
      con_tarjeta: d.con_tarjeta,
      observaciones: d.observaciones ?? null,
      // Snapshots del momento
      ingreso_mensual_snapshot: cliente.ingreso_mensual,
      limite_credito_snapshot: cliente.limite_credito,
      saldo_cuenta_corriente: saldoCuentaCorriente,
      autorizaciones_pendientes: pendientes ?? 0,
      saldo_a_autorizar: (cliente.limite_credito ?? 0) - saldoCuentaCorriente,
      estado: 'pendiente',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !nueva) return { error: 'Error al crear la autorización: ' + error?.message }

  revalidatePath('/autorizaciones')
  redirect(`/autorizaciones/${nueva.id}`)
}

// ─── RESOLVER AUTORIZACIÓN (otorgar/rechazar) ─────────────────────────────────
export async function resolverAutorizacionAction(
  autorizacionId: string,
  data: unknown
) {
  const supabase = await createClient()
  const { user, empresa_id, rol } = await getUsuarioYEmpresa()

  if (rol !== 'admin') {
    return { error: 'Solo el administrador puede resolver autorizaciones' }
  }

  const parsed = resolverAutorizacionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase
    .from('autorizaciones')
    .update({
      estado: parsed.data.estado,
      motivo_rechazo: parsed.data.motivo_rechazo ?? null,
      observaciones: parsed.data.observaciones ?? null,
      autorizador_id: user.id,
      fecha_autorizacion: new Date().toISOString(),
    })
    .eq('id', autorizacionId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al resolver: ' + error.message }

  revalidatePath('/autorizaciones')
  revalidatePath(`/autorizaciones/${autorizacionId}`)
  return { success: true }
}

// ─── OBTENER AUTORIZACIONES ───────────────────────────────────────────────────
export async function obtenerAutorizacionesAction(params?: {
  estado?: string
  pagina?: number
}) {
  const supabase = await createClient()
  const { empresa_id } = await getUsuarioYEmpresa()

  const pagina = params?.pagina ?? 1
  const porPagina = 20
  const desde = (pagina - 1) * porPagina

  let query = supabase
    .from('autorizaciones')
    .select(`
      *,
      clientes(nombre, apellido, numero_documento, tipo_documento),
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

// ─── OBTENER AUTORIZACIÓN POR ID ──────────────────────────────────────────────
export async function obtenerAutorizacionAction(autorizacionId: string) {
  const supabase = await createClient()
  const { empresa_id } = await getUsuarioYEmpresa()

  const { data, error } = await supabase
    .from('autorizaciones')
    .select(`
      *,
      clientes(
        id, nombre, apellido, numero_documento, tipo_documento,
        telefono, ingreso_mensual, limite_credito, estado, categoria
      ),
      comercios(id, nombre, codigo, telefono),
      planes_credito(id, codigo, descripcion, cantidad_cuotas, tasa_anual)
    `)
    .eq('id', autorizacionId)
    .eq('empresa_id', empresa_id)
    .single()

  if (error || !data) return { autorizacion: null }
  return { autorizacion: data }
}
