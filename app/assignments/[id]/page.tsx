import { notFound } from "next/navigation"

import { getAssignmentDetails } from "@/services/assignment"

import AssignmentEmployeeCard from "@/components/assignment/AssignmentEmployeeCard"
import AssignmentEquipmentCard from "@/components/assignment/AssignmentEquipmentCard"
import AssignmentInformationCard from "@/components/assignment/AssignmentInfoCard"
import AssignmentDocumentsCard from "@/components/assignment/AssignmentDocumentsCard"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function AssignmentPage({ params }: Props) {
  const { id } = await params

  try {
    const assignment = await getAssignmentDetails(Number(id))

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Asignación #{assignment.id}</h1>

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
  } catch {
    notFound()
  }
}
