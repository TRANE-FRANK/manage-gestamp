import "server-only"

import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"
import { NotFoundError, ValidationError } from "@/services/shared/errors"

import { ensureDirectory } from "@/services/shared/storage"

const MAX_FILE_SIZE = 10 * 1024 * 1024

async function removeSignedPdfIfUnreferenced(
  relativePath: string,
  absolutePath: string,
) {
  try {
    const reference = await prisma.maintenance.findFirst({
      where: { signedPdfPath: relativePath },
      select: { id: true },
    })

    if (!reference) {
      await fs.unlink(absolutePath)
    }
  } catch {
    // Si no podemos comprobar la referencia, conservamos el archivo.
  }
}

export async function uploadMaintenanceSignedPdf(
  maintenanceId: number,
  file: File,
) {
  const actor = await requireRole("ADMIN", "IT")

  if (!Number.isSafeInteger(maintenanceId) || maintenanceId <= 0) {
    throw new NotFoundError("El mantenimiento no existe.")
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError("Selecciona un archivo PDF válido.")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("El archivo excede el límite de 10 MB.")
  }

  const maintenance = await prisma.maintenance.findUnique({
    where: { id: maintenanceId },
    select: {
      id: true,
      generatedPdfPath: true,
      signedPdfPath: true,
    },
  })

  if (!maintenance) {
    throw new NotFoundError("El mantenimiento no existe.")
  }

  if (!maintenance.generatedPdfPath) {
    throw new ValidationError("Primero debes generar el formato imprimible.")
  }

  if (maintenance.signedPdfPath) {
    throw new ValidationError(
      "Este mantenimiento ya tiene un documento firmado. No se permite reemplazarlo.",
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (
    buffer.length < 5 ||
    buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new ValidationError(
      "El archivo seleccionado no tiene una firma PDF válida.",
    )
  }

  const directory = await ensureDirectory("maintenance/signed")
  const originalName = path.posix.basename(
    maintenance.generatedPdfPath.replaceAll("\\", "/"),
    ".pdf",
  )
  const signedName = `${originalName}-${randomUUID()}-FIRMADA.pdf`
  const outputPath = path.join(directory, signedName)
  const relativePath = path.posix.join("maintenance", "signed", signedName)

  let ownsOutput = false

  try {
    const outputFile = await fs.open(outputPath, "wx")
    ownsOutput = true

    try {
      await outputFile.writeFile(buffer)
    } finally {
      await outputFile.close()
    }

    await prisma.$transaction(async (tx) => {
      const update = await tx.maintenance.updateMany({
        where: {
          id: maintenanceId,
          generatedPdfPath: { not: null },
          signedPdfPath: null,
        },
        data: {
          signedPdfPath: relativePath,
        },
      })

      if (update.count === 0) {
        throw new ValidationError(
          "No se pudo cargar el documento. Es posible que ya exista uno firmado.",
        )
      }

      await writeAuditEvent(tx, {
        actor,
        action: "MAINTENANCE_SIGNED_DOCUMENT_UPLOADED",
        entityType: "MAINTENANCE",
        entityId: String(maintenanceId),
        outcome: "SUCCESS",
        source: "maintenance.document.upload-signed",
      })
    })

    ownsOutput = false

    return { success: true }
  } catch (error) {
    if (ownsOutput) {
      await removeSignedPdfIfUnreferenced(relativePath, outputPath)
    }

    throw error
  }
}
