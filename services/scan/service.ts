import {
  createScanLog,
  findEquipmentByAssetTag,
  findLatestPermitByEquipmentId,
  findScanLogs,
  getScanLogStats,
  getAllowedScansByEquipment,
  getAllowedScansByEmployee,
  getScanReasonStats,
} from "./repository"

import type {
  AuthorizedScanResult,
  ScanEquipmentInput,
  ScanEquipmentResult,
  SecurityScanEquipmentResult,
} from "./types"
import { requireRole } from "@/lib/auth/authorization"
import { parseScanEquipmentInput } from "./input"
import { prisma } from "@/lib/prisma"
import { writeAuditEvent, type AuditActor } from "@/services/audit/service"

async function recordScanResult(
  data: Parameters<typeof createScanLog>[0],
  actor: AuditActor,
) {
  return prisma.$transaction(async (tx) => {
    const scanLog = await createScanLog(data, tx)

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_SCAN_EXECUTED",
      entityType: "SCAN_LOG",
      entityId: String(scanLog.id),
      outcome: "SUCCESS",
      source: "permit.scan",
      after: {
        scannedAt: scanLog.scannedAt.toISOString(),
        result: scanLog.result,
        scanReason: scanLog.reason,
      },
    })

    return scanLog
  })
}

function getEquipmentIdentifier(equipment: {
  assetTag: string | null
  barcode: string | null
  inventoryNumber: string | null
}) {
  return (
    equipment.assetTag ??
    equipment.barcode ??
    equipment.inventoryNumber ??
    "SIN-IDENTIFICADOR"
  )
}

function buildPermitResult(
  permit: NonNullable<
    Awaited<ReturnType<typeof findLatestPermitByEquipmentId>>
  >,
  allowed: boolean,
  result: "ALLOWED" | "DENIED",
  message: string,
): ScanEquipmentResult {
  return {
    allowed,
    result,
    message,

    equipment: {
      id: permit.equipment.id,
      assetTag: getEquipmentIdentifier(permit.equipment),
      company: permit.equipment.company,
    },

    permit: {
      id: permit.id,
      folio: permit.folio,
      status: permit.status,
      startDate: permit.startDate,
      expirationDate: permit.expirationDate,
      cancelledAt: permit.cancelledAt,
      cancellationReason: permit.cancellationReason,

      employee: {
        firstName: permit.employee.firstName,
        lastName: permit.employee.lastName,
        department: permit.employee.department,
      },
    },
  }
}

export async function scanEquipment(
  data: unknown,
): Promise<AuthorizedScanResult> {
  const user = await requireRole("ADMIN", "IT", "SECURITY")
  const result = await processEquipmentScan(parseScanEquipmentInput(data), user)
  return user.role === "SECURITY" ? toSecurityScanResult(result) : result
}

async function processEquipmentScan(
  data: ScanEquipmentInput,
  actor: AuditActor,
): Promise<ScanEquipmentResult> {
  const assetTag = data.assetTag

  const equipment = await findEquipmentByAssetTag(assetTag)

  if (!equipment) {
    await recordScanResult(
      {
        assetTag,
        result: "DENIED",
        reason: "EQUIPMENT_NOT_FOUND",
        notes: "El equipo no está registrado.",
      },
      actor,
    )

    return {
      allowed: false,
      result: "DENIED",
      message: "El equipo no está registrado.",
      equipment: null,
      permit: null,
    }
  }

  const equipmentIdentifier = getEquipmentIdentifier(equipment)

  const permit = await findLatestPermitByEquipmentId(equipment.id)

  /*
   * Equipo registrado pero sin permiso
   */
  if (!permit) {
    await recordScanResult(
      {
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "NO_PERMIT",
        notes: "El equipo no tiene ningún permiso registrado.",
      },
      actor,
    )

    return {
      allowed: false,
      result: "DENIED",
      message: "El equipo no tiene ningún permiso registrado.",

      equipment: {
        id: equipment.id,
        assetTag: equipmentIdentifier,
        company: equipment.company,
      },

      permit: null,
    }
  }

  /*
   * Resultado base
   */
  const permitResult = buildPermitResult(permit, false, "DENIED", "")

  /*
   * Permiso cancelado
   */
  if (permit.status === "CANCELLED") {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "CANCELLED",
        notes: "El permiso está cancelado.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "El permiso está cancelado.",
    }
  }

  /*
   * Permiso expirado por estado
   */
  if (permit.status === "EXPIRED") {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "EXPIRED",
        notes: "El permiso está expirado.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "El permiso está expirado.",
    }
  }

  /*
   * Normalizar fechas
   */
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const startDate = new Date(permit.startDate)

  startDate.setHours(0, 0, 0, 0)

  const expirationDate = new Date(permit.expirationDate)

  expirationDate.setHours(0, 0, 0, 0)

  /*
   * Permiso todavía no vigente
   */
  if (today < startDate) {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "NOT_STARTED",
        notes: "El permiso todavía no está vigente.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "El permiso todavía no está vigente.",
    }
  }

  /*
   * Permiso expirado por fecha
   */
  if (today > expirationDate) {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "EXPIRED",
        notes: "El permiso ha expirado.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "El permiso ha expirado.",
    }
  }

  /*
   * Permiso no activo
   */
  if (permit.status !== "ACTIVE") {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "NOT_ACTIVE",
        notes: "El permiso no está activo.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "El permiso no está activo.",
    }
  }

  /*
   * Salida no autorizada
   */
  if (!permit.departureAuthorized) {
    await recordScanResult(
      {
        permitId: permit.id,
        assetTag: equipmentIdentifier,
        result: "DENIED",
        reason: "NOT_ACTIVE",
        notes: "La salida del equipo todavía no ha sido autorizada.",
      },
      actor,
    )

    return {
      ...permitResult,
      message: "La salida del equipo todavía no ha sido autorizada.",
    }
  }

  /*
   * Salida autorizada
   */
  await recordScanResult(
    {
      permitId: permit.id,
      assetTag: equipmentIdentifier,
      result: "ALLOWED",
      reason: "ALLOWED",
      notes: "Salida autorizada.",
    },
    actor,
  )

  return buildPermitResult(permit, true, "ALLOWED", "Salida autorizada.")
}

