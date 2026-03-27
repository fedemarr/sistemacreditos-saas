'use client'

// Formulario de login con validación y manejo de errores.
// Usa Server Action para que las credenciales nunca pasen por el cliente.

import { useState, useTransition } from 'react'
import { loginAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
          disabled={isPending}
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-slate-300 text-sm font-medium"
        >
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isPending}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Botón submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Ingresando...
          </>
        ) : (
          'Ingresar'
        )}
      </Button>
    </form>
  )
}
