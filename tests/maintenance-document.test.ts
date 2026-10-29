import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  requireRoleMock,
  maintenanceFindUniqueMock,
  maintenanceFindFirstMock,
  maintenanceUpdateManyMock,
  transactionMock,
  fsMock,
  convertExcelToPdfMock,
  workbook,
  worksheets,
  cellsBySheet,
} = vi.hoisted(() => {
  const cellsBySheet = new Map<
    string,
    Record<
      string,
      { value: unknown; alignment: Record<string, unknown>; font?: { size?: number } }
    >
  >()
  const worksheets = ["FORMATO_DESKTOP", "FORMATO_LAPTOP", "FORMATO_IMPRESORA", "EQUIPOS", "Control de cambios"].map(
    (name, index) => {
      const cells: Record<
        string,
        { value: unknown; alignment: Record<string, unknown>; font?: { size?: number } }
      > = {}
      cellsBySheet.set(name, cells)
      const rows = new Map(
        Array.from({ length: 12 }, (_, offset) => [18 + offset, { height: 36 }]),
      )
      return {
        id: index + 1,
        name,
        cells,
        rows,
        pageSetup: {
          paperSize: 1,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          scale: 62,
        },
        getCell: (address: string) => {
          cells[address] ??= {
            value: `plantilla:${address}`,
            alignment: {},
            font: { size: 12 },
          }
          return cells[address]
        },
        getRow: (rowNumber: number) => rows.get(rowNumber) ?? { height: undefined },
      }
    },
  )
  const workbook = {
    worksheets: [...worksheets],
    xlsx: { load: vi.fn(), writeFile: vi.fn() },
    getWorksheet: vi.fn((name: string) => workbook.worksheets.find((sheet) => sheet.name === name)),
    removeWorksheet: vi.fn((id: number) => {
      const index = workbook.worksheets.findIndex((sheet) => sheet.id === id)
      if (index >= 0) workbook.worksheets.splice(index, 1)
    }),
  }
  return {
    requireRoleMock: vi.fn(),
    maintenanceFindUniqueMock: vi.fn(),
    maintenanceFindFirstMock: vi.fn(),
    maintenanceUpdateManyMock: vi.fn(),
    transactionMock: vi.fn(),
    fsMock: {
      readFile: vi.fn(),
      mkdir: vi.fn(),
      mkdtemp: vi.fn(),
      open: vi.fn(),
      rm: vi.fn(),
      unlink: vi.fn(),
      realpath: vi.fn(),
      stat: vi.fn(),
    },
    convertExcelToPdfMock: vi.fn(),
    workbook,
    worksheets,
    cellsBySheet,
  }
})

vi.mock("server-only", () => ({}))
vi.mock("@/lib/auth/authorization", () => ({ requireRole: requireRoleMock }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    maintenance: {
      findUnique: maintenanceFindUniqueMock,
      findFirst: maintenanceFindFirstMock,
    },
    $transaction: transactionMock,
  },
}))
vi.mock("node:fs/promises", () => ({ default: fsMock }))
vi.mock("@/services/shared/pdf", () => ({ convertExcelToPdf: convertExcelToPdfMock }))
vi.mock("exceljs", () => ({
  default: {
    Workbook: class {
      constructor() {
        return workbook
      }
    },
  },
}))

import { getMaintenanceTemplateSheetName } from "@/services/maintenance/document-template"
import {
  generateMaintenanceDocument,
  getMaintenanceDocument,
} from "@/services/maintenance/document"

const record = {
  id: 81,
  generatedPdfPath: null,
  equipment: {
    type: "LAPTOP",
    inventoryNumber: "INV-81",
    assetTag: "TAG-81",
    serialNumber: "SER-81",
    brand: "Marca",
    model: "Modelo",
  },
}

function resetWorkbook() {
  workbook.worksheets.splice(0, workbook.worksheets.length, ...worksheets)
  cellsBySheet.clear()
  for (const sheet of worksheets) {
    for (const key of Object.keys(sheet.cells)) delete sheet.cells[key]
    cellsBySheet.set(sheet.name, sheet.cells)
    for (const row of sheet.rows.values()) row.height = 36
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetWorkbook()
  requireRoleMock.mockResolvedValue({ id: 7, username: "it.operator", role: "IT" })
  maintenanceFindUniqueMock.mockResolvedValue(record)
  maintenanceFindFirstMock.mockResolvedValue(null)
  maintenanceUpdateManyMock.mockResolvedValue({ count: 1 })
  transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      maintenance: {
        updateMany: maintenanceUpdateManyMock,
        findUnique: maintenanceFindUniqueMock,
      },
    }),
  )
  fsMock.readFile.mockResolvedValue(Buffer.from("pdf"))
  fsMock.mkdir.mockResolvedValue(undefined)
  fsMock.mkdtemp.mockResolvedValue("/private/storage/maintenance/generated/.maintenance-tmp")
  fsMock.open.mockResolvedValue({
    writeFile: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })
  fsMock.rm.mockResolvedValue(undefined)
  fsMock.unlink.mockResolvedValue(undefined)
  convertExcelToPdfMock.mockResolvedValue(
    "/private/storage/maintenance/generated/.maintenance-tmp/format.pdf",
  )
  workbook.xlsx.load.mockResolvedValue(undefined)
  workbook.xlsx.writeFile.mockResolvedValue(undefined)
})

