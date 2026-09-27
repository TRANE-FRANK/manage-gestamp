import { notFound } from "next/navigation"

import { getEquipmentDetails } from "@/services/equipment"

import EquipmentForm from "../../new/equipment-form"

export default async function EditEquipmentPage({
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Editar Equipo</h1>

        <p className="mt-2 text-slate-500">
          Actualiza los datos del equipo en el inventario.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <EquipmentForm equipment={equipment} />
      </div>
    </div>
  )
}
