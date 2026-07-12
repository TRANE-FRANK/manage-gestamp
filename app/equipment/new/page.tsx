import { createEquipment } from "@/actions/equipment-actions";

export default function NewEquipmentPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Nuevo Equipo</h1>
        <p className="mt-2 text-slate-500">
          Registrar un nuevo equipo en el inventario.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <form action={createEquipment} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Asset Tag
            </label>
            <input
              name="assetTag"
              placeholder="GP2LT001"
              className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de Equipo
            </label>
            <select
              name="type"
              className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Seleccionar</option>
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Desktop</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Número de Inventario
              </label>
              <input
                name="inventoryNumber"
                placeholder="INV-0001"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Número de Serie
              </label>
              <input
                name="serialNumber"
                placeholder="Serial"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Marca
              </label>
              <input
                name="brand"
                placeholder="Dell"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Modelo
              </label>
              <input
                name="model"
                placeholder="Latitude 5440"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Empresa
              </label>
              <select
                name="company"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="ORM">ORM</option>
                <option value="GP2">GP2</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                name="status"
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="ASSIGNED">Asignado</option>
                <option value="STORAGE">Almacén</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="RETIRED">Retirado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white transition hover:bg-blue-800"
            >
              Guardar Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}