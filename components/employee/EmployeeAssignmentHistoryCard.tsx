import { formatDate } from "@/lib/format-date"

import SectionCard from "@/components/ui/SectionCard"
import { Badge } from "@/components/ui/badge"

import type { EmployeeDetails } from "@/services/employee"

interface Props {
  employee: EmployeeDetails
}

export default function EmployeeAssignmentHistoryCard({ employee }: Props) {
  return (
    <SectionCard title="Historial de asignaciones">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-lg font-semibold">Historial de asignaciones</h2>

        <Badge variant="destructive">{employee.assignments.length}</Badge>
      </div>

      {employee.assignments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Este empleado aún no tiene asignaciones registradas.
        </p>
      ) : (
        <div className="space-y-4">
          {employee.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">
                  {assignment.equipment.brand} {assignment.equipment.model}
                </h3>

                <Badge variant={assignment.returnedAt ? "outline" : "default"}>
                  {assignment.returnedAt ? "Devuelta" : "Activa"}
                </Badge>
              </div>

              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <strong>Etiqueta:</strong> {assignment.equipment.assetTag}
                </p>

                <p>
                  <strong>Serie:</strong> {assignment.equipment.serialNumber}
                </p>

                <p>
                  <strong>Asignado:</strong> {formatDate(assignment.assignedAt)}
                </p>

                <p>
                  <strong>Devuelto:</strong>{" "}
                  {assignment.returnedAt
                    ? formatDate(assignment.returnedAt)
                    : "Aun con usuario"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
