"use client"

import type { ColumnDef } from "@tanstack/react-table"

import GenerateResponsivaButton from "@/app/assignments/generate-responsiva-button"
import UploadSignedPdfButton from "@/components/assignment/upload-signed-pdf-button"
import ViewDocumentButton from "@/components/assignment/view-document-button"

import type { AssignmentListItem } from "@/services/assignment"

export const actionsColumn: ColumnDef<AssignmentListItem> = {
  id: "actions",
  header: () => "Documento",
  enableSorting: false,
  enableHiding: false,
  cell: ({ row }) => (
    <div className="flex flex-wrap gap-2">
      {!row.original.generatedPdfPath && (
        <GenerateResponsivaButton assignmentId={row.original.id} />
      )}

      {row.original.generatedPdfPath && (
        <ViewDocumentButton assignmentId={row.original.id} type="generated" />
      )}

      {row.original.generatedPdfPath && !row.original.signedPdfPath && (
        <UploadSignedPdfButton assignmentId={row.original.id} />
      )}

      {row.original.signedPdfPath && (
        <ViewDocumentButton assignmentId={row.original.id} type="signed" />
      )}
    </div>
  ),
  meta: { title: "Documento" },
}
