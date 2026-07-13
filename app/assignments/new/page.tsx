import PageHeader from "@/components/ui/PageHeader"
import AssignmentForm from "@/components/assignment/AssignmentForm"

import { prisma } from "@/lib/prisma"

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

  const employeeOptions = employees.map((employee) => ({
    id: employee.id,
    label: `${employee.firstName} ${employee.lastName}`,
    description: employee.position ?? "",
  }))

  const equipmentOptions = equipment.map((item) => ({
    id: item.id,
    label: item.assetTag,
    description: `${item.brand ?? ""} ${item.model ?? ""}`.trim(),
  }))

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Nueva asignación" />

        <AssignmentForm
          employees={employeeOptions}
          equipment={equipmentOptions}
          employeeId={employeeId}
        />
      </div>
    </main>
  )
}
