'use server'

// Server Actions del módulo de clientes.
// Toda la lógica de base de datos corre en el servidor.
// El cliente solo recibe el resultado.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { clienteCompletoSchema } from '@/lib/validations/cliente.schema'

// ─── OBTENER EMPRESA DEL USUARIO LOGUEADO ─────────────────────────────────────
async function getEmpresaId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .single()

  if (!perfil) throw new Error('Perfil no encontrado')
  return perfil.empresa_id as string
}

// ─── CREAR CLIENTE ────────────────────────────────────────────────────────────
export async function crearClienteAction(data: unknown) {
  const supabase = await createClient()

  // Validar datos con Zod
  const parsed = clienteCompletoSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: 'Datos inválidos: ' + parsed.error.errors[0].message,
    }
  }

  const empresa_id = await getEmpresaId()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const d = parsed.data

  // Verificar que el DNI no exista ya en esta empresa
  const { data: existente } = await supabase
    .from('clientes')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('tipo_documento', d.tipo_documento)
    .eq('numero_documento', d.numero_documento)
    .single()

  if (existente) {
    return { error: 'Ya existe un cliente con ese número de documento' }
  }

  // Insertar cliente principal
  const { data: clienteNuevo, error: clienteError } = await supabase
    .from('clientes')
    .insert({
      empresa_id,
      tipo_documento: d.tipo_documento,
      numero_documento: d.numero_documento,
      cuil: d.cuil || null,
      nombre: d.nombre.toUpperCase(),
      apellido: d.apellido.toUpperCase(),
      fecha_nacimiento: d.fecha_nacimiento,
      nacionalidad: d.nacionalidad,
      estado_civil: d.estado_civil,
      sexo: d.sexo,
      domicilio_calle: d.domicilio_calle,
      domicilio_nro: d.domicilio_nro || null,
      domicilio_piso: d.domicilio_piso || null,
      domicilio_entre: d.domicilio_entre || null,
      domicilio_barrio: d.domicilio_barrio || null,
      domicilio_localidad: d.domicilio_localidad,
      domicilio_provincia: d.domicilio_provincia,
      domicilio_codigo_postal: d.domicilio_codigo_postal || null,
      telefono: d.telefono,
      telefono_referencia: d.telefono_referencia || null,
      email: d.email || null,
      ingreso_mensual: d.ingreso_mensual,
      recibo_ingresos: d.recibo_ingresos || null,
      ramo: d.ramo || null,
      limite_credito: d.limite_credito,
      categoria: d.categoria,
      cumplimiento: d.cumplimiento,
      vencimiento_alquiler: d.vencimiento_alquiler || null,
      presenta_escritura: d.presenta_escritura,
      tarjeta_fecha_emision: d.tarjeta_fecha_emision || null,
      tarjeta_fecha_vencimiento: d.tarjeta_fecha_vencimiento || null,
      es_especial: d.es_especial,
      observaciones: d.observaciones || null,
      estado: 'pendiente_verificacion',
      created_by: user!.id,
    })
    .select('id')
    .single()

  if (clienteError || !clienteNuevo) {
    return { error: 'Error al crear el cliente: ' + clienteError?.message }
  }

  const clienteId = clienteNuevo.id

  // Insertar datos laborales si hay información
  if (d.empleador_nombre || d.seccion || d.legajo_laboral) {
    await supabase.from('datos_laborales').insert({
      cliente_id: clienteId,
      empresa_id,
      empleador_nombre: d.empleador_nombre || null,
      empleador_cuit: d.empleador_cuit || null,
      seccion: d.seccion || null,
      tipo_ocupacion: d.tipo_ocupacion || null,
      legajo_laboral: d.legajo_laboral || null,
      fecha_ingreso: d.fecha_ingreso || null,
      empleo_calle: d.empleo_calle || null,
      empleo_nro: d.empleo_nro || null,
      empleo_provincia: d.empleo_provincia || null,
      empleo_localidad: d.empleo_localidad || null,
      empleo_telefono: d.empleo_telefono || null,
      empleo_interno: d.empleo_interno || null,
      empleo_horario: d.empleo_horario || null,
    })
  }

  // Insertar referencias personales
  if (d.referencia1_nombre && d.referencia1_telefono) {
    await supabase.from('referencias_personales').insert({
      cliente_id: clienteId,
      empresa_id,
      nombre: d.referencia1_nombre,
      relacion: d.referencia1_relacion || 'OTRO',
      telefono: d.referencia1_telefono,
      orden: 1,
    })
  }

  if (d.referencia2_nombre && d.referencia2_telefono) {
    await supabase.from('referencias_personales').insert({
      cliente_id: clienteId,
      empresa_id,
      nombre: d.referencia2_nombre,
      relacion: d.referencia2_relacion || 'OTRO',
      telefono: d.referencia2_telefono,
      orden: 2,
    })
  }

  // Insertar datos familiares si hay información
  if (d.nombre_padre || d.nombre_madre || d.conyuge_nombre || d.cantidad_hijos > 0) {
    await supabase.from('datos_familiares').insert({
      cliente_id: clienteId,
      empresa_id,
      nombre_padre: d.nombre_padre || null,
      nombre_madre: d.nombre_madre || null,
      conyuge_documento: d.conyuge_documento || null,
      conyuge_nombre: d.conyuge_nombre || null,
      conyuge_apellido: d.conyuge_apellido || null,
      cantidad_hijos: d.cantidad_hijos,
    })
  }

  // Crear trámite automático de verificación
  await supabase.from('tramites').insert({
    empresa_id,
    cliente_id: clienteId,
    estado: 'pendiente',
    prioridad: 'media',
    alertar: false,
    observacion_1: 'Alta de cliente pendiente de verificación',
    created_by: user!.id,
  })

  revalidatePath('/clientes')
  redirect(`/clientes/${clienteId}`)
}

