import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"

import AssignmentHistoryTable from "@/components/assignment/AssignmentHistoryTable"

import { listAssignmentHistory } from "@/services/assignment"

export default async function AssignmentHistoryPage() {
  const assignments = await listAssignmentHistory()

  return (
    <>
      <PageHeader title="Historial de asignaciones" />

      <Card>
        <AssignmentHistoryTable assignments={assignments} />
      </Card>
    </>
  )
}
