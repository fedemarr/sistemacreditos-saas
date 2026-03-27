'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerCreditosAction } from '@/lib/actions/creditos'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { Search, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'

const POR_PAGINA = 20

export function CreditosTabla({
  creditosIniciales,
  totalInicial,
}: {
  creditosIniciales: any[]
  totalInicial: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [creditos, setCreditos] = useState(creditosIniciales)
  const [total, setTotal] = useState(totalInicial)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  const buscar = useCallback((b: string, estado: string, pag: number) => {
    startTransition(async () => {
      const r = await obtenerCreditosAction({ busqueda: b, estado: estado || undefined, pagina: pag })
      setCreditos(r.data)
      setTotal(r.total)
    })
  }, [])

  function handleBusqueda(v: string) { setBusqueda(v); setPagina(1); buscar(v, estadoFiltro, 1) }
  function handleEstado(v: string) { const e = v === 'todos' ? '' : v; setEstadoFiltro(e); setPagina(1); buscar(busqueda, e, 1) }
  function handlePagina(n: number) { setPagina(n); buscar(busqueda, estadoFiltro, n) }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por N° de crédito..."
            value={busqueda}
            onChange={e => handleBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={handleEstado} defaultValue="todos">
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="en_mora">En mora</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-slate-500">
        {isPending ? 'Buscando...' : `${total} crédito${total !== 1 ? 's' : ''}`}
      </p>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">N°</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Monto</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Total financiado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Otorgamiento</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}</tr>
              ))
            ) : creditos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <CreditCard className="w-8 h-8" />
                    <p className="text-sm">No hay créditos</p>
                  </div>
                </td>
              </tr>
            ) : (
              creditos.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/creditos/${c.id}`)}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    #{c.numero_credito}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {c.clientes?.apellido}, {c.clientes?.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.clientes?.tipo_documento?.toUpperCase()} {formatDNI(c.clientes?.numero_documento ?? '')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.planes_credito ? (
                      <div>
                        <p className="font-medium">{c.planes_credito.codigo}</p>
                        <p className="text-xs text-slate-400">{c.cantidad_cuotas} cuotas</p>
                      </div>
                    ) : `${c.cantidad_cuotas} cuotas`}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatMoneda(c.monto_otorgado)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatMoneda(c.monto_total_financiado)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge estado={c.estado} /></td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{formatFecha(c.fecha_otorgamiento)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePagina(pagina - 1)} disabled={pagina === 1 || isPending} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePagina(pagina + 1)} disabled={pagina === totalPaginas || isPending} className="gap-1">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
