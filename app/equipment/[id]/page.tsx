import { notFound } from "next/navigation"

import Link from "next/link"

import type { EquipmentStatus } from "@/generated/prisma/client"

import { Badge } from "@/components/ui/badge"
import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"

import { equipmentTypeConfig } from "@/lib/equipment/config"
import { getEquipmentDetails } from "@/services/equipment"

import EquipmentToast from "../equipment-toast"

const statusConfig: Record<
  EquipmentStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  AVAILABLE: {
    label: "Disponible",
    variant: "default" as const,
  },
  ASSIGNED: {
    label: "Asignado",
    variant: "destructive" as const,
  },
  MAINTENANCE: {
    label: "Reparación",
    variant: "outline" as const,
  },
  STORAGE: {
    label: "Almacén",
    variant: "secondary" as const,
  },
  RETIRED: {
    label: "Retirado",
    variant: "secondary" as const,
  },
}

const permitStatusConfig = {
  ACTIVE: {
    label: "Activo",
    variant: "default" as const,
  },
  EXPIRED: {
    label: "Vencido",
    variant: "secondary" as const,
  },
  CANCELLED: {
    label: "Cancelado",
    variant: "destructive" as const,
  },
}

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

  const identifier =
    equipment.assetTag ??
    equipment.inventoryNumber ??
    equipment.serialNumber ??
    `Equipo #${equipment.id}`

  const typeConfig = equipment.type
    ? equipmentTypeConfig[equipment.type]
    : undefined

  const status = statusConfig[equipment.status]

  return (
    <>
      <PageHeader
        title={identifier}
        actions={
          <Link
            href={`/equipment/${equipment.id}/edit`}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Editar equipo
          </Link>
        }
      />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Información del equipo
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Tipo</p>
              {typeConfig ? (
                <Badge variant="secondary">{typeConfig.label}</Badge>
              ) : (
                <p className="font-medium">-</p>
              )}
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
              <Badge
                variant={equipment.company === "ORM" ? "default" : "secondary"}
              >
                {equipment.company}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-slate-500">Estado</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div>
              <p className="text-sm text-slate-500">Propiedad</p>
              <Badge
                variant={
                  equipment.ownership === "OWNED" ? "default" : "secondary"
                }
              >
                {equipment.ownership === "OWNED" ? "Propio" : "Rentado"}
              </Badge>
            </div>

            {typeConfig?.hasWarranty && (
              <div>
                <p className="text-sm text-slate-500">Garantía</p>
                <p className="font-medium">
                  {equipment.warrantyExpiresAt
                    ? equipment.warrantyExpiresAt.toLocaleDateString("es-MX")
                    : "Sin fecha registrada"}
                </p>
              </div>
            )}
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

        {typeConfig?.requiresExitPermit && (
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

                    <div className="mt-2">
                      <p className="mb-1 text-sm text-slate-500">Estado</p>
                      <Badge
                        variant={permitStatusConfig[permit.status].variant}
                      >
                        {permitStatusConfig[permit.status].label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <EquipmentToast />
    </>
  )
}
