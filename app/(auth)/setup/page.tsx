import { Metadata } from 'next'
import { SetupForm } from '@/components/auth/SetupForm'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Configuración inicial',
}

export default function SetupPage() {
  // ID de la empresa demo creada en el SQL de la Fase 3
  // Cambialo por el ID real de tu empresa cuando corresponda
  const EMPRESA_ID_DEMO = 'a1b2c3d4-0000-0000-0000-000000000001'

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-600 mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Configuración inicial</h1>
        <p className="text-slate-400 text-sm mt-1">
          Creá el primer usuario administrador del sistema
        </p>
      </div>

      <SetupForm empresaId={EMPRESA_ID_DEMO} />

      <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <p className="text-amber-400 text-xs text-center">
          Esta página solo se usa una vez. Después de crear el admin,
          los usuarios se gestionan desde Configuración → Usuarios.
        </p>
      </div>
    </div>
  )
}
