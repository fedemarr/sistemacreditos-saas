'use client'

// Vista de detalle completa del cliente con tabs.
// Muestra: datos personales, laboral, créditos, trámites e historial.

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
  Phone, Mail, MapPin, ArrowLeft, Pencil,
  Calendar, DollarSign, Users,
} from 'lucide-react'

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
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {cliente.apellido?.charAt(0)}{cliente.nombre?.charAt(0)}
            </span>
          </div>

          {/* Info rápida */}
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

      {/* Tabs de información */}
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
            {/* Identificación */}
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

            {/* Contacto */}
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

            {/* Referencias */}
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

            {/* Datos familiares */}
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = `/clientes/${cliente.id}/editar`}
              >
                Agregar datos laborales
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB: Créditos */}
        <TabsContent value="creditos">
          {creditos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Este cliente no tiene créditos</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">N° Crédito</th>
                    <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Cuotas</th>
                    <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Otorgamiento</th>
                    <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {creditos.map((credito: any) => (
                    <tr
                      key={credito.id}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => window.location.href = `/creditos/${credito.id}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium">#{credito.numero_credito}</td>
                      <td className="px-4 py-3">{formatMoneda(credito.monto_otorgado)}</td>
                      <td className="px-4 py-3">{credito.cantidad_cuotas} cuotas</td>
                      <td className="px-4 py-3">{formatFecha(credito.fecha_otorgamiento)}</td>
                      <td className="px-4 py-3"><StatusBadge estado={credito.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                <div
                  key={tramite.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4"
                >
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
                    <span className="text-xs text-slate-400">
                      {formatFecha(tramite.created_at)}
                    </span>
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

// Componente auxiliar para mostrar fila de dato
function Fila({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-medium">{valor}</span>
    </div>
  )
}
