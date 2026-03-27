import { Metadata } from 'next'
import { RecuperarPasswordForm } from '@/components/auth/RecuperarPasswordForm'
import { CreditCard, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
}

export default function RecuperarPasswordPage() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Recuperar contraseña</h1>
        <p className="text-slate-400 text-sm mt-1">
          Te enviamos un email con las instrucciones
        </p>
      </div>

      <RecuperarPasswordForm />

      <a
        href="/login"
        className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-sm mt-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al login
      </a>
    </div>
  )
}
