import { notFound } from "next/navigation"
import { requirePageRole } from "@/lib/auth/page-guard"

import { getAssignmentDetails } from "@/services/assignment"

import AssignmentDocumentsCard from "@/components/assignment/AssignmentDocumentsCard"
import AssignmentEmployeeCard from "@/components/assignment/AssignmentEmployeeCard"
import AssignmentEquipmentCard from "@/components/assignment/AssignmentEquipmentCard"
import AssignmentInformationCard from "@/components/assignment/AssignmentInfoCard"

import { ReturnAssignmentButton } from "./ReturnAssignmentButton"
import { CancelAssignmentButton } from "./CancelAssignmentButton"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function AssignmentPage({ params }: Props) {
  await requirePageRole("ADMIN", "IT")

  const { id } = await params

  const assignmentId = Number(id)

  if (Number.isNaN(assignmentId)) {
    notFound()
  }

  const assignment = await getAssignmentDetails(assignmentId)

  if (!assignment) {
    notFound()
  }

  const isActive =
    assignment.returnedAt === null && assignment.cancelledAt === null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Asignación #{assignment.id}</h1>

        {assignment.returnedAt === null && assignment.cancelledAt === null && (
          <div className="flex gap-2">
            <ReturnAssignmentButton assignmentId={assignment.id} />
            <CancelAssignmentButton assignmentId={assignment.id} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AssignmentEmployeeCard employee={assignment.employee} />

        <AssignmentEquipmentCard equipment={assignment.equipment} />

        <AssignmentInformationCard
          assignedAt={assignment.assignedAt}
          returnedAt={assignment.returnedAt}
          cancelledAt={assignment.cancelledAt}
          cancellationReason={assignment.cancellationReason}
          equipmentType={assignment.equipment.type}
          generated={!!assignment.generatedPdfPath}
          signed={!!assignment.signedPdfPath}
        />

        <AssignmentDocumentsCard
          assignmentId={assignment.id}
          equipmentType={assignment.equipment.type}
          isActive={isActive}
          generatedPdfPath={assignment.generatedPdfPath}
          signedPdfPath={assignment.signedPdfPath}
        />
      </div>
    </div>
  )
}
