import { notFound } from "next/navigation"

import { getPermitDetails } from "@/services/permit"

import Card from "@/components/ui/Card"

import RenewPermitForm from "./RenewPermitForm"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function RenewPermitPage({ params }: Props) {
  const { id } = await params

  const permitId = Number(id)

  if (!Number.isInteger(permitId) || permitId <= 0) {
    notFound()
  }

  const permit = await getPermitDetails(permitId)

  if (!permit) {
    notFound()
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Renovar Permiso</h1>

          <p className="mt-1 text-sm text-slate-500">
            Define manualmente la nueva vigencia del permiso.
          </p>
        </div>

        <Card>
          <div className="space-y-3">
            <p>
              <strong>Empleado:</strong> {permit.employee.firstName}{" "}
              {permit.employee.lastName}
            </p>

            <p>
              <strong>Equipo:</strong> {permit.equipment.assetTag}
            </p>

            <p>
              <strong>Empresa:</strong> {permit.equipment.company}
            </p>

            <p>
              <strong>Folio actual:</strong> {permit.folio}
            </p>

            <p>
              <strong>Vencimiento actual:</strong>{" "}
              {permit.expirationDate.toLocaleDateString("es-MX")}
            </p>
          </div>
        </Card>

        <Card>
          <RenewPermitForm permitId={permit.id} />
        </Card>
      </div>
    </main>
  )
}
