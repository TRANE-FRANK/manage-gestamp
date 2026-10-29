import ExcelJS from "exceljs"
import { describe, expect, it } from "vitest"

import {
  applyMaintenanceActivityLayout,
  getMaintenanceTemplateSheetName,
  MAINTENANCE_ACTIVITY_FIRST_ROW,
  MAINTENANCE_ACTIVITY_LAST_ROW,
  MAINTENANCE_ACTIVITY_ROW_HEIGHT,
} from "@/services/maintenance/document-template"

const templatePath =
  "storage/templates/maintenance/MTTO_REALIZADOS_DESKTOPS1.xlsx"

describe("formato impreso de actividades del mantenimiento", () => {
  it.each([
    ["DESKTOP", "FORMATO_DESKTOP"],
    ["LAPTOP", "FORMATO_LAPTOP"],
    ["PRINTER", "FORMATO_IMPRESORA"],
  ] as const)("conserva la plantilla de %s y sus actividades", async (type, sheetName) => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    const worksheet = workbook.getWorksheet(sheetName)

    expect(worksheet).toBeDefined()
    if (!worksheet) return

    const activityRows = Array.from(
      { length: MAINTENANCE_ACTIVITY_LAST_ROW - MAINTENANCE_ACTIVITY_FIRST_ROW + 1 },
      (_, index) => MAINTENANCE_ACTIVITY_FIRST_ROW + index,
    )
    const originalDescriptions = activityRows.map((row) =>
      worksheet.getCell(`C${row}`).text,
    )
    const originalPrintSetup = {
      paperSize: worksheet.pageSetup.paperSize,
      orientation: worksheet.pageSetup.orientation,
      fitToPage: worksheet.pageSetup.fitToPage,
      fitToWidth: worksheet.pageSetup.fitToWidth,
      fitToHeight: worksheet.pageSetup.fitToHeight,
      scale: worksheet.pageSetup.scale,
    }

    applyMaintenanceActivityLayout(worksheet)

    expect(
      activityRows.map((row) => worksheet.getCell(`C${row}`).text),
    ).toEqual(originalDescriptions)
    expect(worksheet.getCell("A17").text.trim()).toBe("OK")
    expect(worksheet.getCell("B17").text.trim()).toBe("NOK")
    for (const row of activityRows) {
      expect(worksheet.getCell(`A${row}`).value).toBeNull()
      expect(worksheet.getCell(`B${row}`).value).toBeNull()
      expect(worksheet.getRow(row).height).toBe(MAINTENANCE_ACTIVITY_ROW_HEIGHT)
      expect(worksheet.getCell(`C${row}`).alignment).toMatchObject({
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
        indent: 1,
      })
      expect(worksheet.getCell(`C${row}`).font.size).toBe(12)
    }
    expect(worksheet.getCell("C8").value).toBeNull()
    expect(worksheet.getCell("C13").value).toBeNull()
    expect({
      paperSize: worksheet.pageSetup.paperSize,
      orientation: worksheet.pageSetup.orientation,
      fitToPage: worksheet.pageSetup.fitToPage,
      fitToWidth: worksheet.pageSetup.fitToWidth,
      fitToHeight: worksheet.pageSetup.fitToHeight,
      scale: worksheet.pageSetup.scale,
    }).toEqual(originalPrintSetup)
  })

  it("asocia cada tipo soportado a la hoja oficial correspondiente", () => {
    expect(getMaintenanceTemplateSheetName("DESKTOP")).toBe("FORMATO_DESKTOP")
    expect(getMaintenanceTemplateSheetName("LAPTOP")).toBe("FORMATO_LAPTOP")
    expect(getMaintenanceTemplateSheetName("PRINTER")).toBe("FORMATO_IMPRESORA")
  })
})
