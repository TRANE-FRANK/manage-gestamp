import Link from "next/link"

import Card from "@/components/ui/Card"
import { Badge } from "@/components/ui/badge"

interface Props {
  assignment: {
    id: number

    assignedAt: Date
    returnedAt: Date | null

    generatedPdfPath: string | null
    signedPdfPath: string | null

    employee: {
      firstName: string
      lastName: string
      sapNumber: string
    }

    equipment: {
      assetTag: string
      brand: string | null
      model: string | null
    }
  }
}

export default function AssignmentHistoryCard({ assignment }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {assignment.employee.firstName} {assignment.employee.lastName}
          </h2>

          <p className="text-sm text-slate-500">
            SAP: {assignment.employee.sapNumber}
          </p>
        </div>

        <Link
          href={`/assignments/${assignment.id}`}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-700"
        >
          Ver detalle
        </Link>
      </div>

      <hr className="my-5" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-medium">Equipo</p>

          <p className="text-slate-600">
            {assignment.equipment.brand} {assignment.equipment.model}
          </p>

          <p className="text-sm text-slate-500">
            {assignment.equipment.assetTag}
          </p>
        </div>

        <div>
          <p className="font-medium">Fechas</p>

          <p>Asignada: {assignment.assignedAt.toLocaleDateString("es-MX")}</p>

          <p>
            Devuelta:{" "}
            {assignment.returnedAt
              ? assignment.returnedAt.toLocaleDateString("es-MX")
              : "Actual"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {assignment.generatedPdfPath ? (
          <Badge variant="default">PDF generado</Badge>
        ) : (
          <Badge variant="destructive">Sin PDF</Badge>
        )}

        {assignment.signedPdfPath ? (
          <Badge variant="default">Firmada</Badge>
        ) : (
          <Badge variant="outline">Pendiente firma</Badge>
        )}
      </div>
    </Card>
  )
}
