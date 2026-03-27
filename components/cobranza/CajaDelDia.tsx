'use client'

import { useTransition } from 'react'
import { cerrarCajaAction } from '@/lib/actions/pagos'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatMoneda, formatFecha, formatFechaHora } from '@/lib/utils/formatters'
import { DollarSign, XCircle, TrendingUp, Lock, Receipt } from 'lucide-react'

interface CajaDelDiaProps {
  caja: {
    id: string; fecha: string; total_cobrado: number; total_anulado: number
    total_neto: number; total_punitorio: number; desglose_medios: Record<string, number>
    estado: string; cerrado_at: string | null
  }
  pagos: any[]
  esAdmin: boolean
}

const mediosLabel: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  cheque: 'Cheque', debito: 'Débito',
  retencion_haberes: 'Retención haberes', otro: 'Otro',
}

export function CajaDelDia({ caja, pagos, esAdmin }: CajaDelDiaProps) {
  const [isPending, startTransition] = useTransition()

  function handleCerrar() {
    startTransition(async () => {
      const result = await cerrarCajaAction(caja.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Caja cerrada correctamente')
    })
  }

  const medios = Object.entries(caja.desglose_medios ?? {}).filter(([, v]) => v > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Caja del {formatFecha(caja.fecha)}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {caja.estado === 'cerrado' && caja.cerrado_at ? `Cerrada el ${formatFechaHora(caja.cerrado_at)}` : 'En curso'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            caja.estado === 'abierto'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {caja.estado === 'abierto' ? '● Abierta' : '✓ Cerrada'}
          </span>
          {esAdmin && caja.estado === 'abierto' && (
            <ConfirmDialog
              trigger={<Button variant="outline" size="sm" className="gap-2"><Lock className="w-3.5 h-3.5" /> Cerrar caja</Button>}
              titulo="¿Cerrar la caja del día?"
              descripcion="Una vez cerrada, no se podrán registrar más pagos para este día."
              textoConfirmar="Cerrar caja"
              onConfirm={handleCerrar}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', valor: caja.total_cobrado, icono: DollarSign, color: 'text-green-500', vc: '' },
          { label: 'Anulaciones', valor: caja.total_anulado, icono: XCircle, color: 'text-red-500', vc: 'text-red-500' },
          { label: 'Total neto', valor: caja.total_neto, icono: TrendingUp, color: 'text-blue-500', vc: 'text-blue-600' },
          { label: 'Punitorios', valor: caja.total_punitorio, icono: DollarSign, color: 'text-amber-500', vc: 'text-amber-600' },
        ].map(({ label, valor, icono: Icono, color, vc }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icono className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${vc || 'text-slate-900 dark:text-white'}`}>{formatMoneda(valor)}</p>
          </div>
        ))}
      </div>

      {medios.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Desglose por medio de pago</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {medios.map(([medio, monto]) => (
              <div key={medio} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">{mediosLabel[medio] ?? medio}</span>
                <span className="font-semibold text-sm">{formatMoneda(monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Movimientos ({pagos.filter(p => !p.anulado).length})
          </h3>
        </div>
        {!pagos.length ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay movimientos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Crédito</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Monto</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Medio</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p: any) => (
                <tr key={p.id} className={`border-t border-slate-100 dark:border-slate-800 ${p.anulado ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-xs">{p.clientes?.apellido}, {p.clientes?.nombre}</p>
                    <p className="text-slate-400 text-xs">{p.clientes?.numero_documento}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">#{p.creditos?.numero_credito}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatMoneda(p.monto_pagado)}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{mediosLabel[p.medio_pago] ?? p.medio_pago}</td>
                  <td className="px-4 py-2.5">
                    {p.anulado
                      ? <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Anulado</span>
                      : <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Válido</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
