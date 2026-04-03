// Todos los estados y tipos del sistema en un solo lugar.
// Usar siempre estos enums en lugar de strings literales para evitar errores tipográficos.

export enum RolUsuario {
  ADMIN = 'admin',
  OPERADOR = 'operador',
  COBRADOR = 'cobrador',
  AUDITOR = 'auditor',
}

export enum EstadoCliente {
  ACTIVO = 'activo',
  MOROSO = 'moroso',
  INHABILITADO = 'inhabilitado',
  BAJA = 'baja',
}

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado',
}

export enum EstadoCredito {
  ACTIVO = 'activo',
  CANCELADO = 'cancelado',
  EN_MORA = 'en_mora',
  REFINANCIADO = 'refinanciado',
  INCOBRABLE = 'incobrable',
}

export enum EstadoCuota {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  VENCIDA = 'vencida',
  PARCIAL = 'parcial',
}

export enum SistemaAmortizacion {
  FRANCES = 'frances',
  ALEMAN = 'aleman',
  DIRECTO = 'directo',
}

export enum MedioPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  CHEQUE = 'cheque',
  DEBITO = 'debito',
  OTRO = 'otro',
}

export enum TipoGestion {
  LLAMADO = 'llamado',
  VISITA = 'visita',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  CARTA = 'carta',
}

export enum TipoDocumento {
  DNI_FRENTE = 'dni_frente',
  DNI_DORSO = 'dni_dorso',
  RECIBO_SUELDO = 'recibo_sueldo',
  CONTRATO = 'contrato',
  RECIBO_PAGO = 'recibo_pago',
  OTRO = 'otro',
}

export enum TipoCaja {
  INGRESO = 'ingreso',
  EGRESO = 'egreso',
}

export enum EstadoFirma {
  PENDIENTE = 'pendiente',
  FIRMADO = 'firmado',
  RECHAZADO = 'rechazado',
  VENCIDO = 'vencido',
}

export enum PlanEmpresa {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
