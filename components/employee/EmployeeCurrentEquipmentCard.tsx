import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import DetailGrid from "@/components/ui/DetailGrid"
import DetailItem from "@/components/ui/DetailItem"

import type { EmployeeDetails } from "@/services/employee"

interface Props {
  employee: EmployeeDetails
}

export default function EmployeeCurrentEquipmentCard({ employee }: Props) {
  const assignment = employee.assignments.find(
    (assignment) => assignment.returnedAt === null,
  )

  if (!assignment) {
    return (
      <Card>
        <h2 className="mb-6 text-lg font-semibold">Equipo actual</h2>

        <p className="text-slate-500">
          El empleado no tiene un equipo asignado.
        </p>
      </Card>
    )
  }

  const equipment = assignment.equipment

  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold">Equipo actual</h2>

      <DetailGrid>
        <DetailItem label="Activo fijo">{equipment.assetTag}</DetailItem>

        <DetailItem label="Empresa">
          <Badge variant={equipment.company === "ORM" ? "ORM" : "GP2"}>
            {equipment.company}
          </Badge>
        </DetailItem>

        <DetailItem label="Marca">{equipment.brand}</DetailItem>

        <DetailItem label="Modelo">{equipment.model}</DetailItem>

        <DetailItem label="Serie">{equipment.serialNumber}</DetailItem>

        <DetailItem label="Estado">
          <Badge variant="success">En uso</Badge>
        </DetailItem>
      </DetailGrid>
    </Card>
  )
}