function toSecurityScanResult(
  result: ScanEquipmentResult,
): SecurityScanEquipmentResult {
  return {
    allowed: result.allowed,
    result: result.result,
    message: result.message,
    equipment: result.equipment
      ? {
          assetTag: result.equipment.assetTag,
          company: result.equipment.company,
        }
      : null,
    permit: result.permit
      ? {
          folio: result.permit.folio,
          status: result.permit.status,
          startDate: result.permit.startDate,
          expirationDate: result.permit.expirationDate,
          employee: {
            firstName: result.permit.employee.firstName,
            lastName: result.permit.employee.lastName,
          },
        }
      : null,
  }
}

/*
 * Historial de escaneos
 */
export async function listScanLogs(filters?: {
  startDate?: Date
  endDate?: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
  page?: number
  pageSize?: number
}) {
  await requireRole("ADMIN", "IT", "SECURITY")
  return findScanLogs(filters)
}

export async function getScanStats(filters: {
  startDate: Date
  endDate: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
}) {
  await requireRole("ADMIN", "IT", "SECURITY")
  return getScanLogStats(filters)
}

export async function getEquipmentUsage(filters: {
  startDate: Date
  endDate: Date
  search?: string
}) {
  await requireRole("ADMIN", "IT", "SECURITY")
  const scans = await getAllowedScansByEquipment(
    filters.startDate,
    filters.endDate,
  )

  const usage = new Map<
    string,
    {
      assetTag: string
      employee: string
      count: number
    }
  >()

  for (const scan of scans) {
    const assetTag = scan.assetTag ?? scan.permit?.equipment.assetTag

    if (!assetTag) {
      continue
    }

    const employee = scan.permit
      ? `${scan.permit.employee.firstName} ${scan.permit.employee.lastName}`
      : "Sin empleado"

    const existing = usage.get(assetTag)

    if (existing) {
      existing.count += 1
      continue
    }

    usage.set(assetTag, {
      assetTag,
      employee,
      count: 1,
    })
  }

  return Array.from(usage.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function getEmployeeUsage(filters: {
  startDate: Date
  endDate: Date
  search?: string
}) {
  await requireRole("ADMIN", "IT", "SECURITY")
  const scans = await getAllowedScansByEmployee(filters)

  const usage = new Map<
    number,
    {
      employeeId: number
      employee: string
      count: number
    }
  >()

  for (const scan of scans) {
    const employee = scan.permit?.employee

    if (!employee) {
      continue
    }

    const existing = usage.get(employee.id)

    if (existing) {
      existing.count += 1
      continue
    }

    usage.set(employee.id, {
      employeeId: employee.id,
      employee: `${employee.firstName} ${employee.lastName}`,
      count: 1,
    })
  }

  return Array.from(usage.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function getValidationStats(filters: {
  startDate: Date
  endDate: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
}) {
  await requireRole("ADMIN", "IT", "SECURITY")
  const stats = await getScanReasonStats(filters)

  return stats.map((item) => ({
    reason: item.reason,
    count: item._count.reason,
  }))
}
