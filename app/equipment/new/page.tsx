import EquipmentForm from "./equipment-form"
import { getEquipmentFormCatalogs } from "@/services/equipment/catalogs"

export default async function NewEquipmentPage() {
  const catalogs = await getEquipmentFormCatalogs()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Nuevo Equipo</h1>

        <p className="mt-2 text-slate-500">
          Registrar un nuevo equipo en el inventario.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <EquipmentForm  catalogs={catalogs} />
      </div>
    </div>
  )
}
