import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi Perfil' }

export default function PerfilPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Administrá tu cuenta y preferencias</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-12 text-center">
        <p className="text-slate-400 text-sm">Perfil de usuario — se implementa en la Fase 4.</p>
      </div>
    </div>
  )
}
