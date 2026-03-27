// Funciones utilitarias de formateo.
// Se usan en cualquier componente sin repetir lógica.
// Siempre importar desde '@/lib/utils/formatters'.

import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea un número como moneda en pesos argentinos.
 * Ej: 15000 → "$15.000,00"
 */
export function formatMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(valor)
}

/**
 * Formatea un número como porcentaje con 2 decimales.
 * Ej: 36.5 → "36,50%"
 */
export function formatPorcentaje(valor: number): string {
  return `${valor.toFixed(2)}%`
}

/**
 * Formatea una fecha ISO a formato legible argentino.
 * Ej: "2024-03-15" → "15/03/2024"
 */
export function formatFecha(fecha: string): string {
  try {
    return format(parseISO(fecha), 'dd/MM/yyyy', { locale: es })
  } catch {
    return fecha
  }
}

/**
 * Formatea fecha y hora.
 * Ej: "2024-03-15T14:30:00" → "15/03/2024 14:30"
 */
export function formatFechaHora(fecha: string): string {
  try {
    return format(parseISO(fecha), 'dd/MM/yyyy HH:mm', { locale: es })
  } catch {
    return fecha
  }
}

/**
 * Formatea fecha en formato largo.
 * Ej: "2024-03-15" → "15 de marzo de 2024"
 */
export function formatFechaLarga(fecha: string): string {
  try {
    return format(parseISO(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return fecha
  }
}

/**
 * Calcula los días de atraso de una cuota vencida.
 * Retorna 0 si la cuota no está vencida.
 */
export function diasAtraso(fechaVencimiento: string): number {
  const hoy = new Date()
  const vencimiento = parseISO(fechaVencimiento)
  if (isAfter(hoy, vencimiento)) {
    return differenceInDays(hoy, vencimiento)
  }
  return 0
}

/**
 * Verifica si una fecha ya venció.
 */
export function estaVencida(fechaVencimiento: string): boolean {
  return isAfter(new Date(), parseISO(fechaVencimiento))
}

/**
 * Verifica si una fecha es futura.
 */
export function esFutura(fecha: string): boolean {
  return isBefore(new Date(), parseISO(fecha))
}

/**
 * Formatea un DNI con puntos separadores.
 * Ej: "30123456" → "30.123.456"
 */
export function formatDNI(dni: string): string {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Capitaliza la primera letra de un string.
 * Ej: "hola" → "Hola"
 */
export function capitalizar(texto: string): string {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

/**
 * Retorna el nombre completo en formato "Apellido, Nombre".
 */
export function nombreCompleto(nombre: string, apellido: string): string {
  return `${capitalizar(apellido)}, ${capitalizar(nombre)}`
}

/**
 * Trunca un texto largo con puntos suspensivos.
 * Ej: truncar("Hola mundo cruel", 8) → "Hola mun..."
 */
export function truncar(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto
  return `${texto.slice(0, maxLength)}...`
}

/**
 * Redondea a 2 decimales para evitar errores de punto flotante en cálculos financieros.
 */
export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
