import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Auditoría' }

export default function AuditoriaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoría</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Registro de todas las acciones del sistema</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <p className="text-slate-400 text-sm">Módulo de Auditoría — se implementa en la Fase 11.</p>
      </div>
    </div>
  )
}
