import Badge from "@/components/ui/Badge"

import type { AssignmentDetails } from "@/services/assignment"
import AssignmentStatus from "./AssignmentStatus"
import GenerateResponsivaButton from "@/app/assignments/generate-responsiva-button"
import UploadSignedPdfButton from "@/components/assignment/upload-signed-pdf-button"
import ViewDocumentButton from "@/components/assignment/view-document-button"

interface Props {
  assignment: AssignmentDetails
}

export default function AssignmentRow({ assignment }: Props) {
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
        <AssignmentStatus
          generatedPdfPath={assignment.generatedPdfPath}
          signedPdfPath={assignment.signedPdfPath}
        />
      </td>
      <td className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {!assignment.generatedPdfPath && (
            <GenerateResponsivaButton assignmentId={assignment.id} />
          )}
          {assignment.generatedPdfPath && (
            <ViewDocumentButton assignmentId={assignment.id} type="generated" />
          )}
          {assignment.generatedPdfPath && !assignment.signedPdfPath && (
            <UploadSignedPdfButton assignmentId={assignment.id} />
          )}
          {assignment.signedPdfPath && (
            <ViewDocumentButton assignmentId={assignment.id} type="signed" />
          )}
        </div>
      </td>
    </tr>
  )
}
