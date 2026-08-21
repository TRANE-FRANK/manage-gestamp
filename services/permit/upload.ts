import path from "path"
import { writeFile } from "fs/promises"

import { BusinessError } from "@/services/shared/errors"
import { ensureDirectory } from "@/services/shared/storage"

import {
  findPermitById,
  updatePermitSignedDocument,
} from "./repository"

export async function uploadSignedPermitPdf(
  permitId: number,
  file: File,
) {
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

  await writeFile(outputPath, buffer)

  const relativePath = path.join("permits", "signed", fileName)

  await updatePermitSignedDocument(permit.id, relativePath)

  return {
    fileName,
    outputPath,
    relativePath,
  }
}