import Link from "next/link"

import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/data-table"
import { employeeColumns } from "@/app/employees/columns"

import { listEmployees } from "@/services/employee"
import { requirePageRole } from "@/lib/auth/page-guard"

export default async function EmployeesPage() {
  await requirePageRole("ADMIN", "IT")

  const employees = await listEmployees()

  return (
    <>
      <PageHeader
        title="Empleados"
        actions={
          <Link
            href="/employees/new"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Nuevo Empleado
          </Link>
        }
      />

      <Card>
        <DataTable
          columns={employeeColumns}
          data={employees}
        />
      </Card>
    </>
  )
}
