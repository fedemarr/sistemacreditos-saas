'use client'

// Hook para verificar permisos del usuario logueado en componentes cliente.
// Usa useAuth internamente y expone el objeto de permisos completo.

import { useAuth } from './useAuth'
import { getPermisos } from '@/lib/utils/permissions'
import { RolUsuario } from '@/types/enums'

export function usePermisos() {
  const { perfil, loading } = useAuth()

  // Si no hay perfil o está cargando, retornar permisos vacíos
  if (loading || !perfil) {
    return {
      loading: true,
      rol: null,
      permisos: {
        aprobarSolicitudes: false,
        crearSolicitudes: false,
        verReportes: false,
        registrarPagos: false,
        editarClientes: false,
        verConfiguracion: false,
        eliminar: false,
        verAuditoria: false,
        gestionarUsuarios: false,
        registrarGestiones: false,
        verCaja: false,
        exportar: false,
        enviarWhatsapp: false,
        firmarDocumentos: false,
      },
    }
  }

  return {
    loading: false,
    rol: perfil.rol as RolUsuario,
    permisos: getPermisos(perfil.rol as RolUsuario),
  }
}
