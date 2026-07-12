import { prisma } from "@/lib/prisma";

import { createPermit } from "@/actions/permit-actions";

export default async function NewPermitPage() {
  const employees = await prisma.employee.findMany();
  const equipment = await prisma.equipment.findMany({
    where: {
      status: "ASSIGNED",
    },
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Agregar Permiso de Salida de Equipo</h1>

        <form action={createPermit} className="space-y-4">
          <input
            name="folio"
            placeholder="SI-PERMISO549"
            required
            className="w-full rounded border p-3"
          />

          <select
            name="employeeId"
            required
            className="w-full rounded border p-3"
          >
            <option value="">Select Employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>

          <select
            name="equipmentId"
            required
            className="w-full rounded border p-3"
          >
            <option value="">Seleccione Equipo</option>

            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.assetTag}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="startDate"
            required
            className="w-full rounded border p-3"
          />

          <input
            type="date"
            name="expirationDate"
            required
            className="w-full rounded border p-3"
          />

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Guardar Permiso de Salida de Equipo
          </button>
        </form>
      </div>
    </main>
  );
}
