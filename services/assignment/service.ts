import { Prisma } from "@/generated/prisma/client"
import ExcelJS from "exceljs"
import path from "path"
import { ensureDirectory } from "../shared/storage"

import {
  findActiveAssignmentsByEmployeeId,
  findActiveAssignmentsPaginated,
  findAssignmentHistoryPaginated,
} from "./repository"

import type { ListAssignmentsInput } from "./types"

import { prisma } from "@/lib/prisma"

function buildAssignmentSearchWhere(
  search?: string,
): Prisma.AssignmentWhereInput {
  if (!search?.trim()) {
    return {}
  }

  const searchTerm = search.trim()

  const searchParts = searchTerm.split(/\s+/).filter(Boolean)

  return {
    OR: [
      {
        employee: {
          firstName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        employee: {
          lastName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        employee: {
          sapNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        equipment: {
          assetTag: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        equipment: {
          serialNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },

      ...searchParts.flatMap((part) => [
        {
          employee: {
            firstName: {
              contains: part,
              mode: "insensitive" as const,
            },
          },
        },
        {
          employee: {
            lastName: {
              contains: part,
              mode: "insensitive" as const,
            },
          },
        },
      ]),
    ],
  }
}

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
    throw new Error("Asignación no encontrada")
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(
    path.join(process.cwd(), "storage", "templates", "Responsiva.xlsx"),
  )

  const worksheet = workbook.getWorksheet("R-091-SI")

  if (!worksheet) {
    throw new Error("No se encontró la hoja")
  }

  /*
   * I.- DATOS DEL SOLICITANTE
   */

  worksheet.getCell("H10").value =
    `${assignment.employee.firstName} ${assignment.employee.lastName}` // Nombre del solicitante
  worksheet.getCell("Z10").value =
    assignment.assignedAt.toLocaleDateString("es-MX") // Fecha de asignación
  worksheet.getCell("AE10").value =
    assignment.assignedAt.toLocaleDateString("es-MX") // Fecha de retorno
  worksheet.getCell("F12").value = assignment.employee.department ?? "" // Departamento
  worksheet.getCell("Z12").value = assignment.employee.sapNumber // Número de SAP
  worksheet.getCell("AE12").value = assignment.equipment.type ?? "" // Tipo de equipo

  /*
   * II.- INFORMACIÓN DEL EQUIPO SOLICITADO
   */

  worksheet.getCell("C16").value = 1
  worksheet.getCell("E16").value = assignment.equipment.type ?? ""
  worksheet.getCell("N16").value = assignment.equipment.brand ?? ""
  worksheet.getCell("Q16").value = assignment.equipment.model ?? ""
  worksheet.getCell("T16").value = assignment.equipment.serialNumber ?? ""
  worksheet.getCell("X16").value = assignment.equipment.assetTag
  worksheet.getCell("AB16").value = assignment.equipment.inventoryNumber ?? ""

  /*
   * II.- INFORMACIÓN DEL EQUIPO ASIGNADO
   */

  worksheet.getCell("C24").value = 1
  worksheet.getCell("E24").value = assignment.equipment.type ?? ""
  worksheet.getCell("N24").value = assignment.equipment.brand ?? ""
  worksheet.getCell("Q24").value = assignment.equipment.model ?? ""
  worksheet.getCell("T24").value = assignment.equipment.serialNumber ?? ""
  worksheet.getCell("X24").value = assignment.equipment.assetTag
  worksheet.getCell("AB24").value = assignment.equipment.inventoryNumber ?? ""

  const outputDir = await ensureDirectory("assignments/generated")
  const timestamp = new Date().toISOString().replace(/[:,]/g, "-") // Formato de fecha y hora para nombre de archivo
  const fileName = `RESP-${assignment.employee.sapNumber}-${timestamp}.xlsx`
  const outputPath = path.join(outputDir, fileName)
  await workbook.xlsx.writeFile(outputPath)

  return {
    fileName,
    outputPath,
    relativePath: path.join("assignments", "generated", fileName),
  }
}

export async function getActiveAssignmentsByEmployeeId(employeeId: number) {
  return findActiveAssignmentsByEmployeeId(employeeId)
}

export async function listActiveAssignmentsPaginated({
  page = 1,
  pageSize = 20,
  search,
}: ListAssignmentsInput = {}) {
  const where = buildAssignmentSearchWhere(search)

  const result = await findActiveAssignmentsPaginated({
    page,
    pageSize,
    where,
  })

  return {
    ...result,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  }
}

export async function listAssignmentHistoryPaginated({
  page = 1,
  pageSize = 20,
  search,
}: ListAssignmentsInput = {}) {
  const where = buildAssignmentSearchWhere(search)

  const result = await findAssignmentHistoryPaginated({
    page,
    pageSize,
    where,
  })

  return {
    ...result,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  }
}
