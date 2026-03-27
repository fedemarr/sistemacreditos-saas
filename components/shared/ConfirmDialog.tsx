'use client'

// Modal de confirmación genérico.
// Usar antes de ejecutar acciones irreversibles como eliminar, rechazar o cancelar.
// Acepta título, descripción, texto del botón y la acción a ejecutar.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ReactNode } from 'react'

interface ConfirmDialogProps {
  trigger: ReactNode            // El botón que abre el modal
  titulo: string                // Título del modal
  descripcion: string           // Texto descriptivo de la acción
  textoCancelar?: string        // Texto del botón cancelar
  textoConfirmar?: string       // Texto del botón confirmar
  variante?: 'destructive' | 'default'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  titulo,
  descripcion,
  textoCancelar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  variante = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variante === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : ''
            }
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
