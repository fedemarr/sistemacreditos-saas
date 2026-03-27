'use client'

import { useRouter } from 'next/navigation'
import { togglePlanAction } from '@/lib/actions/planes'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatPorcentaje } from '@/lib/utils/formatters'
import { Pencil, ToggleLeft, ToggleRight, Plus } from 'lucide-react'
import { useTransition } from 'react'

interface Plan {
  id: string
  codigo: string
  descripcion: string
  cantidad_cuotas: number
  tasa_anual: number
  sistema_amortizacion: string
  cuota_retenida: boolean
  es_plan_dni: boolean
  activo: boolean
}

export function PlanesTabla({ planes }: { planes: Plan[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      const result = await togglePlanAction(id, !activo)
      if (result?.error) toast.error(result.error)
      else toast.success(activo ? 'Plan desactivado' : 'Plan activado')
    })
  }

  if (planes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <p className="text-slate-400 text-sm mb-4">No hay planes configurados</p>
        <Button onClick={() => router.push('/configuracion/planes/nuevo')} className="gap-2">
          <Plus className="w-4 h-4" /> Crear primer plan
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Código</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Descripción</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuotas</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tasa anual</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Sistema</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Flags</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {planes.map(plan => (
            <tr key={plan.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                {plan.codigo}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {plan.descripcion}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {plan.cantidad_cuotas}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {formatPorcentaje(plan.tasa_anual)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">
                {plan.sistema_amortizacion}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {plan.cuota_retenida && (
                    <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">
                      Retenida
                    </span>
                  )}
                  {plan.es_plan_dni && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                      DNI
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  plan.activo
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/configuracion/planes/${plan.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggle(plan.id, plan.activo)}
                    className={plan.activo ? 'text-slate-500' : 'text-green-600'}
                  >
                    {plan.activo
                      ? <ToggleRight className="w-4 h-4" />
                      : <ToggleLeft className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
