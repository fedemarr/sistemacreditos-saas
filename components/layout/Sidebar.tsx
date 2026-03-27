'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, FileText, CreditCard, DollarSign,
  AlertTriangle, BarChart3, Settings, Shield, ChevronLeft,
  ChevronRight, ShieldCheck, Store, Wallet, ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navegacion = [
  {
    titulo: 'Principal',
    items: [{ nombre: 'Dashboard', href: '/', icono: LayoutDashboard }],
  },
  {
    titulo: 'Gestión',
    items: [
      { nombre: 'Clientes', href: '/clientes', icono: Users },
      { nombre: 'Autorizaciones', href: '/autorizaciones', icono: ShieldCheck },
      { nombre: 'Solicitudes', href: '/solicitudes', icono: FileText },
      { nombre: 'Créditos', href: '/creditos', icono: CreditCard },
    ],
  },
  {
    titulo: 'Cobranza',
    items: [
      { nombre: 'Cobrar', href: '/cobranza', icono: DollarSign },
      { nombre: 'Caja del día', href: '/caja', icono: Wallet },
      { nombre: 'Mora', href: '/mora', icono: AlertTriangle },
      { nombre: 'CRM', href: '/crm', icono: ClipboardList },
    ],
  },
  {
    titulo: 'Análisis',
    items: [
      { nombre: 'Reportes', href: '/reportes', icono: BarChart3 },
      { nombre: 'Auditoría', href: '/auditoria', icono: Shield },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { nombre: 'Comercios', href: '/configuracion/comercios', icono: Store },
      { nombre: 'Configuración', href: '/configuracion', icono: Settings },
    ],
  },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'relative flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 shrink-0',
      collapsed ? 'w-16' : 'w-64', className
    )}>
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-700/50', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-none">CreditOS</p>
            <p className="text-slate-400 text-xs mt-0.5">Gestión de Créditos</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navegacion.map((seccion) => (
          <div key={seccion.titulo} className="mb-6">
            {!collapsed && (
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                {seccion.titulo}
              </p>
            )}
            <ul className="space-y-1">
              {seccion.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                const Icono = item.icono
                return (
                  <li key={item.href}>
                    <Link href={item.href} title={collapsed ? item.nombre : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800',
                        collapsed && 'justify-center px-2'
                      )}>
                      <Icono className={cn('shrink-0 transition-transform group-hover:scale-105', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                      {!collapsed && <span className="font-medium">{item.nombre}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}
          className={cn('w-full text-slate-400 hover:text-white hover:bg-slate-800', collapsed ? 'px-0 justify-center' : 'justify-between')}>
          {!collapsed && <span className="text-xs">Colapsar menú</span>}
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  )
}
