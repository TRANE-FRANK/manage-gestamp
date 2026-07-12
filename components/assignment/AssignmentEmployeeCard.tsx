import Card from "@/components/ui/Card"

interface Props {
  employee: {
    firstName: string
    lastName: string
    sapNumber: string
    department: string | null
  }
}

export default function AssignmentEmployeeCard({ employee }: Props) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Empleado</h2>

      <div className="space-y-2">
        <p>
          <span className="font-semibold">Nombre:</span> {employee.firstName}{" "}
          {employee.lastName}
        </p>

        <p>
          <span className="font-semibold">SAP:</span> {employee.sapNumber}
        </p>

        <p>
          <span className="font-semibold">Departamento:</span>{" "}
          {employee.department ?? "-"}
        </p>
      </div>
    </Card>
  )
}
