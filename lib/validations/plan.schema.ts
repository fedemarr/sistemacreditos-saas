import { z } from 'zod'

export const planCreditoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'Máximo 20 caracteres')
    .toUpperCase(),
  descripcion: z
    .string()
    .min(3, 'La descripción es requerida')
    .max(100, 'Máximo 100 caracteres'),
  cantidad_cuotas: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 cuota')
    .max(120, 'Máximo 120 cuotas'),
  tasa_anual: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .min(0, 'La tasa no puede ser negativa')
    .max(999, 'La tasa parece incorrecta'),
  sistema_amortizacion: z.enum(['frances', 'aleman']).default('frances'),
  gastos_otorgamiento: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .min(0)
    .default(0),
  cuota_retenida: z.boolean().default(false),
  es_plan_dni: z.boolean().default(false),
  activo: z.boolean().default(true),
})

export type PlanCreditoData = z.infer<typeof planCreditoSchema>
