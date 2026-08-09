import Card from "@/components/ui/Card"
import { Badge } from "@/components/ui/badge"
import DetailGrid from "@/components/ui/DetailGrid"
import DetailItem from "@/components/ui/DetailItem"

import type { EmployeeDetails } from "@/services/employee"

interface Props {
  employee: EmployeeDetails
}

export default function EmployeeInformationCard({ employee }: Props) {
  return (
    <Card>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">
        Información del empleado
      </h2>

      <DetailGrid>
        <DetailItem label="Nombre">
          {employee.firstName} {employee.lastName}
        </DetailItem>
        <DetailItem label="SAP">{employee.sapNumber}</DetailItem>
        <DetailItem label="Empresa">
          <Badge variant={employee.company === "ORM" ? "secondary" : "default"}>
            {employee.company}
          </Badge>
        </DetailItem>
        <DetailItem label="Departamento">
          {employee.department || "-"}
        </DetailItem>
        <DetailItem label="Posición">{employee.position || "-"}</DetailItem>
      </DetailGrid>
    </Card>
  )
}
