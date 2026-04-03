import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { LoginBackground } from '@/components/auth/LoginBackground'

export const metadata: Metadata = { title: 'Iniciar sesión — CreditOS' }

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">

      {/* Video de fondo */}
      <div className="absolute inset-0 z-0">
        <LoginBackground />
      </div>

      {/* Overlay oscuro sobre el video */}
      <div className="absolute inset-0 z-10" style={{
        background: 'linear-gradient(135deg, rgba(2,6,23,0.75) 0%, rgba(15,23,42,0.55) 50%, rgba(23,37,84,0.75) 100%)'
      }} />

      {/* FMCODE — texto vertical derecha */}
      <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-6 pointer-events-none select-none">
        <span style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: 'clamp(40px, 7vw, 80px)',
          fontFamily: '"Arial Black", "Impact", sans-serif',
          fontWeight: 900,
          letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.08)',
          animation: 'fmcode-pulse 4s ease-in-out infinite',
        }}>
          FMCODE
        </span>
      </div>

      {/* Card de login — centro */}
      <div className="relative z-20 w-full max-w-md px-4">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(8, 14, 36, 0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">CreditOS</p>
              <p className="text-slate-400 text-xs mt-0.5">Gestión de Créditos</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Bienvenido</h1>
          <p className="text-slate-400 text-sm mb-8">Ingresá con tu cuenta para continuar</p>

          <LoginForm />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Desarrollado por <span className="text-white/50 font-medium">FMCODE</span>
        </p>
      </div>

      <style>{`
        @keyframes fmcode-pulse {
          0%, 100% { opacity: 1; transform: translateY(0px); }
          50% { opacity: 0.4; transform: translateY(-14px); }
        }
      `}</style>
    </div>
  )
}
