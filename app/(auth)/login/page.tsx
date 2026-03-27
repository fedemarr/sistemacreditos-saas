import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      {/* Logo y título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">CreditOS</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ingresá a tu cuenta para continuar
        </p>
      </div>

      {/* Formulario */}
      <LoginForm />

      {/* Link recuperar contraseña */}
      <p className="text-center text-slate-500 text-xs mt-6">
        ¿Problemas para ingresar?{' '}
        <a
          href="/recuperar-password"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Recuperar contraseña
        </a>
      </p>
    </div>
  )
}
