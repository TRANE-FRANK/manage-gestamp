import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  requireRoleMock,
  createScanLogMock,
  transactionMock,
  writeAuditEventMock,
  transactionClient,
  findEquipmentByAssetTagMock,
  findLatestPermitByEquipmentIdMock,
  findScanLogsMock,
  getScanLogStatsMock,
  getAllowedScansByEquipmentMock,
  getAllowedScansByEmployeeMock,
  getScanReasonStatsMock,
} = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  createScanLogMock: vi.fn(),
  transactionMock: vi.fn(),
  writeAuditEventMock: vi.fn(),
  transactionClient: { scanLog: { create: vi.fn() }, auditEvent: { create: vi.fn() } },
  findEquipmentByAssetTagMock: vi.fn(),
  findLatestPermitByEquipmentIdMock: vi.fn(),
  findScanLogsMock: vi.fn(),
  getScanLogStatsMock: vi.fn(),
  getAllowedScansByEquipmentMock: vi.fn(),
  getAllowedScansByEmployeeMock: vi.fn(),
  getScanReasonStatsMock: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  AccessControlError: class AccessControlError extends Error {
    constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
      super(code)
    }
  },
  requireRole: requireRoleMock,
}))
vi.mock("@/services/scan/repository", () => ({
  createScanLog: createScanLogMock,
  findEquipmentByAssetTag: findEquipmentByAssetTagMock,
  findLatestPermitByEquipmentId: findLatestPermitByEquipmentIdMock,
  findScanLogs: findScanLogsMock,
  getScanLogStats: getScanLogStatsMock,
  getAllowedScansByEquipment: getAllowedScansByEquipmentMock,
  getAllowedScansByEmployee: getAllowedScansByEmployeeMock,
  getScanReasonStats: getScanReasonStatsMock,
}))
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: transactionMock },
}))
vi.mock("@/services/audit/service", () => ({
  writeAuditEvent: writeAuditEventMock,
}))

import {
  getEmployeeUsage,
  getEquipmentUsage,
  getScanStats,
  getValidationStats,
  listScanLogs,
  scanEquipment,
} from "@/services/scan/service"
import { ValidationError } from "@/services/shared/errors"
import { AccessControlError } from "@/lib/auth/authorization"

