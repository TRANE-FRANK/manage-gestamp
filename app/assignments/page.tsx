import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"

import Link from "next/link"

import AssignmentTable from "@/components/assignment/AssignmentTable"

import { listActiveAssignments } from "@/services/assignment"

export default async function AssignmentsPage() {
  const assignments = await listActiveAssignments()

  return (
    <>
      <PageHeader
        title="Asignaciones"
        actions={
          <>
            <Link
              href="/assignments/history"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Historial
            </Link>

            <Link
              href="/assignments/new"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Nueva Asignación
            </Link>
          </>
        }
      />

      <Card>
        <AssignmentTable assignments={assignments} />
      </Card>
    </>
  )
}
