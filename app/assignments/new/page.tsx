import { prisma } from "@/lib/prisma";
import { createAssignmentAction } from "@/actions/assignment-actions";

export default async function NewAssignmentPage() {
  const employees = await prisma.employee.findMany({
    orderBy: {
      firstName: "asc",
    },
  });

  const equipment = await prisma.equipment.findMany({
    where: {
      status: "AVAILABLE",
    },
    orderBy: {
      assetTag: "asc",
    },
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Agregar Asignación</h1>

        <form action={createAssignmentAction} className="space-y-4">
          <select
            name="employeeId"
            className="w-full rounded-lg border p-3"
            required
          >
            <option value="">Seleccione Usuario</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>

          <select
            name="equipmentId"
            className="w-full rounded-lg border p-3"
            required
          >
            <option value="">Seleccione Equipo</option>

            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.assetTag}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Guardar Asignación
          </button>
        </form>
      </div>
    </main>
  );
}
