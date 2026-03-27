import { z } from 'zod'

export const comercioSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido').max(100),
  codigo: z.string().min(1, 'El código es requerido').max(20).toUpperCase(),
  razon_social: z.string().optional(),
  cuit: z.string().optional(),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  contacto_nombre: z.string().optional(),
  activo: z.boolean().default(true),
})

export type ComercioData = z.infer<typeof comercioSchema>
