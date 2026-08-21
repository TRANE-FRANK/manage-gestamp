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

import type { ScanEquipmentInput, ScanEquipmentResult } from "./types"

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
      assetTag: permit.equipment.assetTag,
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
  data: ScanEquipmentInput,
): Promise<ScanEquipmentResult> {
  const assetTag = data.assetTag.trim()

  /*
   * Asset Tag vacío
   */
  if (!assetTag) {
    await createScanLog({
      assetTag,
      result: "DENIED",
      reason: "INVALID_ASSET_TAG",
      notes: "No se proporcionó un Asset Tag.",
    })

    return {
      allowed: false,
      result: "DENIED",
      message: "Debes proporcionar el Asset Tag del equipo.",
      equipment: null,
      permit: null,
    }
  }

  /*
   * Buscar equipo
   */
  const equipment = await findEquipmentByAssetTag(assetTag)

  /*
   * Equipo no registrado
   */
  if (!equipment) {
    await createScanLog({
      assetTag,
      result: "DENIED",
      reason: "EQUIPMENT_NOT_FOUND",
      notes: "El equipo no está registrado.",
    })

    return {
      allowed: false,
      result: "DENIED",
      message: "El equipo no está registrado.",
      equipment: null,
      permit: null,
    }
  }

  /*
   * Buscar último permiso del equipo
   */
  const permit = await findLatestPermitByEquipmentId(equipment.id)

  /*
   * Equipo registrado pero sin permiso
   */
  if (!permit) {
    await createScanLog({
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "NO_PERMIT",
      notes: "El equipo no tiene ningún permiso registrado.",
    })

    return {
      allowed: false,
      result: "DENIED",
      message: "El equipo no tiene ningún permiso registrado.",

      equipment: {
        id: equipment.id,
        assetTag: equipment.assetTag,
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
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "CANCELLED",
      notes: "El permiso está cancelado.",
    })

    return {
      ...permitResult,
      message: "El permiso está cancelado.",
    }
  }

  /*
   * Permiso expirado por estado
   */
  if (permit.status === "EXPIRED") {
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "EXPIRED",
      notes: "El permiso está expirado.",
    })

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
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "NOT_STARTED",
      notes: "El permiso todavía no está vigente.",
    })

    return {
      ...permitResult,
      message: "El permiso todavía no está vigente.",
    }
  }

  /*
   * Permiso expirado por fecha
   */
  if (today > expirationDate) {
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "EXPIRED",
      notes: "El permiso ha expirado.",
    })

    return {
      ...permitResult,
      message: "El permiso ha expirado.",
    }
  }

  /*
   * Permiso no activo
   */
  if (permit.status !== "ACTIVE") {
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "NOT_ACTIVE",
      notes: "El permiso no está activo.",
    })

    return {
      ...permitResult,
      message: "El permiso no está activo.",
    }
  }

  /*
   * Salida no autorizada
   */
  if (!permit.departureAuthorized) {
    await createScanLog({
      permitId: permit.id,
      assetTag: equipment.assetTag,
      result: "DENIED",
      reason: "NOT_ACTIVE",
      notes: "La salida del equipo todavía no ha sido autorizada.",
    })

    return {
      ...permitResult,
      message: "La salida del equipo todavía no ha sido autorizada.",
    }
  }

  /*
   * Salida autorizada
   */
  await createScanLog({
    permitId: permit.id,
    assetTag: equipment.assetTag,
    result: "ALLOWED",
    reason: "ALLOWED",
    notes: "Salida autorizada.",
  })

  return buildPermitResult(permit, true, "ALLOWED", "Salida autorizada.")
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
  return findScanLogs(filters)
}

export async function getScanStats(filters: {
  startDate: Date
  endDate: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
}) {
  return getScanLogStats(filters)
}

export async function getEquipmentUsage(filters: {
  startDate: Date
  endDate: Date
  search?: string
}) {
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
  const stats = await getScanReasonStats(filters)

  return stats.map((item) => ({
    reason: item.reason,
    count: item._count.reason,
  }))
}
