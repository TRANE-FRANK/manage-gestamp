import type { EquipmentType } from "@/generated/prisma/client"
import type ExcelJS from "exceljs"

export const MAINTENANCE_ACTIVITY_FIRST_ROW = 18
export const MAINTENANCE_ACTIVITY_LAST_ROW = 29
export const MAINTENANCE_ACTIVITY_ROW_HEIGHT = 48

const maintenanceTemplateSheets: Partial<Record<EquipmentType, string>> = {
  DESKTOP: "FORMATO_DESKTOP",
  LAPTOP: "FORMATO_LAPTOP",
  PRINTER: "FORMATO_IMPRESORA",
}

export function getMaintenanceTemplateSheetName(
  equipmentType: EquipmentType | null,
) {
  return equipmentType ? maintenanceTemplateSheets[equipmentType] : undefined
}

export function applyMaintenanceActivityLayout(worksheet: ExcelJS.Worksheet) {
  for (
    let rowNumber = MAINTENANCE_ACTIVITY_FIRST_ROW;
    rowNumber <= MAINTENANCE_ACTIVITY_LAST_ROW;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber)
    row.height = MAINTENANCE_ACTIVITY_ROW_HEIGHT

    const descriptionCell = worksheet.getCell(`C${rowNumber}`)
    descriptionCell.alignment = {
      ...descriptionCell.alignment,
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
      indent: 1,
    }
  }
}
