import ExcelJS from "exceljs"
import path from "path"
import fs from "fs/promises"
import { execFile } from "child_process"
import { promisify } from "util"

import { BusinessError } from "@/services/shared/errors"
import { ensureDirectory } from "@/services/shared/storage"

import { findPermitById, updatePermitGeneratedDocument } from "./repository"

const execFileAsync = promisify(execFile)

function formatDate(date: Date) {
  return date.toLocaleDateString("es-MX")
}

export async function generatePermitDocument(permitId: number) {
  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  const workbook = new ExcelJS.Workbook()

  const templatePath = path.join(
    process.cwd(),
    "storage",
    "templates",
    "SALIDA.xlsx",
  )

  await workbook.xlsx.readFile(templatePath)

  const worksheet = workbook.getWorksheet("FORMATO_SALIDA")

  if (!worksheet) {
    throw new BusinessError(
      "No se encontró la hoja FORMATO_SALIDA en la plantilla.",
    )
  }

  /*
   * DATOS DEL PERMISO
   */

  worksheet.getCell("H2").value = permit.folio

  /*
   * DATOS DEL SOLICITANTE
   */

  worksheet.getCell("C4").value = permit.employee.sapNumber

  worksheet.getCell("C5").value =
    `${permit.employee.firstName} ${permit.employee.lastName}`

  worksheet.getCell("C6").value = permit.employee.position ?? ""

  worksheet.getCell("C7").value = permit.employee.department ?? ""

  /*
   * DATOS DEL EQUIPO
   */

  worksheet.getCell("C9").value = permit.equipment.serialNumber ?? ""

  worksheet.getCell("G9").value = permit.equipment.assetTag

  worksheet.getCell("C10").value = permit.equipment.model ?? ""

  worksheet.getCell("G10").value = permit.equipment.brand ?? ""

  worksheet.getCell("C11").value = permit.equipment.type ?? ""

  /*
   * VIGENCIA
   */

  worksheet.getCell("C12").value =
    `${formatDate(permit.startDate)} al ${formatDate(
      permit.expirationDate,
    )}`

  /*
   * DIRECTORIOS
   */

  const generatedDir = await ensureDirectory("permits/generated")

  const temporaryDir = await ensureDirectory("permits/temp")

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  const safeFolio = permit.folio.replace(/[^a-zA-Z0-9-_]/g, "-")

  const excelFileName = `PERM-${safeFolio}-${timestamp}.xlsx`

  const excelPath = path.join(temporaryDir, excelFileName)

  /*
   * GENERAR EXCEL TEMPORAL
   */

  await workbook.xlsx.writeFile(excelPath)

  /*
   * CONVERTIR A PDF
   */

  try {
    await execFileAsync("libreoffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      generatedDir,
      excelPath,
    ])
  } catch (error) {
    console.error(error)

    throw new BusinessError(
      "No se pudo convertir el formato a PDF. Verifica que LibreOffice esté instalado.",
    )
  } finally {
    await fs.unlink(excelPath).catch(() => {})
  }

  const pdfFileName = excelFileName.replace(".xlsx", ".pdf")

  const pdfPath = path.join(generatedDir, pdfFileName)

  try {
    await fs.access(pdfPath)
  } catch {
    throw new BusinessError("No se pudo generar el PDF del permiso.")
  }

  const relativePath = path.join(
    "permits",
    "generated",
    pdfFileName,
  )

  await updatePermitGeneratedDocument(permit.id, relativePath)

  return {
    fileName: pdfFileName,
    outputPath: pdfPath,
    relativePath,
  }
}