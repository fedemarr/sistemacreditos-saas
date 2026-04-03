'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  formatMoneda, formatFecha, formatDNI, nombreCompleto,
} from '@/lib/utils/formatters'
import {
  User, Briefcase, CreditCard, ClipboardList,
  Phone, MapPin, ArrowLeft, Pencil,
  Users, ChevronDown, ChevronUp, DollarSign,
  AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClienteDetalleProps {
  cliente: Record<string, any>
  laboral: Record<string, any> | null
  referencias: Record<string, any>[]
  familiar: Record<string, any> | null
  tramites: Record<string, any>[]
  creditos: Record<string, any>[]
}

export function ClienteDetalle({
  cliente, laboral, referencias, familiar, tramites, creditos,
}: ClienteDetalleProps) {
  const router = useRouter()
  const nombrecompleto = nombreCompleto(cliente.nombre, cliente.apellido)

  return (
    <div>
      <PageHeader
        titulo={nombrecompleto}
        descripcion={`${cliente.tipo_documento?.toUpperCase()} ${formatDNI(cliente.numero_documento)}`}
        acciones={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/clientes')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
            <Button onClick={() => router.push(`/clientes/${cliente.id}/editar`)} className="gap-2">
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </div>
        }
      />

      {/* Card de resumen */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 mb-6">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {cliente.apellido?.charAt(0)}{cliente.nombre?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Estado</p>
              <StatusBadge estado={cliente.estado} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Categoría</p>
              <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase">
                {cliente.categoria ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Límite de crédito</p>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatMoneda(cliente.limite_credito ?? 0)}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Ingreso mensual</p>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatMoneda(cliente.ingreso_mensual ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList className="mb-6">
          <TabsTrigger value="datos" className="gap-2">
            <User className="w-4 h-4" /> Datos personales
          </TabsTrigger>
          <TabsTrigger value="laboral" className="gap-2">
            <Briefcase className="w-4 h-4" /> Laboral
          </TabsTrigger>
          <TabsTrigger value="creditos" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Créditos {creditos.length > 0 && `(${creditos.length})`}
          </TabsTrigger>
          <TabsTrigger value="tramites" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Trámites {tramites.length > 0 && `(${tramites.length})`}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Datos personales */}
        <TabsContent value="datos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Identificación
              </h3>
              <div className="space-y-3">
                <Fila label="Nombre completo" valor={nombrecompleto} />
                <Fila label="Documento" valor={`${cliente.tipo_documento?.toUpperCase()} ${formatDNI(cliente.numero_documento)}`} />
                <Fila label="CUIL" valor={cliente.cuil} />
                <Fila label="Fecha de nacimiento" valor={cliente.fecha_nacimiento ? formatFecha(cliente.fecha_nacimiento) : null} />
                <Fila label="Nacionalidad" valor={cliente.nacionalidad} />
                <Fila label="Estado civil" valor={cliente.estado_civil} />
                <Fila label="Sexo" valor={cliente.sexo} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contacto y domicilio
              </h3>
              <div className="space-y-3">
                <Fila label="Teléfono" valor={cliente.telefono} />
                <Fila label="Tel. referencia" valor={cliente.telefono_referencia} />
                <Fila label="Email" valor={cliente.email} />
                <Fila
                  label="Domicilio"
                  valor={[
                    cliente.domicilio_calle,
                    cliente.domicilio_nro,
                    cliente.domicilio_barrio,
                    cliente.domicilio_localidad,
                    cliente.domicilio_provincia,
                  ].filter(Boolean).join(', ')}
                />
                <Fila label="CP" valor={cliente.domicilio_codigo_postal} />
              </div>
            </div>

            {referencias.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Referencias personales
                </h3>
                <div className="space-y-4">
                  {referencias.map((ref: any) => (
                    <div key={ref.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{ref.nombre}</p>
                      <p className="text-xs text-slate-500">{ref.relacion} · {ref.telefono}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {familiar && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Datos familiares
                </h3>
                <div className="space-y-3">
                  <Fila label="Padre" valor={familiar.nombre_padre} />
                  <Fila label="Madre" valor={familiar.nombre_madre} />
                  <Fila label="Cónyuge" valor={familiar.conyuge_nombre ? `${familiar.conyuge_nombre} ${familiar.conyuge_apellido ?? ''}` : null} />
                  <Fila label="Hijos" valor={familiar.cantidad_hijos?.toString()} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Laboral */}
        <TabsContent value="laboral">
          {laboral ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Empleador
                </h3>
                <div className="space-y-3">
                  <Fila label="Empleador" valor={laboral.empleador_nombre} />
                  <Fila label="CUIT" valor={laboral.empleador_cuit} />
                  <Fila label="Sección" valor={laboral.seccion} />
                  <Fila label="Tipo ocupación" valor={laboral.tipo_ocupacion} />
                  <Fila label="Legajo" valor={laboral.legajo_laboral} />
                  <Fila label="Fecha ingreso" valor={laboral.fecha_ingreso ? formatFecha(laboral.fecha_ingreso) : null} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Destino del empleo
                </h3>
                <div className="space-y-3">
                  <Fila label="Dirección" valor={[laboral.empleo_calle, laboral.empleo_nro].filter(Boolean).join(' ')} />
                  <Fila label="Localidad" valor={laboral.empleo_localidad} />
                  <Fila label="Provincia" valor={laboral.empleo_provincia} />
                  <Fila label="Teléfono" valor={laboral.empleo_telefono} />
                  <Fila label="Interno" valor={laboral.empleo_interno} />
                  <Fila label="Horario" valor={laboral.empleo_horario} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
              <p className="text-slate-400 text-sm">No hay datos laborales cargados</p>
              <Button variant="outline" className="mt-4"
                onClick={() => router.push(`/clientes/${cliente.id}/editar`)}>
                Agregar datos laborales
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB: Créditos — vista mejorada con cards expandibles */}
        <TabsContent value="creditos">
          <TabCreditos creditos={creditos} clienteId={cliente.id} />
        </TabsContent>

        {/* TAB: Trámites */}
        <TabsContent value="tramites">
          {tramites.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay trámites registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tramites.map((tramite: any) => (
                <div key={tramite.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge estado={tramite.estado} />
                        <span className="text-xs text-slate-500">{tramite.prioridad}</span>
                      </div>
                      {tramite.observacion_1 && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">{tramite.observacion_1}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatFecha(tramite.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── TAB CRÉDITOS ─────────────────────────────────────────────────────────────
function TabCreditos({ creditos, clienteId }: { creditos: any[]; clienteId: string }) {
  const router = useRouter()

  if (creditos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Este cliente no tiene créditos</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/solicitudes/nueva')}>
          Crear solicitud de crédito
        </Button>
      </div>
    )
  }

  // Separar activos/mora de cancelados
  const activos = creditos.filter(c => ['activo', 'en_mora'].includes(c.estado))
  const cerrados = creditos.filter(c => !['activo', 'en_mora'].includes(c.estado))

  return (
    <div className="space-y-4">
      {/* Resumen rápido si tiene más de 1 crédito */}
      {creditos.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{creditos.length}</p>
            <p className="text-xs text-slate-500">Total créditos</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{activos.length}</p>
            <p className="text-xs text-slate-500">Activos</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatMoneda(activos.reduce((a, c) => a + (c.monto_otorgado ?? 0), 0))}
            </p>
            <p className="text-xs text-slate-500">Capital activo</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{cerrados.length}</p>
            <p className="text-xs text-slate-500">Cancelados</p>
          </div>
        </div>
      )}

      {/* Créditos activos */}
      {activos.length > 0 && (
        <div className="space-y-3">
          {creditos.length > 1 && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activos</p>
          )}
          {activos.map(credito => (
            <CreditoCard key={credito.id} credito={credito} />
          ))}
        </div>
      )}

      {/* Créditos cerrados */}
      {cerrados.length > 0 && (
        <div className="space-y-3">
          {creditos.length > 1 && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">Histórico</p>
          )}
          {cerrados.map(credito => (
            <CreditoCard key={credito.id} credito={credito} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CARD DE CRÉDITO EXPANDIBLE ───────────────────────────────────────────────
function CreditoCard({ credito }: { credito: any }) {
  const router = useRouter()
  const [expandido, setExpandido] = useState(false)

  const cuotas = credito.cuotas ?? []
  const cuotasPagadas = cuotas.filter((c: any) => c.estado === 'pagada').length
  const cuotasVencidas = cuotas.filter((c: any) => c.estado === 'vencida').length
  const cuotasPendientes = cuotas.filter((c: any) => ['pendiente', 'parcial'].length)
  const progreso = cuotas.length > 0 ? Math.round((cuotasPagadas / cuotas.length) * 100) : 0

  // Próxima cuota a pagar
  const proximaCuota = cuotas.find((c: any) => c.estado !== 'pagada')

  const colorEstado = {
    activo: 'border-l-blue-500',
    en_mora: 'border-l-red-500',
    cancelado: 'border-l-green-500',
    incobrable: 'border-l-slate-400',
    refinanciado: 'border-l-amber-500',
  }[credito.estado] ?? 'border-l-slate-300'

  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 border-l-4 overflow-hidden',
      colorEstado
    )}>
      {/* Header del crédito — siempre visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">
                #{credito.numero_credito}
              </span>
              <StatusBadge estado={credito.estado} />
              {cuotasVencidas > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {cuotasVencidas} vencida{cuotasVencidas !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Capital</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatMoneda(credito.monto_otorgado)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total financiado</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatMoneda(credito.monto_total_financiado)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cuotas</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {cuotasPagadas}/{credito.cantidad_cuotas}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Otorgamiento</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatFecha(credito.fecha_otorgamiento)}</p>
              </div>
            </div>

            {/* Barra de progreso */}
            {cuotas.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{progreso}% pagado</span>
                  <span>{credito.cantidad_cuotas - cuotasPagadas} cuotas restantes</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      cuotasVencidas > 0 ? 'bg-red-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>
            )}

            {/* Próxima cuota */}
            {proximaCuota && credito.estado !== 'cancelado' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Próxima: cuota {proximaCuota.numero_cuota} — {formatFecha(proximaCuota.fecha_vencimiento)} — {formatMoneda(proximaCuota.saldo_pendiente ?? proximaCuota.total)}
                </span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="text-xs h-8"
              onClick={() => router.push(`/creditos/${credito.id}`)}>
              Ver detalle
            </Button>
            {cuotas.length > 0 && (
              <button
                onClick={() => setExpandido(!expandido)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {expandido
                  ? <ChevronUp className="w-4 h-4 text-slate-500" />
                  : <ChevronDown className="w-4 h-4 text-slate-500" />
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detalle expandible de cuotas */}
      {expandido && cuotas.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-500">N°</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500">Vencimiento</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-500">Total</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-500">Saldo</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cuota: any) => (
                  <tr key={cuota.id} className={cn(
                    'border-t border-slate-100 dark:border-slate-800',
                    cuota.estado === 'pagada' && 'opacity-50',
                    cuota.estado === 'vencida' && 'bg-red-50/40 dark:bg-red-950/10',
                  )}>
                    <td className="px-4 py-2 font-medium">{cuota.numero_cuota}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {formatFecha(cuota.fecha_vencimiento)}
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoneda(cuota.total ?? cuota.importe_total)}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {cuota.estado === 'pagada'
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                        : formatMoneda(cuota.saldo_pendiente)
                      }
                    </td>
                    <td className="px-4 py-2"><StatusBadge estado={cuota.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button size="sm" className="gap-2 text-xs bg-green-600 hover:bg-green-500"
              onClick={() => router.push(`/cobranza?credito_id=${credito.id}`)}>
              <DollarSign className="w-3.5 h-3.5" /> Ir a cobrar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente auxiliar
function Fila({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-medium">{valor}</span>
    </div>
  )
}
