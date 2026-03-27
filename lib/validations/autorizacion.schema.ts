import { z } from 'zod'

export const autorizacionSchema = z.object({
  cliente_id: z.string().uuid('Seleccioná un cliente'),
  comercio_id: z.string().uuid('Seleccioná un comercio').optional(),
  plan_id: z.string().uuid('Seleccioná un plan').optional(),
  capital_pedido: z
    .number({ invalid_type_error: 'Ingresá un monto' })
    .min(1, 'El capital debe ser mayor a 0'),
  cancelacion_deuda: z.boolean().default(false),
  con_tarjeta: z.boolean().default(false),
  observaciones: z.string().optional(),
})

export const resolverAutorizacionSchema = z.object({
  estado: z.enum(['otorgada', 'rechazada']),
  motivo_rechazo: z.string().optional(),
  observaciones: z.string().optional(),
})

export type AutorizacionData = z.infer<typeof autorizacionSchema>
export type ResolverAutorizacionData = z.infer<typeof resolverAutorizacionSchema>
