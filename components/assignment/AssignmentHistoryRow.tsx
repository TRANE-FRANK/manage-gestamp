import Link from "next/link"

import Badge from "@/components/ui/Badge"

import type { AssignmentDetails } from "@/services/assignment"

interface Props {
  assignment: AssignmentDetails
}

export default function AssignmentHistoryRow({ assignment }: Props) {
  return (
    <tr className="border-b transition hover:bg-slate-50">
      <td className="p-4">
        <div>
          <p className="font-medium">
            {assignment.employee.firstName} {assignment.employee.lastName}
          </p>

          <p className="text-sm text-slate-500">
            SAP: {assignment.employee.sapNumber}
          </p>
        </div>
      </td>

      <td className="p-4 font-medium">{assignment.equipment.assetTag}</td>

      <td className="p-4">
        <Badge variant={assignment.equipment.company === "ORM" ? "ORM" : "GP2"}>
          {assignment.equipment.company}
        </Badge>
      </td>

      <td className="p-4">
        {assignment.assignedAt.toLocaleDateString("es-MX")}
      </td>

      <td className="p-4">
        {assignment.returnedAt
          ? assignment.returnedAt.toLocaleDateString("es-MX")
          : "-"}
      </td>

      <td className="p-4">
        <Badge variant={assignment.returnedAt ? "success" : "warning"}>
          {assignment.returnedAt ? "Devuelta" : "Activa"}
        </Badge>
      </td>

      <td className="p-4">
        <Link
          href={`/assignments/${assignment.id}`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-100"
        >
          👁 Ver detalle
        </Link>
      </td>
    </tr>
  )
}