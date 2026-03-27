import { Metadata } from 'next'
import { PlanForm } from '@/components/configuracion/PlanForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nuevo Plan' }

export default function NuevoPlanPage() {
  return (
    <div>
      <PageHeader
        titulo="Nuevo Plan de Crédito"
        descripcion="Configurá un nuevo producto financiero"
        acciones={
          <Button variant="outline" asChild>
            <Link href="/configuracion/planes" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <PlanForm />
    </div>
  )
}
