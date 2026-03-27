import { z } from 'zod'

export const solicitudSchema = z.object({
  cliente_id: z.string().uuid('Seleccioná un cliente'),
  autorizacion_id: z.string().uuid().optional(),
  comercio_id: z.string().uuid().optional(),
  vendedor_id: z.string().uuid().optional(),
  plan_id: z.string().uuid('Seleccioná un plan'),
  capital_pedido: z
    .number({ invalid_type_error: 'Ingresá un monto' })
    .min(1, 'El capital debe ser mayor a 0'),
  tasa_anual: z
    .number({ invalid_type_error: 'Ingresá la tasa' })
    .min(0),
  cantidad_cuotas: z
    .number({ invalid_type_error: 'Ingresá las cuotas' })
    .int()
    .min(1),
  sistema_amortizacion: z.enum(['frances', 'aleman']).default('frances'),
  gastos: z.number().min(0).default(0),
  descuento: z.number().min(0).default(0),
  cuota_retenida: z.boolean().default(false),
  fecha_primer_vencimiento: z.string().min(1, 'La fecha es requerida'),
  fecha_levante: z.string().optional(),
  numero_tanda: z.string().optional(),
  es_renovacion: z.boolean().default(false),
  es_plan_dni: z.boolean().default(false),
  avalada: z.boolean().default(false),
  con_tarjeta: z.boolean().default(false),
  relacion: z.enum(['generica', 'empleado', 'proveedor', 'otro']).default('generica'),
  observaciones: z.string().optional(),
  // Garantes (IDs de otros clientes)
  garantes: z.array(z.object({
    garante_id: z.string().uuid(),
    tipo_garante: z.enum(['solidario', 'simple', 'hipotecario', 'prendario']).default('solidario'),
    observaciones: z.string().optional(),
  })).default([]),
})

export const resolverSolicitudSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada']),
  motivo_rechazo: z.string().optional(),
})

export type SolicitudData = z.infer<typeof solicitudSchema>
export type ResolverSolicitudData = z.infer<typeof resolverSolicitudSchema>
