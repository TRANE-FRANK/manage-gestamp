import { NotFoundError, ValidationError } from "@/services/shared/errors"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"

import { ensureDirectory } from "../shared/storage"

export async function uploadSignedPdf(assignmentId: number, file: File) {
  await requireRole("ADMIN", "IT")

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  })

  if (!assignment) {
    throw new NotFoundError("Asignación no encontrada.")
  }

  if (assignment.returnedAt !== null || assignment.cancelledAt !== null) {
    throw new ValidationError(
      "No se puede cargar una responsiva firmada para una asignación cerrada.",
    )
  }

  if (!assignment.generatedPdfPath) {
    throw new ValidationError("La responsiva aún no ha sido generada.")
  }

  if (file.type !== "application/pdf") {
    throw new ValidationError("Solo se permiten archivos PDF.")
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new ValidationError("El archivo excede los 3 MB.")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const directory = await ensureDirectory("assignments/signed")

  /*
   * RESP-123456-2026-06-28_01-48-15.pdf
   */

  const originalName = path.basename(assignment.generatedPdfPath, ".pdf")

  /*
   * RESP-123456-2026-06-28_01-48-15-FIRMADA.pdf
   */

  const signedName = `${originalName}-${randomUUID()}-FIRMADA.pdf`
  const outputPath = path.join(directory, signedName)
  const relativePath = path.join("assignments", "signed", signedName)
  let ownsOutput = false
  let databaseWritePending = false

  try {
    const outputFile = await fs.open(outputPath, "wx")
    ownsOutput = true

    try {
      await outputFile.writeFile(buffer)
    } finally {
      await outputFile.close()
    }

    databaseWritePending = true
    const assignmentUpdate = await prisma.assignment.updateMany({
      where: {
        id: assignmentId,
        returnedAt: null,
        cancelledAt: null,
      },
      data: {
        signedPdfPath: relativePath,
      },
    })
    databaseWritePending = false

    if (assignmentUpdate.count === 0) {
      throw new ValidationError(
        "No se puede cargar una responsiva firmada para una asignación cerrada.",
      )
    }

    ownsOutput = false
  } catch (error) {
    if (ownsOutput && !databaseWritePending) {
      await removeSignedPdfIfUnreferenced(relativePath, outputPath)
    }

    throw error
  }
}

async function removeSignedPdfIfUnreferenced(
  relativePath: string,
  absolutePath: string,
) {
  try {
    const reference = await prisma.assignment.findFirst({
      where: { signedPdfPath: relativePath },
      select: { id: true },
    })

    if (!reference) {
      await fs.unlink(absolutePath)
    }
  } catch {
    // Keep the file if its database reference cannot be checked safely.
  }
}
