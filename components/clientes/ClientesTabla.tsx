'use client'

// Tabla de clientes con búsqueda en tiempo real, filtro por estado y paginación.
// Los datos vienen del servidor como prop inicial y se actualizan con búsqueda.

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientesAction } from '@/lib/actions/clientes'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoneda, formatFecha, formatDNI } from '@/lib/utils/formatters'
import { Search, Plus, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Cliente } from '@/types'

interface ClientesTablaProps {
  clientesIniciales: Cliente[]
  totalInicial: number
}

const POR_PAGINA = 20

export function ClientesTabla({ clientesIniciales, totalInicial }: ClientesTablaProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales)
  const [total, setTotal] = useState(totalInicial)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [pagina, setPagina] = useState(1)

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  // Buscar clientes con debounce manual
  const buscar = useCallback((nuevaBusqueda: string, nuevoEstado: string, nuevaPagina: number) => {
    startTransition(async () => {
      const result = await obtenerClientesAction({
        busqueda: nuevaBusqueda,
        estado: nuevoEstado || undefined,
        pagina: nuevaPagina,
        porPagina: POR_PAGINA,
      })
      setClientes(result.data as Cliente[])
      setTotal(result.total)
    })
  }, [])

  function handleBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
    buscar(valor, estadoFiltro, 1)
  }

  function handleEstado(valor: string) {
    const estado = valor === 'todos' ? '' : valor
    setEstadoFiltro(estado)
    setPagina(1)
    buscar(busqueda, estado, 1)
  }

  function handlePagina(nueva: number) {
    setPagina(nueva)
    buscar(busqueda, estadoFiltro, nueva)
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, apellido o DNI..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por estado */}
          <Select onValueChange={handleEstado} defaultValue="todos">
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="pendiente_verificacion">Pendiente</SelectItem>
              <SelectItem value="moroso">Moroso</SelectItem>
              <SelectItem value="inhabilitado">Inhabilitado</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botón nuevo cliente */}
        <Button onClick={() => router.push('/clientes/nuevo')} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Contador de resultados */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {isPending ? 'Buscando...' : `${total} cliente${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
      </p>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Cliente</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Límite crédito</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              // Skeleton de carga
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <User className="w-8 h-8" />
                    <p className="text-sm">No hay clientes para mostrar</p>
                    {busqueda && (
                      <p className="text-xs">Intentá con otra búsqueda</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clientes.map(cliente => (
                <TableRow
                  key={cliente.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => router.push(`/clientes/${cliente.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {cliente.apellido}, {cliente.nombre}
                      </p>
                      {cliente.email && (
                        <p className="text-xs text-slate-400">{cliente.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    <span className="text-xs uppercase text-slate-400 mr-1">
                      {cliente.tipo_documento}
                    </span>
                    {formatDNI(cliente.numero_documento)}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {cliente.telefono}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {formatMoneda(cliente.ingreso_mensual)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {formatMoneda(cliente.limite_credito)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={cliente.estado} />
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {formatFecha(cliente.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePagina(pagina - 1)}
              disabled={pagina === 1 || isPending}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePagina(pagina + 1)}
              disabled={pagina === totalPaginas || isPending}
              className="gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
