import { prisma } from "@/lib/prisma"

import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"

import PermitForm from "@/components/PermitForm"

export default async function NewPermitPage() {
  const employees = await prisma.employee.findMany({
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  })

  const employeeOptions = employees.map((employee) => ({
    value: String(employee.id),
    label: `${employee.firstName} ${employee.lastName}`,
    description: [`SAP: ${employee.sapNumber}`, employee.department]
      .filter(Boolean)
      .join(" · "),
  }))

  return (
    <>
      <PageHeader title="Nuevo permiso" />

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Agregar Permiso de Salida de Equipo
          </h2>

          <p className="text-sm text-muted-foreground">
            Registra la vigencia y el equipo asociado al permiso.
          </p>
        </div>

        <PermitForm employeeOptions={employeeOptions} />
      </Card>
    </>
  )
}
