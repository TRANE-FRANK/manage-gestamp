import "server-only"

import ExcelJS from "exceljs"
import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"
import {
  applyMaintenanceActivityLayout,
  getMaintenanceTemplateSheetName,
} from "@/services/maintenance/document-template"
import { convertExcelToPdf } from "@/services/shared/pdf"
import { BusinessError, NotFoundError } from "@/services/shared/errors"

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "storage",
  "templates",
  "maintenance",
  "MTTO_REALIZADOS_DESKTOPS1.xlsx",
)

const GENERATED_DIRECTORY = path.join("maintenance", "generated")

type MaintenanceDocumentSource = {
  id: number
  generatedPdfPath: string | null
  equipment: {
    type: "LAPTOP" | "DESKTOP" | "PRINTER" | "SMARTPHONE" | "TABLET" | "RADIO" | null
    inventoryNumber: string | null
    assetTag: string | null
    serialNumber: string | null
    brand: string | null
    model: string | null
  }
}

function getEquipmentDescription(equipment: MaintenanceDocumentSource["equipment"]) {
  const typeLabel = equipment.type === "PRINTER" ? "IMPRESORA" : equipment.type
  return [
    typeLabel,
    equipment.brand,
    equipment.model,
    //equipment.inventoryNumber ? `Inventario: ${equipment.inventoryNumber}` : null,
    equipment.assetTag ? `Asset tag: ${equipment.assetTag}` : null,
    equipment.serialNumber ? `Serie: ${equipment.serialNumber}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" - ")
}

function fillMaintenanceSheet(
  worksheet: ExcelJS.Worksheet,
  maintenance: MaintenanceDocumentSource,
) {
  // The official template has no effective-maintenance-date field. Its request
  // and delivery dates must remain blank rather than being inferred.
  worksheet.getCell("C7").value = null
  worksheet.getCell("C8").value = null
  worksheet.getCell("C9").value = getEquipmentDescription(maintenance.equipment)
  worksheet.getCell("C9").alignment = {
    ...worksheet.getCell("C9").alignment,
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  }
  worksheet.getCell("C10").value = null
  worksheet.getCell("C11").value = null
  worksheet.getCell("C12").value = null
  worksheet.getCell("C13").value = null
}

function getGeneratedFilePath(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/")
  const segments = normalized.split("/")

  if (
    path.posix.isAbsolute(normalized) ||
    segments.length !== 3 ||
    segments[0] !== "maintenance" ||
    segments[1] !== "generated" ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    path.posix.extname(segments[2]).toLowerCase() !== ".pdf"
  ) {
    throw new BusinessError("La ruta del formato no es válida.")
  }

  const generatedRoot = path.resolve(
    process.cwd(),
    "storage",
    GENERATED_DIRECTORY,
  )
  const absolutePath = path.resolve(generatedRoot, segments[2])
  const relativeToRoot = path.relative(generatedRoot, absolutePath)

  if (
    !relativeToRoot ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    relativeToRoot === ".." ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new BusinessError("La ruta del formato no es válida.")
  }

  return { absolutePath, generatedRoot }
}

async function readPrivateGeneratedPdf(relativePath: string) {
  const { absolutePath, generatedRoot } = getGeneratedFilePath(relativePath)

  try {
    const [realRoot, realFile] = await Promise.all([
      fs.realpath(generatedRoot),
      fs.realpath(absolutePath),
    ])
    const relativeRealPath = path.relative(realRoot, realFile)

    if (
      !relativeRealPath ||
      relativeRealPath.startsWith(`..${path.sep}`) ||
      relativeRealPath === ".." ||
      path.isAbsolute(relativeRealPath)
    ) {
      throw new BusinessError("La ruta del formato no es válida.")
    }

    const stats = await fs.stat(realFile)
    if (!stats.isFile()) {
      throw new NotFoundError("No se encontró el formato imprimible.")
    }

    return Buffer.from(await fs.readFile(realFile))
  } catch (error) {
    if (error instanceof BusinessError) throw error
    throw new NotFoundError("No se encontró el formato imprimible.")
  }
}

async function removeGeneratedFileIfUnreferenced(
  relativePath: string,
  absolutePath: string,
) {
  try {
    const reference = await prisma.maintenance.findFirst({
      where: { generatedPdfPath: relativePath },
      select: { id: true },
    })

    if (!reference) await fs.unlink(absolutePath)
  } catch {
    // Preserve the file if the reference cannot be checked safely.
  }
}

export async function generateMaintenanceDocument(maintenanceId: number) {
  await requireRole("ADMIN", "IT")

  if (!Number.isSafeInteger(maintenanceId) || maintenanceId <= 0) {
    throw new NotFoundError("El mantenimiento no existe.")
  }

  const maintenance = (await prisma.maintenance.findUnique({
    where: { id: maintenanceId },
    select: {
      id: true,
      generatedPdfPath: true,
      equipment: {
        select: {
          type: true,
          inventoryNumber: true,
          assetTag: true,
          serialNumber: true,
          brand: true,
          model: true,
        },
      },
    },
  })) as MaintenanceDocumentSource | null

  if (!maintenance) throw new NotFoundError("El mantenimiento no existe.")

  if (maintenance.generatedPdfPath) {
    await readPrivateGeneratedPdf(maintenance.generatedPdfPath)
    return maintenance.generatedPdfPath
  }

  const selectedSheetName = getMaintenanceTemplateSheetName(
    maintenance.equipment.type,
  )

  if (!selectedSheetName) {
    throw new BusinessError(
      "No hay un formato imprimible para el tipo de equipo de este mantenimiento.",
    )
  }

  const workbook = new ExcelJS.Workbook()
  const templateBytes = await fs.readFile(TEMPLATE_PATH)
  await workbook.xlsx.load(
    templateBytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
  )

  const worksheet = workbook.getWorksheet(selectedSheetName)
  if (!worksheet) {
    throw new BusinessError(
      "No se encontró la hoja oficial correspondiente al tipo de equipo.",
    )
  }

  fillMaintenanceSheet(worksheet, maintenance)
  applyMaintenanceActivityLayout(worksheet)

  // The supplied workbook also contains inventory and change-control sheets.
  // Keep only the applicable official format in the generated PDF.
  for (const sheet of [...workbook.worksheets]) {
    if (sheet.id !== worksheet.id) workbook.removeWorksheet(sheet.id)
  }

  const generatedRoot = path.resolve(
    process.cwd(),
    "storage",
    GENERATED_DIRECTORY,
  )
  await fs.mkdir(generatedRoot, { recursive: true })
  const temporaryDirectory = await fs.mkdtemp(
    path.join(generatedRoot, ".maintenance-"),
  )
  const temporaryWorkbookPath = path.join(temporaryDirectory, "format.xlsx")
  const fileName = `maintenance-${maintenance.id}-${randomUUID()}.pdf`
  const pdfPath = path.join(generatedRoot, fileName)
  const relativePdfPath = path.posix.join(
    GENERATED_DIRECTORY.split(path.sep).join("/"),
    fileName,
  )
  let ownsPdf = false

  try {
    await workbook.xlsx.writeFile(temporaryWorkbookPath)
    const temporaryPdfPath = await convertExcelToPdf(temporaryWorkbookPath)
    const pdfHandle = await fs.open(pdfPath, "wx")
    ownsPdf = true

    try {
      await pdfHandle.writeFile(await fs.readFile(temporaryPdfPath))
    } finally {
      await pdfHandle.close()
    }

    const result = await prisma.$transaction(async (tx) => {
      const update = await tx.maintenance.updateMany({
        where: { id: maintenance.id, generatedPdfPath: null },
        data: { generatedPdfPath: relativePdfPath },
      })

      if (update.count === 1) return { created: true as const }

      const current = await tx.maintenance.findUnique({
        where: { id: maintenance.id },
        select: { generatedPdfPath: true },
      })

      if (!current) throw new NotFoundError("El mantenimiento ya no existe.")
      if (!current.generatedPdfPath) {
        throw new BusinessError("No se pudo guardar el formato imprimible.")
      }

      return { created: false as const, path: current.generatedPdfPath }
    })

    if (!result.created) {
      await removeGeneratedFileIfUnreferenced(relativePdfPath, pdfPath)
      ownsPdf = false
      await readPrivateGeneratedPdf(result.path)
      return result.path
    }

    ownsPdf = false
    return relativePdfPath
  } catch (error) {
    if (ownsPdf) {
      await removeGeneratedFileIfUnreferenced(relativePdfPath, pdfPath)
    }
    throw error
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {})
  }
}

export async function getMaintenanceDocument(maintenanceId: number) {
  await requireRole("ADMIN", "IT")

  if (!Number.isSafeInteger(maintenanceId) || maintenanceId <= 0) {
    throw new NotFoundError("El mantenimiento no existe.")
  }

  const maintenance = await prisma.maintenance.findUnique({
    where: { id: maintenanceId },
    select: { id: true, generatedPdfPath: true },
  })

  if (!maintenance) throw new NotFoundError("El mantenimiento no existe.")
  if (!maintenance.generatedPdfPath) {
    throw new NotFoundError("El formato imprimible aún no se ha generado.")
  }

  return readPrivateGeneratedPdf(maintenance.generatedPdfPath)
}
