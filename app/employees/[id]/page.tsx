import Link from "next/link"

import PageHeader from "@/components/ui/PageHeader"

import EmployeeInformationCard from "@/components/employee/EmployeeInformationCard"
import EmployeeCurrentEquipmentCard from "@/components/employee/EmployeeCurrentEquipmentCard"
import EmployeeAssignmentHistoryCard from "@/components/employee/EmployeeAssignmentHistoryCard"
import EmployeeGeneratedDocumentsCard from "@/components/employee/EmployeeGeneratedDocumentsCard"
import EmployeeTimelineCard from "@/components/employee/EmployeeTimelineCard"

import { getEmployeeDetails } from "@/services/employee"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EmployeeDetailsPage({ params }: Props) {
  const { id } = await params

  const employee = await getEmployeeDetails(Number(id))

  return (
    <>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        actions={
          <>
            <Link
              href={`/employees/${employee.id}/edit`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Editar
            </Link>

            <Link
              href={`/assignments/new?employeeId=${employee.id}`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Nueva asignación
            </Link>

            <button
              disabled
              className="cursor-not-allowed rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-400"
            >
              Generar permiso
            </button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <EmployeeInformationCard employee={employee} />
        <EmployeeCurrentEquipmentCard employee={employee} />
      </div>

      <div className="mt-6 space-y-6">
        <EmployeeAssignmentHistoryCard employee={employee} />
        <EmployeeGeneratedDocumentsCard employee={employee} />
        <EmployeeTimelineCard employee={employee} />
      </div>
    </>
  )
}
