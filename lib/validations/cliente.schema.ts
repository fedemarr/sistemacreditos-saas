// Schemas de validación para el módulo de clientes.
// Se usan tanto en el frontend (feedback inmediato) como en el servidor (seguridad).
// Zod garantiza que los datos que llegan al servidor son correctos.

import { z } from 'zod'

// ─── PASO 1: Identificación personal ─────────────────────────────────────────
export const paso1Schema = z.object({
  tipo_documento: z.enum(['dni', 'lc', 'le', 'pasaporte', 'cuil', 'cuit']),
  numero_documento: z
    .string()
    .min(7, 'El documento debe tener al menos 7 caracteres')
    .max(15, 'El documento no puede tener más de 15 caracteres')
    .regex(/^[0-9]+$/, 'El documento solo puede contener números'),
  cuil: z
    .string()
    .optional()
    .refine(
      val => !val || /^\d{2}-\d{7,8}-\d$/.test(val),
      'Formato de CUIL inválido. Ej: 20-12345678-9'
    ),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido es demasiado largo'),
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(val => {
      const fecha = new Date(val)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fecha.getFullYear()
      return edad >= 18 && edad <= 100
    }, 'El cliente debe ser mayor de 18 años'),
  nacionalidad: z.string().min(1, 'La nacionalidad es requerida'),
  estado_civil: z.enum([
    'soltero',
    'casado',
    'divorciado',
    'viudo',
    'union_convivencial',
  ]),
  sexo: z.enum(['masculino', 'femenino', 'otro']),
})

// ─── PASO 2: Domicilio y contacto ─────────────────────────────────────────────
export const paso2Schema = z.object({
  domicilio_calle: z
    .string()
    .min(2, 'La calle es requerida'),
  domicilio_nro: z.string().optional(),
  domicilio_piso: z.string().optional(),
  domicilio_entre: z.string().optional(),
  domicilio_barrio: z.string().optional(),
  domicilio_localidad: z
    .string()
    .min(2, 'La localidad es requerida'),
  domicilio_provincia: z
    .string()
    .min(2, 'La provincia es requerida'),
  domicilio_codigo_postal: z.string().optional(),
  telefono: z
    .string()
    .min(6, 'El teléfono debe tener al menos 6 dígitos')
    .max(20, 'El teléfono es demasiado largo'),
  telefono_referencia: z.string().optional(),
  email: z
    .string()
    .email('El email no es válido')
    .optional()
    .or(z.literal('')),
})

// ─── PASO 3: Situación laboral ────────────────────────────────────────────────
export const paso3Schema = z.object({
  ingreso_mensual: z
    .number({ invalid_type_error: 'Ingresá un monto válido' })
    .min(0, 'El ingreso no puede ser negativo'),
  recibo_ingresos: z.string().optional(),
  ramo: z.string().optional(),
  // Datos laborales
  empleador_nombre: z.string().optional(),
  empleador_cuit: z.string().optional(),
  seccion: z.string().optional(),
  tipo_ocupacion: z.string().optional(),
  legajo_laboral: z.string().optional(),
  fecha_ingreso: z.string().optional(),
  // Destino del empleo
  empleo_calle: z.string().optional(),
  empleo_nro: z.string().optional(),
  empleo_provincia: z.string().optional(),
  empleo_localidad: z.string().optional(),
  empleo_telefono: z.string().optional(),
  empleo_interno: z.string().optional(),
  empleo_horario: z.string().optional(),
  // Referencias personales
  referencia1_nombre: z.string().optional(),
  referencia1_relacion: z.string().optional(),
  referencia1_telefono: z.string().optional(),
  referencia2_nombre: z.string().optional(),
  referencia2_relacion: z.string().optional(),
  referencia2_telefono: z.string().optional(),
})

// ─── PASO 4: Clasificación y datos generales ──────────────────────────────────
export const paso4Schema = z.object({
  limite_credito: z
    .number({ invalid_type_error: 'Ingresá un monto válido' })
    .min(0, 'El límite no puede ser negativo')
    .default(0),
  categoria: z.enum(['a', 'b', 'c', 'd', 'e']).default('a'),
  cumplimiento: z
    .enum(['activo', 'inactivo', 'suspendido', 'bloqueado'])
    .default('activo'),
  // Datos familiares
  nombre_padre: z.string().optional(),
  nombre_madre: z.string().optional(),
  conyuge_documento: z.string().optional(),
  conyuge_nombre: z.string().optional(),
  conyuge_apellido: z.string().optional(),
  cantidad_hijos: z
    .number()
    .min(0)
    .max(20)
    .default(0),
  // Vivienda
  vencimiento_alquiler: z.string().optional(),
  presenta_escritura: z.boolean().default(false),
  // Tarjeta
  tarjeta_fecha_emision: z.string().optional(),
  tarjeta_fecha_vencimiento: z.string().optional(),
  // Flags
  es_especial: z.boolean().default(false),
  observaciones: z.string().optional(),
})

// ─── SCHEMA COMPLETO (todos los pasos juntos) ─────────────────────────────────
export const clienteCompletoSchema = paso1Schema
  .merge(paso2Schema)
  .merge(paso3Schema)
  .merge(paso4Schema)

export type Paso1Data = z.infer<typeof paso1Schema>
export type Paso2Data = z.infer<typeof paso2Schema>
export type Paso3Data = z.infer<typeof paso3Schema>
export type Paso4Data = z.infer<typeof paso4Schema>
export type ClienteCompletoData = z.infer<typeof clienteCompletoSchema>
