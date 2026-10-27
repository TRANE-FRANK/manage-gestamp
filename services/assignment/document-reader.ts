import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"

import type { DocumentType } from "@/services/document/types"
import { readDocument } from "@/services/document/reader"

import { NotFoundError } from "@/services/shared/errors"

export async function getAssignmentDocument(
  assignmentId: number,
  type: DocumentType,
) {
  await requireRole("ADMIN", "IT")

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
