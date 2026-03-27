'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { planCreditoSchema } from '@/lib/validations/plan.schema'
import { comercioSchema } from '@/lib/validations/comercio.schema'

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

// ─── PLANES DE CRÉDITO ────────────────────────────────────────────────────────

export async function crearPlanAction(data: unknown) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const parsed = planCreditoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('planes_credito').insert({
    ...parsed.data,
    empresa_id,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un plan con ese código' }
    return { error: 'Error al crear el plan: ' + error.message }
  }

  revalidatePath('/configuracion/planes')
  redirect('/configuracion/planes')
}

export async function actualizarPlanAction(planId: string, data: unknown) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const parsed = planCreditoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase
    .from('planes_credito')
    .update(parsed.data)
    .eq('id', planId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al actualizar: ' + error.message }

  revalidatePath('/configuracion/planes')
  redirect('/configuracion/planes')
}

export async function togglePlanAction(planId: string, activo: boolean) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { error } = await supabase
    .from('planes_credito')
    .update({ activo })
    .eq('id', planId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: error.message }
  revalidatePath('/configuracion/planes')
  return { success: true }
}

export async function obtenerPlanesAction(soloActivos = false) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  let query = supabase
    .from('planes_credito')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('codigo')

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

// ─── COMERCIOS ────────────────────────────────────────────────────────────────

export async function crearComercioAction(data: unknown) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const parsed = comercioSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('comercios').insert({
    ...parsed.data,
    empresa_id,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un comercio con ese código' }
    return { error: 'Error al crear el comercio: ' + error.message }
  }

  revalidatePath('/configuracion/comercios')
  redirect('/configuracion/comercios')
}

export async function actualizarComercioAction(comercioId: string, data: unknown) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const parsed = comercioSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase
    .from('comercios')
    .update(parsed.data)
    .eq('id', comercioId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al actualizar: ' + error.message }

  revalidatePath('/configuracion/comercios')
  redirect('/configuracion/comercios')
}

export async function obtenerComerciosAction(soloActivos = false) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  let query = supabase
    .from('comercios')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('nombre')

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function obtenerVendedoresPorComercioAction(comercioId: string) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .eq('comercio_id', comercioId)
    .eq('empresa_id', empresa_id)
    .eq('activo', true)
    .order('nombre')

  if (error) return { data: [] }
  return { data: data ?? [] }
}
