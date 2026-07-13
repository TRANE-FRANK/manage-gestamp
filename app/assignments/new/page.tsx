import { prisma } from "@/lib/prisma"
import { createAssignmentAction } from "@/actions/assignment-actions"



interface Props {
  searchParams: Promise<{
    employeeId?: string
  }>
}

export default async function NewAssignmentPage({ searchParams }: Props) {
  const { employeeId } = await searchParams

  const employees = await prisma.employee.findMany({
    orderBy: {
      firstName: "asc",
    },
  })

  const equipment = await prisma.equipment.findMany({
    where: {
      status: "AVAILABLE",
    },
    orderBy: {
      assetTag: "asc",
    },
  })



  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Agregar Asignación</h1>

        <form action={createAssignmentAction} className="space-y-4">




          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Guardar Asignación
          </button>
        </form>
      </div>
    </main>
  )
}
