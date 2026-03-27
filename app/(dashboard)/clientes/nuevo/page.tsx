import { Metadata } from 'next'
import { ClienteWizard } from '@/components/clientes/ClienteWizard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nuevo Cliente' }

export default function NuevoClientePage() {
  return (
    <div>
      <PageHeader
        titulo="Nuevo Cliente"
        descripcion="Completá los 4 pasos para registrar un nuevo cliente"
        acciones={
          <Button variant="outline" asChild>
            <Link href="/clientes" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
          </Button>
        }
      />
      <ClienteWizard />
    </div>
  )
}
