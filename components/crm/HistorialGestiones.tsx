'use client'

import { formatFecha, formatFechaHora, formatMoneda } from '@/lib/utils/formatters'
import { ClipboardList, Phone, MessageSquare, Mail, FileText, Home, Handshake } from 'lucide-react'

interface Gestion {
  id: string
  tipo: string
  resultado: string
  observaciones: string | null
  promesa_fecha: string | null
  promesa_monto: number | null
  created_at: string
  perfiles_usuario: { nombre: string; apellido: string } | null
}

const tipoIcono: Record<string, any> = {
  llamado: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  carta: FileText,
  visita: Home,
  convenio: Handshake,
  otro: ClipboardList,
}

const tipoLabel: Record<string, string> = {
  llamado: 'Llamado',
  whatsapp: 'WhatsApp',
  email: 'Email',
  carta: 'Carta',
  visita: 'Visita',
  convenio: 'Convenio',
  otro: 'Otro',
}

const resultadoLabel: Record<string, string> = {
  contactado: 'Contactado',
  sin_respuesta: 'Sin respuesta',
  numero_incorrecto: 'Número incorrecto',
  promesa_pago: 'Promesa de pago',
  rechazo: 'Rechazo',
  pago_recibido: 'Pago recibido',
  convenio_acordado: 'Convenio acordado',
  otro: 'Otro',
}

const resultadoColor: Record<string, string> = {
  contactado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sin_respuesta: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  numero_incorrecto: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  promesa_pago: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rechazo: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  pago_recibido: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  convenio_acordado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  otro: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function HistorialGestiones({ gestiones }: { gestiones: Gestion[] }) {
  if (!gestiones.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-8 text-center">
        <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Sin gestiones registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {gestiones.map(g => {
        const Icono = tipoIcono[g.tipo] ?? ClipboardList
        return (
          <div key={g.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
            <div className="flex items-start gap-3">
              {/* Icono del tipo */}
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <Icono className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tipoLabel[g.tipo] ?? g.tipo}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${resultadoColor[g.resultado] ?? resultadoColor.otro}`}>
                    {resultadoLabel[g.resultado] ?? g.resultado}
                  </span>
                </div>

                {g.observaciones && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{g.observaciones}</p>
                )}

                {/* Promesa de pago */}
                {g.resultado === 'promesa_pago' && g.promesa_fecha && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg px-3 py-2 text-sm mb-2">
                    <span className="text-blue-700 dark:text-blue-400 font-medium">
                      Prometió pagar el {formatFecha(g.promesa_fecha)}
                      {g.promesa_monto ? ` — ${formatMoneda(g.promesa_monto)}` : ''}
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  {formatFechaHora(g.created_at)}
                  {g.perfiles_usuario && ` · ${g.perfiles_usuario.nombre} ${g.perfiles_usuario.apellido}`}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
