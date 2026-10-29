import path from "path"
import { unlink, writeFile } from "fs/promises"

import { BusinessError } from "@/services/shared/errors"
import { ensureDirectory } from "@/services/shared/storage"
import { requireRole } from "@/lib/auth/authorization"
import { prisma } from "@/lib/prisma"
import { writeAuditEvent } from "@/services/audit/service"

import { findPermitById } from "./repository"

export async function uploadSignedPermitPdf(
  permitId: number,
  file: File,
) {
  const actor = await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (file.type !== "application/pdf") {
    throw new BusinessError("Solo se permiten archivos PDF.")
  }

  if (file.size === 0) {
    throw new BusinessError("El archivo está vacío.")
  }

  const maxSize = 10 * 1024 * 1024

  if (file.size > maxSize) {
    throw new BusinessError("El archivo no puede superar los 10 MB.")
  }

  const outputDir = await ensureDirectory("permits/signed")

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  const safeFolio = permit.folio.replace(/[^a-zA-Z0-9-_]/g, "-")

  const fileName = `PERM-FIRMADO-${safeFolio}-${timestamp}.pdf`

  const outputPath = path.join(outputDir, fileName)

  const buffer = Buffer.from(await file.arrayBuffer())

  const relativePath = path.join("permits", "signed", fileName)

  let ownsCreatedFile = false
  try {
    await writeFile(outputPath, buffer, { flag: "wx" })
    ownsCreatedFile = true

    await prisma.$transaction(async (tx) => {
      const current = await tx.permit.findUnique({
        where: { id: permit.id },
        select: {
          id: true,
          folio: true,
          employeeId: true,
          equipmentId: true,
          status: true,
          departureAuthorized: true,
        },
      })

      if (!current || current.status === "CANCELLED") {
        throw new BusinessError("No se pudo guardar el documento del permiso.")
      }

      const wasAuthorized = current.departureAuthorized
      const update = await tx.permit.updateMany({
        where: {
          id: current.id,
          status: current.status,
          departureAuthorized: wasAuthorized,
        },
        data: {
          signedPdfPath: relativePath,
          departureAuthorized: true,
        },
      })

      if (update.count === 0) {
        throw new BusinessError("El permiso cambió y no se pudo guardar el documento.")
      }

      await writeAuditEvent(tx, {
        actor,
        action: "PERMIT_SIGNED_DOCUMENT_UPLOADED",
        entityType: "PERMIT",
        entityId: String(current.id),
        outcome: "SUCCESS",
        source: "permit.signed-document-upload",
      })

      if (!wasAuthorized) {
        await writeAuditEvent(tx, {
          actor,
          action: "PERMIT_DEPARTURE_AUTHORIZED",
          entityType: "PERMIT",
          entityId: String(current.id),
          outcome: "SUCCESS",
          source: "permit.signed-document-upload",
          before: {
            folio: current.folio,
            employeeId: current.employeeId,
            equipmentId: current.equipmentId,
            status: current.status,
            departureAuthorized: false,
          },
          after: {
            folio: current.folio,
            employeeId: current.employeeId,
            equipmentId: current.equipmentId,
            status: current.status,
            departureAuthorized: true,
          },
        })
      }
    })
  } catch (error) {
    if (ownsCreatedFile) {
      await removeSignedPermitPdfIfUnreferenced(relativePath, outputPath)
    }
    throw error
  }

  return {
    fileName,
    outputPath,
    relativePath,
  }
}

async function removeSignedPermitPdfIfUnreferenced(
  relativePath: string,
  absolutePath: string,
) {
  try {
    const reference = await prisma.permit.findFirst({
      where: { signedPdfPath: relativePath },
      select: { id: true },
    })

    if (!reference) await unlink(absolutePath)
  } catch {
    // Preserve the file if its database reference cannot be checked safely.
  }
}
