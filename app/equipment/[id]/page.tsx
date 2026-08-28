import { notFound } from "next/navigation"

import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"

import { getEquipmentDetails } from "@/services/equipment"

export default async function EquipmentDetailsPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  const equipmentId = Number(id)

  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    notFound()
  }

  const equipment = await getEquipmentDetails(equipmentId)

  if (!equipment) {
    notFound()
  }

  return (
    <>
      <PageHeader title={equipment.assetTag ?? `Equipo #${equipmentId}`} />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Información del equipo
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Tipo</p>
              <p className="font-medium">{equipment.type}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Marca</p>
              <p className="font-medium">{equipment.brand ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Modelo</p>
              <p className="font-medium">{equipment.model ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Número de serie</p>
              <p className="font-medium">{equipment.serialNumber ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Número de inventario</p>
              <p className="font-medium">{equipment.inventoryNumber ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Empresa</p>
              <p className="font-medium">{equipment.company}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Estado</p>
              <p className="font-medium">{equipment.status}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Asignaciones
          </h2>

          {equipment.assignments.length === 0 ? (
            <p className="text-sm text-slate-500">
              Este equipo no tiene asignaciones registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {equipment.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-medium">
                    {assignment.employee.firstName}{" "}
                    {assignment.employee.lastName}
                  </p>

                  <p className="text-sm text-slate-500">
                    Asignado:{" "}
                    {assignment.assignedAt.toLocaleDateString("es-MX")}
                  </p>

                  <p className="text-sm text-slate-500">
                    {assignment.returnedAt
                      ? `Devuelto: ${assignment.returnedAt.toLocaleDateString(
                          "es-MX",
                        )}`
                      : "Asignación activa"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Permisos
          </h2>

          {equipment.permits.length === 0 ? (
            <p className="text-sm text-slate-500">
              Este equipo no tiene permisos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {equipment.permits.map((permit) => (
                <div
                  key={permit.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-medium">{permit.folio}</p>

                  <p className="text-sm text-slate-500">
                    {permit.employee.firstName} {permit.employee.lastName}
                  </p>

                  <p className="text-sm text-slate-500">
                    Vigencia: {permit.startDate.toLocaleDateString("es-MX")} —{" "}
                    {permit.expirationDate.toLocaleDateString("es-MX")}
                  </p>

                  <p className="text-sm text-slate-500">
                    Estado: {permit.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
