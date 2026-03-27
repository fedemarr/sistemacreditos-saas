import { Metadata } from 'next'
import { ComercioForm } from '@/components/configuracion/ComercioForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nuevo Comercio' }

export default function NuevoComercioPage() {
  return (
    <div>
      <PageHeader
        titulo="Nuevo Comercio"
        descripcion="Registrá un comercio adherido"
        acciones={
          <Button variant="outline" asChild>
            <Link href="/configuracion/comercios" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        }
      />
      <ComercioForm />
    </div>
  )
}
