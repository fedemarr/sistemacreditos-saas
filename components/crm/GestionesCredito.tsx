'use client'

import { useState, useTransition } from 'react'
import { obtenerGestionesCreditoAction } from '@/lib/actions/crm'
import { RegistrarGestion } from './RegistrarGestion'
import { HistorialGestiones } from './HistorialGestiones'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'

interface GestionesCreditoProps {
  creditoId: string
  clienteId: string
  numeroCredito: number
  clienteNombre: string
  gestionesIniciales: any[]
}

export function GestionesCredito({
  creditoId, clienteId, numeroCredito, clienteNombre, gestionesIniciales,
}: GestionesCreditoProps) {
  const [gestiones, setGestiones] = useState(gestionesIniciales)
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGestionRegistrada() {
    setModalOpen(false)
    // Recargar gestiones
    startTransition(async () => {
      const result = await obtenerGestionesCreditoAction(creditoId)
      setGestiones(result.data as any)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{gestiones.length} gestión{gestiones.length !== 1 ? 'es' : ''}</p>
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Nueva gestión
        </Button>
      </div>

      <HistorialGestiones gestiones={gestiones as any} />

      <RegistrarGestion
        open={modalOpen}
        onClose={handleGestionRegistrada}
        creditoId={creditoId}
        clienteId={clienteId}
        numeroCredito={numeroCredito}
        clienteNombre={clienteNombre}
      />
    </div>
  )
}
