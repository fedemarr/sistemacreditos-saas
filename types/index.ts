// Tipos principales del dominio. Se importan desde '@/types' en toda la app.
// Están separados de database.types.ts para poder usarlos con o sin Supabase.

import {
  RolUsuario,
  EstadoCliente,
  EstadoSolicitud,
  EstadoCredito,
  EstadoCuota,
  SistemaAmortizacion,
  MedioPago,
  TipoGestion,
  TipoCaja,
  EstadoFirma,
  PlanEmpresa,
} from './enums'

// Re-exportar enums para poder importarlos desde '@/types'
export * from './enums'

// ─── EMPRESA / TENANT ─────────────────────────────────────────────────────────
export interface Empresa {
  id: string
  nombre: string
  cuit: string
  logo_url: string | null
  tasa_default: number
  punitorio_diario_default: number
  dias_gracia: number
  sistema_amortizacion_default: SistemaAmortizacion
  moneda: string
  telefono: string | null
  email: string | null
  domicilio: string | null
  plan: PlanEmpresa
  activa: boolean
  created_at: string
}

// ─── USUARIO / PERFIL ─────────────────────────────────────────────────────────
export interface PerfilUsuario {
  id: string
  usuario_id: string
  empresa_id: string
  nombre: string
  apellido: string
  rol: RolUsuario
  telefono: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

// ─── CLIENTE ──────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string
  empresa_id: string
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string | null
  domicilio: string
  localidad: string
  provincia: string
  fecha_nacimiento: string
  ingresos_mensuales: number
  empleador: string | null
  referencia_nombre: string | null
  referencia_telefono: string | null
  score_interno: number
  estado: EstadoCliente
  observaciones: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// ─── SOLICITUD DE CRÉDITO ─────────────────────────────────────────────────────
export interface SolicitudCredito {
  id: string
  empresa_id: string
  cliente_id: string
  cliente?: Cliente
  monto_solicitado: number
  cantidad_cuotas: number
  tasa_anual: number
  sistema_amortizacion: SistemaAmortizacion
  motivo: string | null
  estado: EstadoSolicitud
  motivo_rechazo: string | null
  revisado_por: string | null
  fecha_solicitud: string
  fecha_resolucion: string | null
  observaciones: string | null
  created_by: string
  created_at: string
}

// ─── CRÉDITO ──────────────────────────────────────────────────────────────────
export interface Credito {
  id: string
  empresa_id: string
  solicitud_id: string | null
  cliente_id: string
  cliente?: Cliente
  monto_otorgado: number
  tasa_anual: number
  cantidad_cuotas: number
  sistema_amortizacion: SistemaAmortizacion
  fecha_otorgamiento: string
  fecha_primer_vencimiento: string
  monto_total_financiado: number
  estado: EstadoCredito
  created_by: string
  created_at: string
  updated_at: string
  cuotas?: Cuota[]
}

// ─── CUOTA ────────────────────────────────────────────────────────────────────
export interface Cuota {
  id: string
  credito_id: string
  numero_cuota: number
  fecha_vencimiento: string
  capital: number
  interes: number
  punitorio: number
  total: number
  saldo_pendiente: number
  estado: EstadoCuota
  updated_at: string
}

// ─── PAGO ─────────────────────────────────────────────────────────────────────
export interface Pago {
  id: string
  cuota_id: string
  credito_id: string
  cliente_id: string
  fecha_pago: string
  monto_pagado: number
  medio_pago: MedioPago
  registrado_por: string
  observaciones: string | null
  created_at: string
  cuota?: Cuota
  cliente?: Cliente
}

// ─── GESTIÓN DE COBRANZA ──────────────────────────────────────────────────────
export interface GestionCobranza {
  id: string
  empresa_id: string
  credito_id: string
  cliente_id: string
  tipo_gestion: TipoGestion
  resultado: string
  promesa_fecha: string | null
  promesa_monto: number | null
  gestionado_por: string
  created_at: string
  cliente?: Cliente
  credito?: Credito
}

// ─── CAJA ─────────────────────────────────────────────────────────────────────
export interface MovimientoCaja {
  id: string
  empresa_id: string
  fecha: string
  tipo: TipoCaja
  monto: number
  concepto: string
  referencia_id: string | null
  referencia_tipo: string | null
  registrado_por: string
  created_at: string
}

// ─── FIRMA DIGITAL ────────────────────────────────────────────────────────────
export interface FirmaDigital {
  id: string
  empresa_id: string
  entidad_tipo: 'credito' | 'solicitud'
  entidad_id: string
  zapsign_doc_token: string
  estado: EstadoFirma
  url_documento: string | null
  firmado_por_nombre: string | null
  firmado_por_email: string | null
  fecha_firma: string | null
  created_at: string
}

// ─── AUDITORÍA ────────────────────────────────────────────────────────────────
export interface AuditoriaLog {
  id: string
  empresa_id: string
  usuario_id: string
  accion: string
  entidad_tipo: string
  entidad_id: string
  datos_anteriores: Record<string, unknown> | null
  datos_nuevos: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

// ─── DASHBOARD MÉTRICAS ───────────────────────────────────────────────────────
export interface DashboardMetricas {
  creditos_activos: number
  cuotas_vencidas: number
  cobranza_hoy: number
  clientes_morosos: number
  cartera_total: number
  tasa_mora: number
  cobranza_mes: number
}

// ─── PLAN DE PAGOS (para mostrar en UI antes de guardar) ──────────────────────
export interface CuotaCalculada {
  numero_cuota: number
  fecha_vencimiento: string
  capital: number
  interes: number
  total: number
  saldo_restante: number
}

// ─── RESULTADO DE OPERACIONES ─────────────────────────────────────────────────
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
