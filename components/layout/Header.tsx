'use client'

// Header principal del dashboard.
// Muestra: búsqueda global, toggle de tema, notificaciones y menú de usuario.
// El logout usa un Server Action para limpiar la sesión correctamente en el servidor.

import { useTransition } from 'react'
import { Bell, Search, Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logoutAction } from '@/lib/actions/auth'

// Mapa de roles a texto legible en español
const rolesDisplay: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  cobrador: 'Cobrador',
  auditor: 'Auditor',
}

interface HeaderProps {
  usuario?: {
    nombre: string
    apellido: string
    rol: string
    email: string
  }
}

export function Header({ usuario }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  // Iniciales para el avatar
  const iniciales = usuario
    ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
    : 'US'

  const nombreCompleto = usuario
    ? `${usuario.nombre} ${usuario.apellido}`
    : 'Usuario'

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-6 shrink-0">
      {/* Búsqueda global — funcionalidad completa en fase futura */}
      <div className="flex items-center gap-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-64 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        <Search className="w-4 h-4 shrink-0" />
        <span className="text-sm">Buscar cliente, crédito...</span>
        <kbd className="ml-auto text-xs bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 hidden sm:block">
          ⌘K
        </kbd>
      </div>

      {/* Acciones del header */}
      <div className="flex items-center gap-1">
        {/* Toggle de tema claro/oscuro */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          aria-label="Cambiar tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Campana de notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Menú desplegable del usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-auto py-1.5 px-2 ml-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              disabled={isPending}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">
                  {nombreCompleto}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {rolesDisplay[usuario?.rol ?? ''] ?? usuario?.rol}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{nombreCompleto}</p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {usuario?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/perfil" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Mi perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="text-red-600 focus:text-red-600 dark:text-red-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
