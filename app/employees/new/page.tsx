import { createEmployee } from "@/actions/employee-actions";

export default function NewEmployeePage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Agregar Usuario</h1>

        <form action={createEmployee} className="space-y-4">
          <input
            name="sapNumber"
            placeholder="Numero de SAP"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="firstName"
            placeholder="Apellidos"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="lastName"
            placeholder="Nombre"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="department"
            placeholder="Departamento"
            className="w-full rounded-lg border p-3"
          />

          <input
            name="position"
            placeholder="Posición"
            className="w-full rounded-lg border p-3"
          />

          <select
            name="company"
            className="w-full rounded-lg border p-3"
            required
          >
            <option value="ORM">ORM</option>
            <option value="GP2">GP2</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Guardar Usuario
          </button>
        </form>
      </div>
    </main>
  );
}