// ─── ACTUALIZAR CLIENTE ───────────────────────────────────────────────────────
export async function actualizarClienteAction(
  clienteId: string,
  data: unknown
) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const parsed = clienteCompletoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos: ' + parsed.error.errors[0].message }
  }

  const d = parsed.data

  const { error } = await supabase
    .from('clientes')
    .update({
      tipo_documento: d.tipo_documento,
      numero_documento: d.numero_documento,
      cuil: d.cuil || null,
      nombre: d.nombre.toUpperCase(),
      apellido: d.apellido.toUpperCase(),
      fecha_nacimiento: d.fecha_nacimiento,
      nacionalidad: d.nacionalidad,
      estado_civil: d.estado_civil,
      sexo: d.sexo,
      domicilio_calle: d.domicilio_calle,
      domicilio_nro: d.domicilio_nro || null,
      domicilio_piso: d.domicilio_piso || null,
      domicilio_entre: d.domicilio_entre || null,
      domicilio_barrio: d.domicilio_barrio || null,
      domicilio_localidad: d.domicilio_localidad,
      domicilio_provincia: d.domicilio_provincia,
      domicilio_codigo_postal: d.domicilio_codigo_postal || null,
      telefono: d.telefono,
      telefono_referencia: d.telefono_referencia || null,
      email: d.email || null,
      ingreso_mensual: d.ingreso_mensual,
      recibo_ingresos: d.recibo_ingresos || null,
      ramo: d.ramo || null,
      limite_credito: d.limite_credito,
      categoria: d.categoria,
      cumplimiento: d.cumplimiento,
      vencimiento_alquiler: d.vencimiento_alquiler || null,
      presenta_escritura: d.presenta_escritura,
      tarjeta_fecha_emision: d.tarjeta_fecha_emision || null,
      tarjeta_fecha_vencimiento: d.tarjeta_fecha_vencimiento || null,
      es_especial: d.es_especial,
      observaciones: d.observaciones || null,
    })
    .eq('id', clienteId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al actualizar: ' + error.message }

  // Upsert datos laborales
  await supabase.from('datos_laborales').upsert({
    cliente_id: clienteId,
    empresa_id,
    empleador_nombre: d.empleador_nombre || null,
    empleador_cuit: d.empleador_cuit || null,
    seccion: d.seccion || null,
    tipo_ocupacion: d.tipo_ocupacion || null,
    legajo_laboral: d.legajo_laboral || null,
    fecha_ingreso: d.fecha_ingreso || null,
    empleo_calle: d.empleo_calle || null,
    empleo_nro: d.empleo_nro || null,
    empleo_provincia: d.empleo_provincia || null,
    empleo_localidad: d.empleo_localidad || null,
    empleo_telefono: d.empleo_telefono || null,
    empleo_interno: d.empleo_interno || null,
    empleo_horario: d.empleo_horario || null,
  }, { onConflict: 'cliente_id' })

  // Upsert datos familiares
  await supabase.from('datos_familiares').upsert({
    cliente_id: clienteId,
    empresa_id,
    nombre_padre: d.nombre_padre || null,
    nombre_madre: d.nombre_madre || null,
    conyuge_documento: d.conyuge_documento || null,
    conyuge_nombre: d.conyuge_nombre || null,
    conyuge_apellido: d.conyuge_apellido || null,
    cantidad_hijos: d.cantidad_hijos,
  }, { onConflict: 'cliente_id' })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clienteId}`)
  redirect(`/clientes/${clienteId}`)
}

// ─── CAMBIAR ESTADO DEL CLIENTE ───────────────────────────────────────────────
export async function cambiarEstadoClienteAction(
  clienteId: string,
  estado: string
) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { error } = await supabase
    .from('clientes')
    .update({ estado })
    .eq('id', clienteId)
    .eq('empresa_id', empresa_id)

  if (error) return { error: 'Error al cambiar estado: ' + error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

// ─── OBTENER CLIENTES (para tabla) ───────────────────────────────────────────
export async function obtenerClientesAction(params?: {
  busqueda?: string
  estado?: string
  pagina?: number
  porPagina?: number
}) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const pagina = params?.pagina ?? 1
  const porPagina = params?.porPagina ?? 20
  const desde = (pagina - 1) * porPagina

  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (params?.busqueda) {
    const b = params.busqueda.trim()
    query = query.or(
      `apellido.ilike.%${b}%,nombre.ilike.%${b}%,numero_documento.ilike.%${b}%`
    )
  }

  if (params?.estado) {
    query = query.eq('estado', params.estado)
  }

  const { data, error, count } = await query

  if (error) return { data: [], total: 0, error: error.message }
  return { data: data ?? [], total: count ?? 0 }
}

// ─── OBTENER CLIENTE POR ID (con todas las relaciones) ────────────────────────
export async function obtenerClienteAction(clienteId: string) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .eq('empresa_id', empresa_id)
    .single()

  if (error || !cliente) return { cliente: null, error: 'Cliente no encontrado' }

  // Cargar datos relacionados en paralelo
  const [laboral, referencias, familiar, tramites, creditos] =
    await Promise.all([
      supabase
        .from('datos_laborales')
        .select('*')
        .eq('cliente_id', clienteId)
        .single(),
      supabase
        .from('referencias_personales')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('orden'),
      supabase
        .from('datos_familiares')
        .select('*')
        .eq('cliente_id', clienteId)
        .single(),
      supabase
        .from('tramites')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('creditos')
        .select('id, numero_credito, monto_otorgado, estado, fecha_otorgamiento, cantidad_cuotas')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false }),
    ])

  return {
    cliente,
    laboral: laboral.data,
    referencias: referencias.data ?? [],
    familiar: familiar.data,
    tramites: tramites.data ?? [],
    creditos: creditos.data ?? [],
  }
}

// ─── VERIFICAR DNI DUPLICADO ─────────────────────────────────────────────────
export async function verificarDniAction(
  tipoDoc: string,
  nroDoc: string,
  clienteIdExcluir?: string
) {
  const supabase = await createClient()
  const empresa_id = await getEmpresaId()

  let query = supabase
    .from('clientes')
    .select('id, nombre, apellido')
    .eq('empresa_id', empresa_id)
    .eq('tipo_documento', tipoDoc)
    .eq('numero_documento', nroDoc)

  if (clienteIdExcluir) {
    query = query.neq('id', clienteIdExcluir)
  }

  const { data } = await query.single()
  return { existe: !!data, cliente: data }
}
