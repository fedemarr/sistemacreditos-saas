'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getContexto() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('empresa_id, rol').eq('usuario_id', user.id).single()
  if (!perfil) throw new Error('Perfil no encontrado')
  return { supabase, user, empresa_id: perfil.empresa_id as string, rol: perfil.rol as string }
}

// ─── REGISTRAR GESTIÓN ────────────────────────────────────────────────────────
export async function registrarGestionAction(params: {
  credito_id: string
  cliente_id: string
  tipo: string
  resultado: string
  observaciones?: string
  promesa_fecha?: string
  promesa_monto?: number
}) {
  const { supabase, user, empresa_id } = await getContexto()

  // Validar promesa de pago
  if (params.resultado === 'promesa_pago' && !params.promesa_fecha) {
    return { error: 'Ingresá la fecha de la promesa de pago' }
  }

  const { error } = await supabase.from('gestiones_cobranza').insert({
    empresa_id,
    credito_id: params.credito_id,
    cliente_id: params.cliente_id,
    tipo: params.tipo,
    resultado: params.resultado,
    observaciones: params.observaciones ?? null,
    promesa_fecha: params.promesa_fecha ?? null,
    promesa_monto: params.promesa_monto ?? null,
    gestionado_por: user.id,
  })

  if (error) return { error: 'Error al registrar la gestión: ' + error.message }

  revalidatePath(`/crm`)
  revalidatePath(`/mora`)
  return { success: true }
}

// ─── OBTENER GESTIONES DE UN CRÉDITO ─────────────────────────────────────────
export async function obtenerGestionesCreditoAction(credito_id: string) {
  const { supabase, empresa_id } = await getContexto()

  const { data, error } = await supabase
    .from('gestiones_cobranza')
    .select(`
      id, tipo, resultado, observaciones,
      promesa_fecha, promesa_monto, created_at,
      perfiles_usuario:gestionado_por(nombre, apellido)
    `)
    .eq('credito_id', credito_id)
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })

  if (error) return { data: [] }
  return { data: data ?? [] }
}

// ─── OBTENER TODAS LAS GESTIONES (vista CRM) ─────────────────────────────────
export async function obtenerGestionesAction(params?: {
  resultado?: string
  tipo?: string
  pagina?: number
}) {
  const { supabase, empresa_id } = await getContexto()
  const pagina = params?.pagina ?? 1
  const porPagina = 25
  const desde = (pagina - 1) * porPagina

  let query = supabase
    .from('gestiones_cobranza')
    .select(`
      id, tipo, resultado, observaciones,
      promesa_fecha, promesa_monto, created_at,
      creditos(id, numero_credito, estado),
      clientes(id, nombre, apellido, numero_documento, tipo_documento, telefono),
      perfiles_usuario:gestionado_por(nombre, apellido)
    `, { count: 'exact' })
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (params?.resultado) query = query.eq('resultado', params.resultado)
  if (params?.tipo) query = query.eq('tipo', params.tipo)

  const { data, error, count } = await query
  if (error) return { data: [], total: 0 }
  return { data: data ?? [], total: count ?? 0 }
}

// ─── OBTENER PROMESAS PENDIENTES ──────────────────────────────────────────────
export async function obtenerPromesasPendientesAction() {
  const { supabase, empresa_id } = await getContexto()
  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('gestiones_cobranza')
    .select(`
      id, promesa_fecha, promesa_monto, observaciones, created_at,
      creditos(id, numero_credito, estado),
      clientes(id, nombre, apellido, numero_documento, telefono)
    `)
    .eq('empresa_id', empresa_id)
    .eq('resultado', 'promesa_pago')
    .gte('promesa_fecha', hoy)
    .order('promesa_fecha', { ascending: true })
    .limit(50)

  if (error) return { data: [] }
  return { data: data ?? [] }
}

// ─── OBTENER PROMESAS VENCIDAS ────────────────────────────────────────────────
export async function obtenerPromesasVencidasAction() {
  const { supabase, empresa_id } = await getContexto()
  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('gestiones_cobranza')
    .select(`
      id, promesa_fecha, promesa_monto, observaciones, created_at,
      creditos(id, numero_credito, estado),
      clientes(id, nombre, apellido, numero_documento, telefono)
    `)
    .eq('empresa_id', empresa_id)
    .eq('resultado', 'promesa_pago')
    .lt('promesa_fecha', hoy)
    .order('promesa_fecha', { ascending: false })
    .limit(50)

  if (error) return { data: [] }
  return { data: data ?? [] }
}

// ─── RESUMEN CRM ──────────────────────────────────────────────────────────────
export async function obtenerResumenCRMAction() {
  const { supabase, empresa_id } = await getContexto()
  const hoy = new Date().toISOString().split('T')[0]
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: totalGestiones },
    { count: gestionesSemana },
    { count: promesasPendientes },
    { count: promesasVencidas },
  ] = await Promise.all([
    supabase.from('gestiones_cobranza').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa_id),
    supabase.from('gestiones_cobranza').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa_id).gte('created_at', hace7dias),
    supabase.from('gestiones_cobranza').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa_id).eq('resultado', 'promesa_pago').gte('promesa_fecha', hoy),
    supabase.from('gestiones_cobranza').select('id', { count: 'exact', head: true }).eq('empresa_id', empresa_id).eq('resultado', 'promesa_pago').lt('promesa_fecha', hoy),
  ])

  return {
    total_gestiones: totalGestiones ?? 0,
    gestiones_semana: gestionesSemana ?? 0,
    promesas_pendientes: promesasPendientes ?? 0,
    promesas_vencidas: promesasVencidas ?? 0,
  }
}
