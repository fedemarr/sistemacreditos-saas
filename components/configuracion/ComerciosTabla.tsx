'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pencil, Plus, Phone, Mail } from 'lucide-react'

interface Comercio {
  id: string
  codigo: string
  nombre: string
  localidad?: string
  provincia?: string
  telefono?: string
  email?: string
  activo: boolean
}

export function ComerciosTabla({ comercios }: { comercios: Comercio[] }) {
  const router = useRouter()

  if (comercios.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <p className="text-slate-400 text-sm mb-4">No hay comercios registrados</p>
        <Button onClick={() => router.push('/configuracion/comercios/nuevo')} className="gap-2">
          <Plus className="w-4 h-4" /> Registrar primer comercio
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
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Localidad</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Contacto</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {comercios.map(c => (
            <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{c.codigo}</td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.nombre}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {[c.localidad, c.provincia].filter(Boolean).join(', ') || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  {c.telefono && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.telefono}
                    </span>
                  )}
                  {c.email && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {c.email}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.activo
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/configuracion/comercios/${c.id}`)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
