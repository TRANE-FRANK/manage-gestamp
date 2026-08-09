import Card from "@/components/ui/Card"
import PageHeader from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/data-table"
import { assignmentHistoryColumns } from "@/app/assignments/history-columns"

import { listAssignmentHistory } from "@/services/assignment"

export default async function AssignmentHistoryPage() {
  const assignments = await listAssignmentHistory()

  return (
    <>
      <PageHeader title="Historial de asignaciones" />

      <Card>
        <DataTable
          columns={assignmentHistoryColumns}
          data={assignments}
          toolbarPlaceholder="Buscar historial..."
        />
      </Card>
    </>
  )
}
