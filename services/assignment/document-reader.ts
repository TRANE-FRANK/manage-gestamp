import { prisma } from "@/lib/prisma"

import { DocumentType, readDocument } from "@/services/document"

import { NotFoundError } from "@/services/shared/errors"

export async function getAssignmentDocument(
  assignmentId: number,
  type: DocumentType,
) {
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  })

  if (!assignment) {
    throw new NotFoundError("Asignación no encontrada.")
  }

  const relativePath =
    type === "generated"
      ? assignment.generatedPdfPath
      : assignment.signedPdfPath

  if (!relativePath) {
    throw new NotFoundError(
      type === "generated"
        ? "No existe la responsiva generada."
        : "No existe la responsiva firmada.",
    )
  }

  return readDocument(relativePath)
}
