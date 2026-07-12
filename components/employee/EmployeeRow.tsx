import Link from "next/link"

import Badge from "@/components/ui/Badge"

import type { Employee } from "@/generated/prisma/client"

interface Props {
  employee: Employee
}

export default function EmployeeRow({ employee }: Props) {
  return (
    <tr className="border-b transition hover:bg-slate-50">
      <td className="p-4 font-medium">{employee.sapNumber}</td>

      <td className="p-4">
        <Link
          href={`/employees/${employee.id}`}
          className="font-medium text-slate-800 transition hover:text-blue-700"
        >
          {employee.firstName} {employee.lastName}
        </Link>
      </td>

      <td className="p-4">{employee.department || "-"}</td>

      <td className="p-4">{employee.position || "-"}</td>

      <td className="p-4">
        <Badge variant={employee.company === "ORM" ? "ORM" : "GP2"}>
          {employee.company}
        </Badge>
      </td>
    </tr>
  )
}
