import ExcelJS from "exceljs"
import path from "path"

import { prisma } from "@/lib/prisma"

import { ensureDirectory } from "../shared/storage"
import { convertExcelToPdf } from "../shared/pdf"

export async function generateAssignmentDocument(assignmentId: number) {
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

  //I.- DATOS DEL SOLICITANTE
  worksheet.getCell("H10").value =
    `${assignment.employee.firstName} ${assignment.employee.lastName}`

  worksheet.getCell("Z10").value =
    assignment.assignedAt.toLocaleDateString("es-MX")
  worksheet.getCell("AE10").value =
    assignment.assignedAt.toLocaleDateString("es-MX")

  worksheet.getCell("F12").value = assignment.employee.department ?? ""
  worksheet.getCell("Z12").value = assignment.employee.sapNumber
  worksheet.getCell("AE12").value = assignment.equipment.type ?? ""

  //II.- INFORMACIÓN DEL EQUIPO SOLICITADO
  worksheet.getCell("C16").value = 1
  worksheet.getCell("E16").value = assignment.equipment.type ?? ""
  worksheet.getCell("N16").value = assignment.equipment.brand ?? ""
  worksheet.getCell("Q16").value = assignment.equipment.model ?? ""
  worksheet.getCell("T16").value = assignment.equipment.serialNumber ?? ""
  worksheet.getCell("X16").value = assignment.equipment.assetTag
  worksheet.getCell("AB16").value = assignment.equipment.inventoryNumber ?? ""

  //III.- INFORMACIÓN DEL EQUIPO ASIGNADO
  worksheet.getCell("C24").value = 1
  worksheet.getCell("E24").value = assignment.equipment.type ?? ""
  worksheet.getCell("N24").value = assignment.equipment.brand ?? ""
  worksheet.getCell("Q24").value = assignment.equipment.model ?? ""
  worksheet.getCell("T24").value = assignment.equipment.serialNumber ?? ""
  worksheet.getCell("X24").value = assignment.equipment.assetTag
  worksheet.getCell("AB24").value = assignment.equipment.inventoryNumber ?? ""

  const controlSheet = workbook.getWorksheet("Control de cambios")

  if (controlSheet) {
    workbook.removeWorksheet(controlSheet.id)
  }

  const outputDir = await ensureDirectory("assignments/generated")
  const timestamp = new Date().toISOString().replace(/[:]/g, "-")
  const excelName = `RESP-${assignment.employee.sapNumber}-${timestamp}.xlsx`
  const excelPath = path.join(outputDir, excelName)
  await workbook.xlsx.writeFile(excelPath)
  const pdfPath = await convertExcelToPdf(excelPath)
  const relativePdfPath = path.join(
    "assignments",
    "generated",
    path.basename(pdfPath),
  )

  await prisma.assignment.update({
    where: {
      id: assignment.id,
    },
    data: {
      generatedPdfPath: relativePdfPath,
    },
  })

  return relativePdfPath
}
