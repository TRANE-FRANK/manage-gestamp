"use client"

import type { ColumnDef } from "@tanstack/react-table"

import GenerateResponsivaButton from "@/app/assignments/generate-responsiva-button"
import UploadSignedPdfButton from "@/components/assignment/upload-signed-pdf-button"
import ViewDocumentButton from "@/components/assignment/view-document-button"
import { equipmentTypeConfig } from "@/lib/equipment/config"

import type { AssignmentListItem } from "@/services/assignment"

export const actionsColumn: ColumnDef<AssignmentListItem> = {
  id: "actions",
  header: () => "Documento",
  enableSorting: false,
  enableHiding: false,
  cell: ({ row }) => {
    const assignment = row.original
    const equipmentType = assignment.equipment.type
    const hasResponsiva =
      equipmentType !== null &&
      equipmentTypeConfig[equipmentType].hasResponsiva
    const isActive =
      assignment.returnedAt === null && assignment.cancelledAt === null
    const canGenerateResponsiva = isActive && !assignment.generatedPdfPath
    const canUploadSignedPdf =
      isActive && !!assignment.generatedPdfPath && !assignment.signedPdfPath

    if (!hasResponsiva) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2">
        {canGenerateResponsiva && (
          <GenerateResponsivaButton assignmentId={assignment.id} />
        )}

        {assignment.generatedPdfPath && (
          <ViewDocumentButton assignmentId={assignment.id} type="generated" />
        )}

        {canUploadSignedPdf && (
          <UploadSignedPdfButton assignmentId={assignment.id} />
        )}

        {assignment.signedPdfPath && (
          <ViewDocumentButton assignmentId={assignment.id} type="signed" />
        )}
      </div>
    )
  },
  meta: { title: "Documento" },
}
