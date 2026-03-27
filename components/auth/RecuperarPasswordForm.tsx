'use client'

// Formulario para solicitar recuperación de contraseña.
// Envía un email con link de reseteo via Supabase Auth.

import { useState, useTransition } from 'react'
import { recuperarPasswordAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export function RecuperarPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await recuperarPasswordAction(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
          Email de tu cuenta
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          disabled={isPending || !!success}
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {!success && (
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar instrucciones'
          )}
        </Button>
      )}
    </form>
  )
}
