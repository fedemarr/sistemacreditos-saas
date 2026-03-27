// Lógica de permisos centralizada por rol.
// Usá estas funciones en componentes y Server Actions para mostrar/ocultar acciones.
// Si cambian los permisos de un rol, solo hay que editar este archivo.

import { RolUsuario } from '@/types/enums'

/** ¿Puede aprobar o rechazar solicitudes de crédito? */
export function puedeAprobarSolicitudes(rol: RolUsuario): boolean {
  return rol === RolUsuario.ADMIN
}

/** ¿Puede crear nuevas solicitudes de crédito? */
export function puedeCrearSolicitudes(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR].includes(rol)
}

/** ¿Puede ver reportes completos y financieros? */
export function puedeVerReportes(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.AUDITOR].includes(rol)
}

/** ¿Puede registrar pagos y cobros? */
export function puedeRegistrarPagos(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR, RolUsuario.COBRADOR].includes(rol)
}

/** ¿Puede crear o editar clientes? */
export function puedeEditarClientes(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR].includes(rol)
}

/** ¿Puede acceder a la configuración del sistema? */
export function puedeVerConfiguracion(rol: RolUsuario): boolean {
  return rol === RolUsuario.ADMIN
}

/** ¿Puede eliminar registros? */
export function puedeEliminar(rol: RolUsuario): boolean {
  return rol === RolUsuario.ADMIN
}

/** ¿Puede ver el log de auditoría? */
export function puedeVerAuditoria(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.AUDITOR].includes(rol)
}

/** ¿Puede gestionar usuarios del sistema? */
export function puedeGestionarUsuarios(rol: RolUsuario): boolean {
  return rol === RolUsuario.ADMIN
}

/** ¿Puede registrar gestiones de cobranza? */
export function puedeRegistrarGestiones(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR, RolUsuario.COBRADOR].includes(rol)
}

/** ¿Puede ver datos de caja? */
export function puedeVerCaja(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR].includes(rol)
}

/** ¿Puede exportar datos a Excel? */
export function puedeExportar(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.AUDITOR].includes(rol)
}

/** ¿Puede enviar mensajes de WhatsApp? */
export function puedeEnviarWhatsapp(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR, RolUsuario.COBRADOR].includes(rol)
}

/** ¿Puede gestionar firmas digitales? */
export function puedeFirmarDocumentos(rol: RolUsuario): boolean {
  return [RolUsuario.ADMIN, RolUsuario.OPERADOR].includes(rol)
}

/**
 * Retorna el listado de permisos de un rol como objeto.
 * Útil para pasar a componentes que necesitan múltiples permisos.
 */
export function getPermisos(rol: RolUsuario) {
  return {
    aprobarSolicitudes: puedeAprobarSolicitudes(rol),
    crearSolicitudes: puedeCrearSolicitudes(rol),
    verReportes: puedeVerReportes(rol),
    registrarPagos: puedeRegistrarPagos(rol),
    editarClientes: puedeEditarClientes(rol),
    verConfiguracion: puedeVerConfiguracion(rol),
    eliminar: puedeEliminar(rol),
    verAuditoria: puedeVerAuditoria(rol),
    gestionarUsuarios: puedeGestionarUsuarios(rol),
    registrarGestiones: puedeRegistrarGestiones(rol),
    verCaja: puedeVerCaja(rol),
    exportar: puedeExportar(rol),
    enviarWhatsapp: puedeEnviarWhatsapp(rol),
    firmarDocumentos: puedeFirmarDocumentos(rol),
  }
}
