import ExcelJS from "exceljs"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"

import { equipmentTypeConfig } from "@/lib/equipment/config"
import { BusinessError } from "@/services/shared/errors"

import { ensureDirectory } from "../shared/storage"
import { convertExcelToPdf } from "../shared/pdf"

export async function generateAssignmentDocument(assignmentId: number) {
  await requireRole("ADMIN", "IT")

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },

    include: {
      employee: true,
      equipment: true,
    },
  })

  if (!assignment) {
    throw new Error("Asignación no encontrada.")
  }

  if (assignment.returnedAt !== null || assignment.cancelledAt !== null) {
    throw new BusinessError(
      "No se puede generar una responsiva para una asignación cerrada.",
    )
  }

  const equipmentType = assignment.equipment.type

  if (!equipmentType) {
    throw new BusinessError("El equipo no tiene un tipo asignado.")
  }

  const typeConfig = equipmentTypeConfig[equipmentType]

  if (!typeConfig.hasResponsiva) {
    throw new BusinessError("Este tipo de equipo no requiere una responsiva.")
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(
    path.join(process.cwd(), "storage", "templates", "Responsiva.xlsx"),
  )

  const worksheet = workbook.getWorksheet("R-091-SI")

  if (!worksheet) {
    throw new Error("No se encontró la hoja.")
  }

  worksheet.pageSetup = {
    paperSize: 9,
    orientation: "portrait",

    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,

    printArea: "A1:AH34",

    horizontalCentered: true,
    verticalCentered: true,

    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.3,
      bottom: 0.3,
      header: 0.2,
      footer: 0.2,
    },
  }

  // I.- DATOS DEL SOLICITANTE

  worksheet.getCell("H10").value =
    `${assignment.employee.firstName} ${assignment.employee.lastName}`

  worksheet.getCell("Z10").value =
    assignment.assignedAt.toLocaleDateString("es-MX")

  worksheet.getCell("AE10").value =
    assignment.assignedAt.toLocaleDateString("es-MX")

  worksheet.getCell("F12").value = assignment.employee.department ?? ""

  worksheet.getCell("Z12").value = assignment.employee.sapNumber

  worksheet.getCell("AE12").value = assignment.equipment.type ?? ""

  // II.- INFORMACIÓN DEL EQUIPO SOLICITADO

  worksheet.getCell("C16").value = 1
  worksheet.getCell("E16").value = assignment.equipment.type ?? ""

  worksheet.getCell("N16").value = assignment.equipment.brand ?? ""

  worksheet.getCell("Q16").value = assignment.equipment.model ?? ""

  worksheet.getCell("T16").value = assignment.equipment.serialNumber ?? ""

  worksheet.getCell("X16").value = assignment.equipment.assetTag ?? ""

  worksheet.getCell("AB16").value = assignment.equipment.inventoryNumber ?? ""

  // III.- INFORMACIÓN DEL EQUIPO ASIGNADO

  worksheet.getCell("C24").value = 1
  worksheet.getCell("E24").value = assignment.equipment.type ?? ""

  worksheet.getCell("N24").value = assignment.equipment.brand ?? ""

  worksheet.getCell("Q24").value = assignment.equipment.model ?? ""

  worksheet.getCell("T24").value = assignment.equipment.serialNumber ?? ""

  worksheet.getCell("X24").value = assignment.equipment.assetTag ?? ""

  worksheet.getCell("AB24").value = assignment.equipment.inventoryNumber ?? ""

  const controlSheet = workbook.getWorksheet("Control de cambios")

  if (controlSheet) {
    workbook.removeWorksheet(controlSheet.id)
  }

  const outputDir = await ensureDirectory("assignments/generated")
  const timestamp = new Date().toISOString().replace(/[:]/g, "-")
  const uniqueName = `RESP-${assignment.employee.sapNumber}-${timestamp}-${randomUUID()}`
  const temporaryDir = await fs.mkdtemp(path.join(outputDir, ".assignment-"))
  const excelPath = path.join(temporaryDir, `${uniqueName}.xlsx`)
  const pdfName = `${uniqueName}.pdf`
  const pdfPath = path.join(outputDir, pdfName)
  const relativePdfPath = path.join("assignments", "generated", pdfName)
  let ownsPdf = false
  let databaseWritePending = false

  try {
    await workbook.xlsx.writeFile(excelPath)
    const temporaryPdfPath = await convertExcelToPdf(excelPath)
    const pdfHandle = await fs.open(pdfPath, "wx")
    ownsPdf = true

    try {
      await pdfHandle.writeFile(await fs.readFile(temporaryPdfPath))
    } finally {
      await pdfHandle.close()
    }

    databaseWritePending = true
    const assignmentUpdate = await prisma.assignment.updateMany({
      where: {
        id: assignment.id,
        returnedAt: null,
        cancelledAt: null,
      },
      data: {
        generatedPdfPath: relativePdfPath,
      },
    })
    databaseWritePending = false

    if (assignmentUpdate.count === 0) {
      throw new BusinessError(
        "No se puede generar una responsiva para una asignación cerrada.",
      )
    }

    ownsPdf = false
    return relativePdfPath
  } catch (error) {
    if (ownsPdf && !databaseWritePending) {
      await removeGeneratedPdfIfUnreferenced(relativePdfPath, pdfPath)
    }

    throw error
  } finally {
    await fs.rm(temporaryDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function removeGeneratedPdfIfUnreferenced(
  relativePath: string,
  absolutePath: string,
) {
  try {
    const reference = await prisma.assignment.findFirst({
      where: { generatedPdfPath: relativePath },
      select: { id: true },
    })

    if (!reference) {
      await fs.unlink(absolutePath)
    }
  } catch {
    // Keep the file if its database reference cannot be checked safely.
  }
}