const permit = {
  id: 9,
  folio: "PERM-9",
  status: "ACTIVE" as const,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  expirationDate: new Date("2027-01-01T00:00:00.000Z"),
  cancelledAt: null,
  cancellationReason: null,
  departureAuthorized: true,
  employee: {
    firstName: "Elena",
    lastName: "Ejemplo",
    department: "Sistemas",
  },
  equipment: {
    id: 5,
    assetTag: "TAG-5",
    barcode: "TAG-5",
    inventoryNumber: "INV-5",
    company: "GP2",
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  requireRoleMock.mockResolvedValue({ id: 4, username: "operator", role: "IT" })
  findEquipmentByAssetTagMock.mockResolvedValue(permit.equipment)
  findLatestPermitByEquipmentIdMock.mockResolvedValue(permit)
  createScanLogMock.mockImplementation(async (data) => ({
    id: 1,
    scannedAt: new Date("2026-10-27T12:00:00.000Z"),
    permitId: data.permitId ?? null,
    assetTag: data.assetTag,
    result: data.result,
    reason: data.reason,
  }))
  transactionMock.mockImplementation(
    async (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  )
  writeAuditEventMock.mockResolvedValue({ id: 2 })
})

describe("servicio de escaneo autorizado", () => {
  it.each(["ADMIN", "IT", "SECURITY"])(
    "acepta el rol permitido %s",
    async (role) => {
      requireRoleMock.mockResolvedValue({ id: 4, username: "operator", role })

      const result = await scanEquipment({ assetTag: " TAG-5 " })

      expect(requireRoleMock).toHaveBeenCalledWith("ADMIN", "IT", "SECURITY")
      expect(findEquipmentByAssetTagMock).toHaveBeenCalledWith("TAG-5")
      expect(result.result).toBe("ALLOWED")
      expect(createScanLogMock).toHaveBeenCalledOnce()
      expect(createScanLogMock).toHaveBeenCalledWith(
        {
          permitId: 9,
          assetTag: "TAG-5",
          result: "ALLOWED",
          reason: "ALLOWED",
          notes: "Salida autorizada.",
        },
        transactionClient,
      )
      expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
        actor: { id: 4, username: "operator", role },
        action: "PERMIT_SCAN_EXECUTED",
        entityType: "SCAN_LOG",
        entityId: "1",
        outcome: "SUCCESS",
        source: "permit.scan",
        after: {
          scannedAt: "2026-10-27T12:00:00.000Z",
          result: "ALLOWED",
          scanReason: "ALLOWED",
        },
      })
    },
  )

  it("registra una sola vez un resultado denegado por equipo inexistente", async () => {
    findEquipmentByAssetTagMock.mockResolvedValue(null)

    const result = await scanEquipment({ assetTag: "UNKNOWN" })

    expect(result.result).toBe("DENIED")
    expect(createScanLogMock).toHaveBeenCalledOnce()
    expect(createScanLogMock).toHaveBeenCalledWith({
      assetTag: "UNKNOWN",
      result: "DENIED",
      reason: "EQUIPMENT_NOT_FOUND",
      notes: "El equipo no está registrado.",
    }, transactionClient)
    expect(writeAuditEventMock).toHaveBeenCalledWith(transactionClient, {
      actor: { id: 4, username: "operator", role: "IT" },
      action: "PERMIT_SCAN_EXECUTED",
      entityType: "SCAN_LOG",
      entityId: "1",
      outcome: "SUCCESS",
      source: "permit.scan",
      after: {
        scannedAt: "2026-10-27T12:00:00.000Z",
        result: "DENIED",
        scanReason: "EQUIPMENT_NOT_FOUND",
      },
    })
  })

  it("no devuelve un resultado si falla la escritura del ScanLog", async () => {
    const auditError = new Error("scan log insert failed")
    createScanLogMock.mockRejectedValue(auditError)
    findEquipmentByAssetTagMock.mockResolvedValue(null)

    await expect(scanEquipment({ assetTag: "UNKNOWN" })).rejects.toBe(
      auditError,
    )
    expect(createScanLogMock).toHaveBeenCalledOnce()
    expect(writeAuditEventMock).not.toHaveBeenCalled()
  })

  it("propaga un fallo de AuditEvent y no devuelve el resultado del escaneo", async () => {
    const auditError = new Error("audit event insert failed")
    writeAuditEventMock.mockRejectedValue(auditError)

    await expect(scanEquipment({ assetTag: "TAG-5" })).rejects.toBe(auditError)

    expect(createScanLogMock).toHaveBeenCalledOnce()
    expect(writeAuditEventMock).toHaveBeenCalledOnce()
  })

  it.each([
    ["sin cuerpo", null],
    ["campo ausente", {}],
    ["vacío", { assetTag: "  " }],
    ["tipo incorrecto", { assetTag: 123 }],
    ["demasiado largo", { assetTag: "X".repeat(101) }],
    ["caracteres de control", { assetTag: "TAG\u0000-5" }],
  ])("rechaza %s sin consultar ni escribir ScanLog", async (_label, input) => {
    await expect(scanEquipment(input)).rejects.toBeInstanceOf(ValidationError)

    expect(findEquipmentByAssetTagMock).not.toHaveBeenCalled()
    expect(findLatestPermitByEquipmentIdMock).not.toHaveBeenCalled()
    expect(createScanLogMock).not.toHaveBeenCalled()
    expect(writeAuditEventMock).not.toHaveBeenCalled()
  })

  it.each(["UNAUTHENTICATED", "FORBIDDEN"] as const)(
    "rechaza %s antes de leer o escribir escaneos",
    async (code) => {
      requireRoleMock.mockRejectedValue(new AccessControlError(code))

      await expect(scanEquipment({ assetTag: "TAG-5" })).rejects.toMatchObject({
        code,
      })

      expect(findEquipmentByAssetTagMock).not.toHaveBeenCalled()
      expect(findLatestPermitByEquipmentIdMock).not.toHaveBeenCalled()
      expect(createScanLogMock).not.toHaveBeenCalled()
      expect(writeAuditEventMock).not.toHaveBeenCalled()
    },
  )

  it.each(["UNAUTHENTICATED", "FORBIDDEN"] as const)(
    "rechaza %s en todos los servicios del historial antes de consultar ScanLog",
    async (code) => {
      requireRoleMock.mockRejectedValue(new AccessControlError(code))
      const filters = {
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-10-02T00:00:00.000Z"),
      }
      const reads = [
        () => listScanLogs(filters),
        () => getScanStats(filters),
        () => getEquipmentUsage(filters),
        () => getEmployeeUsage(filters),
        () => getValidationStats(filters),
      ]

      for (const read of reads) {
        await expect(read()).rejects.toMatchObject({ code })
      }

      expect(findScanLogsMock).not.toHaveBeenCalled()
      expect(getScanLogStatsMock).not.toHaveBeenCalled()
      expect(getAllowedScansByEquipmentMock).not.toHaveBeenCalled()
      expect(getAllowedScansByEmployeeMock).not.toHaveBeenCalled()
      expect(getScanReasonStatsMock).not.toHaveBeenCalled()
      expect(createScanLogMock).not.toHaveBeenCalled()
    },
  )

  it("limita la respuesta de SECURITY a los datos necesarios para verificar", async () => {
    requireRoleMock.mockResolvedValue({
      id: 4,
      username: "guard",
      role: "SECURITY",
    })

    const result = await scanEquipment({ assetTag: "TAG-5" })

    expect(result).toEqual({
      allowed: true,
      result: "ALLOWED",
      message: "Salida autorizada.",
      equipment: { assetTag: "TAG-5", company: "GP2" },
      permit: {
        folio: "PERM-9",
        status: "ACTIVE",
        startDate: permit.startDate,
        expirationDate: permit.expirationDate,
        employee: { firstName: "Elena", lastName: "Ejemplo" },
      },
    })
    expect(JSON.stringify(result)).not.toContain("Sistemas")
    expect(result.equipment).not.toHaveProperty("id")
    expect(result.permit).not.toHaveProperty("id")
    expect(result.permit).not.toHaveProperty("cancellationReason")
  })

  it.each(["ADMIN", "IT"])(
    "conserva los detalles administrativos para %s",
    async (role) => {
      requireRoleMock.mockResolvedValue({ id: 4, username: "admin", role })

      const result = await scanEquipment({ assetTag: "TAG-5" })

      expect(result.equipment).toHaveProperty("id", 5)
      expect(result.permit).toMatchObject({
        id: 9,
        cancellationReason: null,
        employee: { department: "Sistemas" },
      })
    },
  )
})
