// Este archivo se regenera automáticamente en la Fase 3 con el comando:
// npx supabase gen types typescript --project-id TU_PROJECT_ID > types/database.types.ts
//
// Por ahora es un placeholder para que el proyecto compile sin errores.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      perfiles_usuario: {
        Row: {
          id: string
          usuario_id: string
          empresa_id: string
          nombre: string
          apellido: string
          rol: string
          telefono: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          empresa_id: string
          nombre: string
          apellido: string
          rol: string
          telefono?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          empresa_id?: string
          nombre?: string
          apellido?: string
          rol?: string
          telefono?: string | null
          activo?: boolean
          updated_at?: string
        }
      }
      empresas: {
        Row: {
          id: string
          nombre: string
          cuit: string
          logo_url: string | null
          tasa_default: number
          punitorio_diario_default: number
          dias_gracia: number
          sistema_amortizacion_default: string
          moneda: string
          telefono: string | null
          email: string | null
          domicilio: string | null
          plan: string
          activa: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          cuit: string
          logo_url?: string | null
          tasa_default?: number
          punitorio_diario_default?: number
          dias_gracia?: number
          sistema_amortizacion_default?: string
          moneda?: string
          telefono?: string | null
          email?: string | null
          domicilio?: string | null
          plan?: string
          activa?: boolean
          created_at?: string
        }
        Update: {
          nombre?: string
          cuit?: string
          logo_url?: string | null
          tasa_default?: number
          punitorio_diario_default?: number
          dias_gracia?: number
          sistema_amortizacion_default?: string
          moneda?: string
          telefono?: string | null
          email?: string | null
          domicilio?: string | null
          plan?: string
          activa?: boolean
        }
      }
      clientes: {
        Row: {
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
          estado: string
          observaciones: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          apellido: string
          dni: string
          telefono: string
          email?: string | null
          domicilio: string
          localidad: string
          provincia: string
          fecha_nacimiento: string
          ingresos_mensuales: number
          empleador?: string | null
          referencia_nombre?: string | null
          referencia_telefono?: string | null
          score_interno?: number
          estado?: string
          observaciones?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre?: string
          apellido?: string
          dni?: string
          telefono?: string
          email?: string | null
          domicilio?: string
          localidad?: string
          provincia?: string
          fecha_nacimiento?: string
          ingresos_mensuales?: number
          empleador?: string | null
          referencia_nombre?: string | null
          referencia_telefono?: string | null
          score_interno?: number
          estado?: string
          observaciones?: string | null
          updated_at?: string
        }
      }
      solicitudes_credito: {
        Row: {
          id: string
          empresa_id: string
          cliente_id: string
          monto_solicitado: number
          cantidad_cuotas: number
          tasa_anual: number
          sistema_amortizacion: string
          motivo: string | null
          estado: string
          motivo_rechazo: string | null
          revisado_por: string | null
          fecha_solicitud: string
          fecha_resolucion: string | null
          observaciones: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          cliente_id: string
          monto_solicitado: number
          cantidad_cuotas: number
          tasa_anual: number
          sistema_amortizacion?: string
          motivo?: string | null
          estado?: string
          motivo_rechazo?: string | null
          revisado_por?: string | null
          fecha_solicitud?: string
          fecha_resolucion?: string | null
          observaciones?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          monto_solicitado?: number
          cantidad_cuotas?: number
          tasa_anual?: number
          sistema_amortizacion?: string
          motivo?: string | null
          estado?: string
          motivo_rechazo?: string | null
          revisado_por?: string | null
          fecha_resolucion?: string | null
          observaciones?: string | null
        }
      }
      creditos: {
        Row: {
          id: string
          empresa_id: string
          solicitud_id: string | null
          cliente_id: string
          monto_otorgado: number
          tasa_anual: number
          cantidad_cuotas: number
          sistema_amortizacion: string
          fecha_otorgamiento: string
          fecha_primer_vencimiento: string
          monto_total_financiado: number
          estado: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          solicitud_id?: string | null
          cliente_id: string
          monto_otorgado: number
          tasa_anual: number
          cantidad_cuotas: number
          sistema_amortizacion?: string
          fecha_otorgamiento: string
          fecha_primer_vencimiento: string
          monto_total_financiado: number
          estado?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          monto_otorgado?: number
          tasa_anual?: number
          cantidad_cuotas?: number
          sistema_amortizacion?: string
          fecha_otorgamiento?: string
          fecha_primer_vencimiento?: string
          monto_total_financiado?: number
          estado?: string
          updated_at?: string
        }
      }
      cuotas: {
        Row: {
          id: string
          credito_id: string
          numero_cuota: number
          fecha_vencimiento: string
          capital: number
          interes: number
          punitorio: number
          total: number
          saldo_pendiente: number
          estado: string
          updated_at: string
        }
        Insert: {
          id?: string
          credito_id: string
          numero_cuota: number
          fecha_vencimiento: string
          capital: number
          interes: number
          punitorio?: number
          total: number
          saldo_pendiente: number
          estado?: string
          updated_at?: string
        }
        Update: {
          punitorio?: number
          total?: number
          saldo_pendiente?: number
          estado?: string
          updated_at?: string
        }
      }
      pagos: {
        Row: {
          id: string
          cuota_id: string
          credito_id: string
          cliente_id: string
          fecha_pago: string
          monto_pagado: number
          medio_pago: string
          registrado_por: string
          observaciones: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cuota_id: string
          credito_id: string
          cliente_id: string
          fecha_pago: string
          monto_pagado: number
          medio_pago: string
          registrado_por: string
          observaciones?: string | null
          created_at?: string
        }
        Update: {
          observaciones?: string | null
        }
      }
      gestiones_cobranza: {
        Row: {
          id: string
          empresa_id: string
          credito_id: string
          cliente_id: string
          tipo_gestion: string
          resultado: string
          promesa_fecha: string | null
          promesa_monto: number | null
          gestionado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          credito_id: string
          cliente_id: string
          tipo_gestion: string
          resultado: string
          promesa_fecha?: string | null
          promesa_monto?: number | null
          gestionado_por: string
          created_at?: string
        }
        Update: {
          resultado?: string
          promesa_fecha?: string | null
          promesa_monto?: number | null
        }
      }
      caja: {
        Row: {
          id: string
          empresa_id: string
          fecha: string
          tipo: string
          monto: number
          concepto: string
          referencia_id: string | null
          referencia_tipo: string | null
          registrado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          fecha: string
          tipo: string
          monto: number
          concepto: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          registrado_por: string
          created_at?: string
        }
        Update: {
          concepto?: string
        }
      }
      documentos: {
        Row: {
          id: string
          empresa_id: string
          entidad_tipo: string
          entidad_id: string
          nombre_archivo: string
          url_storage: string
          tipo_documento: string
          subido_por: string
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          entidad_tipo: string
          entidad_id: string
          nombre_archivo: string
          url_storage: string
          tipo_documento: string
          subido_por: string
          created_at?: string
        }
        Update: {
          nombre_archivo?: string
        }
      }
      firmas_digitales: {
        Row: {
          id: string
          empresa_id: string
          entidad_tipo: string
          entidad_id: string
          zapsign_doc_token: string
          estado: string
          url_documento: string | null
          firmado_por_nombre: string | null
          firmado_por_email: string | null
          fecha_firma: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          entidad_tipo: string
          entidad_id: string
          zapsign_doc_token: string
          estado?: string
          url_documento?: string | null
          firmado_por_nombre?: string | null
          firmado_por_email?: string | null
          fecha_firma?: string | null
          created_at?: string
        }
        Update: {
          estado?: string
          url_documento?: string | null
          firmado_por_nombre?: string | null
          firmado_por_email?: string | null
          fecha_firma?: string | null
        }
      }
      auditoria_logs: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string
          accion: string
          entidad_tipo: string
          entidad_id: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id: string
          accion: string
          entidad_tipo: string
          entidad_id: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          ip?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      rol_usuario: 'admin' | 'operador' | 'cobrador' | 'auditor'
      estado_cliente: 'activo' | 'moroso' | 'inhabilitado' | 'baja'
      estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado'
      estado_credito: 'activo' | 'cancelado' | 'en_mora' | 'refinanciado' | 'incobrable'
      estado_cuota: 'pendiente' | 'pagada' | 'vencida' | 'parcial'
      sistema_amortizacion: 'frances' | 'aleman'
      medio_pago: 'efectivo' | 'transferencia' | 'cheque' | 'debito' | 'otro'
    }
  }
}
