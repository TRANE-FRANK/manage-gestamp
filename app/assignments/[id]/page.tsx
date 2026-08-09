import { notFound } from "next/navigation"

import { getAssignmentDetails } from "@/services/assignment"

import AssignmentDocumentsCard from "@/components/assignment/AssignmentDocumentsCard"
import AssignmentEmployeeCard from "@/components/assignment/AssignmentEmployeeCard"
import AssignmentEquipmentCard from "@/components/assignment/AssignmentEquipmentCard"
import AssignmentInformationCard from "@/components/assignment/AssignmentInfoCard"

import { ReturnAssignmentButton } from "./ReturnAssignmentButton"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function AssignmentPage({ params }: Props) {
  const { id } = await params

  const assignmentId = Number(id)

  if (Number.isNaN(assignmentId)) {
    notFound()
  }

  const assignment = await getAssignmentDetails(assignmentId)

  if (!assignment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Asignación #{assignment.id}</h1>

        {assignment.returnedAt === null && (
          <ReturnAssignmentButton assignmentId={assignment.id} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AssignmentEmployeeCard employee={assignment.employee} />

        <AssignmentEquipmentCard equipment={assignment.equipment} />

        <AssignmentInformationCard
          assignedAt={assignment.assignedAt}
          returnedAt={assignment.returnedAt}
          generated={!!assignment.generatedPdfPath}
          signed={!!assignment.signedPdfPath}
        />

        <AssignmentDocumentsCard
          assignmentId={assignment.id}
          generatedPdfPath={assignment.generatedPdfPath}
          signedPdfPath={assignment.signedPdfPath}
        />
      </div>
    </div>
  )
}
