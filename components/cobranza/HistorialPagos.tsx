'use client'

import { useState } from 'react'
import { AnularPago } from './AnularPago'
import { Button } from '@/components/ui/button'
import { formatMoneda, formatFecha } from '@/lib/utils/formatters'
import { XCircle, Receipt } from 'lucide-react'

interface Pago {
  id: string
  fecha_pago: string
  monto_pagado: number
  medio_pago: string
  tipo_pago: string
  punitorio_cobrado: number
  anulado: boolean
  observaciones: string | null
  imputaciones_pago: { cuota_id: string; monto_total: number; tipo: string; cuotas: { numero_cuota: number } | null }[]
}

const tiposPago: Record<string, string> = {
  normal: 'Normal', parcial: 'Parcial',
  cancelacion_anticipada: 'Cancelación anticip.',
  cancelacion_deuda: 'Cancelación deuda',
  recupero_mora: 'Recupero mora',
}

const mediosLabel: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  cheque: 'Cheque', debito: 'Débito',
  retencion_haberes: 'Ret. haberes', otro: 'Otro',
}

export function HistorialPagos({ pagos, esAdmin }: { pagos: Pago[]; esAdmin: boolean }) {
  const [pagoAAnular, setPagoAAnular] = useState<Pago | null>(null)

  if (!pagos.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-8 text-center">
        <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No hay pagos registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cuota</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Monto</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Punitorio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Medio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
              {esAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {pagos.map(pago => {
              const cuotaNro = pago.imputaciones_pago?.[0]?.cuotas?.numero_cuota
              return (
                <tr key={pago.id} className={`border-t border-slate-100 dark:border-slate-800 ${pago.anulado ? 'opacity-50 bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">{formatFecha(pago.fecha_pago)}</td>
                  <td className="px-4 py-3 text-slate-500">{cuotaNro ? `#${cuotaNro}` : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoneda(pago.monto_pagado)}
                    {pago.anulado && <span className="ml-1 text-xs text-red-500">(anulado)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pago.punitorio_cobrado > 0 ? <span className="text-red-500">{formatMoneda(pago.punitorio_cobrado)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{mediosLabel[pago.medio_pago] ?? pago.medio_pago}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tiposPago[pago.tipo_pago] ?? pago.tipo_pago}</td>
                  <td className="px-4 py-3">
                    {pago.anulado
                      ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Anulado</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Válido</span>
                    }
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!pago.anulado && (
                        <Button variant="ghost" size="sm" onClick={() => setPagoAAnular(pago)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
            <tr>
              <td colSpan={2} className="px-4 py-3 font-semibold">TOTAL COBRADO</td>
              <td className="px-4 py-3 text-right font-bold">
                {formatMoneda(pagos.filter(p => !p.anulado).reduce((a, p) => a + p.monto_pagado, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-red-500">
                {formatMoneda(pagos.filter(p => !p.anulado).reduce((a, p) => a + p.punitorio_cobrado, 0))}
              </td>
              <td colSpan={esAdmin ? 4 : 3} />
            </tr>
          </tfoot>
        </table>
      </div>
      {pagoAAnular && (
        <AnularPago open={!!pagoAAnular} onClose={() => setPagoAAnular(null)} pago={pagoAAnular} />
      )}
    </>
  )
}