describe("documentos imprimibles de mantenimiento", () => {
  it.each([
    ["DESKTOP", "FORMATO_DESKTOP"],
    ["LAPTOP", "FORMATO_LAPTOP"],
    ["PRINTER", "FORMATO_IMPRESORA"],
  ] as const)("selecciona la hoja %s correspondiente", (type, sheet) => {
    expect(getMaintenanceTemplateSheetName(type)).toBe(sheet)
  })

  it("no asigna una hoja de formato a tipos no cubiertos", () => {
    expect(getMaintenanceTemplateSheetName("SMARTPHONE")).toBeUndefined()
    expect(getMaintenanceTemplateSheetName(null)).toBeUndefined()
  })

  it("requiere ADMIN o IT antes de consultar el mantenimiento", async () => {
    const denied = new Error("forbidden")
    requireRoleMock.mockRejectedValue(denied)

    await expect(generateMaintenanceDocument(81)).rejects.toBe(denied)
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT")
    expect(maintenanceFindUniqueMock).not.toHaveBeenCalled()
  })

  it("rellena solo la identificación disponible y deja vacíos los datos que faltan", async () => {
    await generateMaintenanceDocument(81)

    const laptopCells = cellsBySheet.get("FORMATO_LAPTOP")!
    expect(workbook.getWorksheet).toHaveBeenCalledWith("FORMATO_LAPTOP")
    expect(laptopCells.C9.value).toContain("LAPTOP")
    expect(laptopCells.C9.value).toContain("INV-81")
    expect(laptopCells.C9.value).toContain("SER-81")
    for (const address of ["C7", "C8", "C10", "C11", "C12", "C13"]) {
      expect(laptopCells[address]?.value).toBeNull()
    }
    expect(laptopCells.A18).toBeUndefined()
    expect(laptopCells.B18).toBeUndefined()
    expect(laptopCells.C18.value).toBe("plantilla:C18")
    expect(laptopCells.C18.font).toEqual({ size: 12 })
    for (let rowNumber = 18; rowNumber <= 29; rowNumber += 1) {
      expect(worksheets[1]?.rows.get(rowNumber)?.height).toBe(48)
      expect(laptopCells[`C${rowNumber}`]?.alignment).toMatchObject({
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
        indent: 1,
      })
      expect(laptopCells[`A${rowNumber}`]).toBeUndefined()
      expect(laptopCells[`B${rowNumber}`]).toBeUndefined()
    }
    expect(worksheets[1]?.pageSetup).toEqual({
      paperSize: 1,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      scale: 62,
    })
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["FORMATO_LAPTOP"])
    expect(maintenanceUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 81, generatedPdfPath: null },
        data: { generatedPdfPath: expect.stringMatching(/^maintenance\/generated\/maintenance-81-.+\.pdf$/) },
      }),
    )
  })

  it("no infiere equipo, solicitante, ubicación ni técnico desde campos no relacionados", async () => {
    maintenanceFindUniqueMock.mockResolvedValueOnce({
      ...record,
      equipment: {
        type: "DESKTOP",
        inventoryNumber: null,
        assetTag: null,
        serialNumber: null,
        brand: null,
        model: null,
      },
    })

    await generateMaintenanceDocument(81)

    expect(cellsBySheet.get("FORMATO_DESKTOP")!.C9.value).toBe("DESKTOP")
    expect(cellsBySheet.get("FORMATO_DESKTOP")!.C8.value).toBeNull()
    expect(cellsBySheet.get("FORMATO_DESKTOP")!.C10.value).toBeNull()
    expect(cellsBySheet.get("FORMATO_DESKTOP")!.C13.value).toBeNull()
  })

  it("no intenta generar para un tipo sin hoja oficial", async () => {
    maintenanceFindUniqueMock.mockResolvedValueOnce({
      ...record,
      equipment: { ...record.equipment, type: "SMARTPHONE" },
    })

    await expect(generateMaintenanceDocument(81)).rejects.toThrow(
      "No hay un formato imprimible",
    )
    expect(workbook.xlsx.load).not.toHaveBeenCalled()
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it("propaga los errores de lectura o conversión sin guardar una ruta", async () => {
    fsMock.readFile.mockRejectedValueOnce(new Error("template unavailable"))

    await expect(generateMaintenanceDocument(81)).rejects.toThrow(
      "template unavailable",
    )
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it("limpia únicamente el PDF propio si falla el guardado de su referencia", async () => {
    const databaseError = new Error("write failed")
    transactionMock.mockRejectedValueOnce(databaseError)
    maintenanceFindFirstMock.mockResolvedValueOnce(null)

    await expect(generateMaintenanceDocument(81)).rejects.toBe(databaseError)

    expect(maintenanceFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          generatedPdfPath: expect.stringMatching(
            /^maintenance\/generated\/maintenance-81-.+\.pdf$/,
          ),
        },
      }),
    )
    expect(fsMock.unlink).toHaveBeenCalledOnce()
    expect(fsMock.rm).toHaveBeenCalledWith(
      expect.stringContaining(".maintenance-"),
      { recursive: true, force: true },
    )
  })

  it("protege la consulta del PDF y rechaza rutas que salen del directorio privado", async () => {
    const denied = new Error("forbidden")
    requireRoleMock.mockRejectedValueOnce(denied)
    await expect(getMaintenanceDocument(81)).rejects.toBe(denied)
    expect(maintenanceFindUniqueMock).not.toHaveBeenCalled()

    requireRoleMock.mockResolvedValue({ id: 7, username: "it.operator", role: "IT" })
    maintenanceFindUniqueMock.mockResolvedValueOnce({
      id: 81,
      generatedPdfPath: "maintenance/generated/../../private.pdf",
    })
    await expect(getMaintenanceDocument(81)).rejects.toThrow(
      "La ruta del formato no es válida.",
    )
    expect(fsMock.readFile).not.toHaveBeenCalled()
  })
})
