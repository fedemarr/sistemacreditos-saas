// Función utilitaria requerida por todos los componentes de shadcn/ui.
// Combina clsx (clases condicionales) con tailwind-merge (evita conflictos de clases Tailwind).

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
