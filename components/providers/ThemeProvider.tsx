'use client'

// Wrapper del proveedor de next-themes.
// Se coloca en el root layout para que toda la app tenga acceso al tema.

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
