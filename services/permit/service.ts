import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { requireRole } from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"

import { BusinessError } from "@/services/shared/errors"

import {
  findActivePermitByEquipmentId,
  findPermitByFolio,
  findPermitById,
  findPermits,
  findPermitsPaginated,
} from "./repository"

import { uploadSignedPermitPdf as uploadSignedPermitPdfService } from "./upload"

import { generateNextPermitFolio } from "./folio"

import type { RenewPermitInput, ListPermitsInput } from "./types"

export async function listPermits() {
  await requireRole("ADMIN", "IT")
  return findPermits()
}

export async function getPermitDetails(id: number) {
  await requireRole("ADMIN", "IT")
  return findPermitById(id)
}

export async function getPermitByFolio(folio: string) {
  await requireRole("ADMIN", "IT")
  return findPermitByFolio(folio)
}

export async function createPermit(data: {
  folio: string
  employeeId: number
  equipmentId: number
  startDate: Date
  expirationDate: Date
}) {
  const actor = await requireRole("ADMIN", "IT")

  if (!data.folio.trim()) {
    throw new BusinessError("El folio es obligatorio.")
  }

  const existingPermit = await findPermitByFolio(data.folio)

  if (existingPermit) {
    throw new BusinessError(`El folio "${data.folio}" ya está registrado.`)
  }

  const activePermit = await findActivePermitByEquipmentId(data.equipmentId)

  if (activePermit) {
    throw new BusinessError(
      `El equipo ${activePermit.equipment.assetTag} ya tiene un permiso activo.`,
    )
  }

  if (data.startDate >= data.expirationDate) {
    throw new BusinessError(
      "La fecha de vencimiento debe ser posterior a la fecha de inicio.",
    )
  }

  return prisma.$transaction(async (tx) => {
    const permit = await tx.permit.create({
      data: {
        folio: data.folio,
        employeeId: data.employeeId,
        equipmentId: data.equipmentId,
        startDate: data.startDate,
        expirationDate: data.expirationDate,
        status: "ACTIVE",
      },
      include: { employee: true, equipment: true },
    })

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_CREATED",
      entityType: "PERMIT",
      entityId: String(permit.id),
      outcome: "SUCCESS",
      source: "permit.create",
      after: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        startDate: permit.startDate.toISOString(),
        expirationDate: permit.expirationDate.toISOString(),
        status: permit.status,
        departureAuthorized: permit.departureAuthorized,
      },
    })

    return permit
  })
}

export async function renewPermit({
  permitId,
  startDate,
  expirationDate,
}: RenewPermitInput) {
  const actor = await requireRole("ADMIN", "IT")

  if (startDate >= expirationDate) {
    throw new BusinessError(
      "La fecha de vencimiento debe ser posterior a la fecha de inicio.",
    )
  }

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  const activePermit = await findActivePermitByEquipmentId(
    permit.equipmentId,
    permit.id,
  )

  if (activePermit) {
    throw new BusinessError(
      `El equipo ${activePermit.equipment.assetTag} ya tiene otro permiso activo.`,
    )
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError("No se puede renovar un permiso cancelado.")
  }

  const newFolio = generateNextPermitFolio(permit.folio)

  return prisma.$transaction(async (tx) => {
    const currentPermit = await tx.permit.findUnique({
      where: { id: permitId },
      select: {
        id: true,
        folio: true,
        employeeId: true,
        equipmentId: true,
        startDate: true,
        expirationDate: true,
        status: true,
        departureAuthorized: true,
      },
    })

    if (!currentPermit) {
      throw new BusinessError("El permiso no existe.")
    }

    if (currentPermit.status === "CANCELLED") {
      throw new BusinessError("No se puede renovar un permiso cancelado.")
    }

    const concurrentActivePermit = await tx.permit.findFirst({
      where: {
        equipmentId: currentPermit.equipmentId,
        status: "ACTIVE",
        id: { not: currentPermit.id },
      },
      include: { equipment: { select: { assetTag: true } } },
    })

    if (concurrentActivePermit) {
      throw new BusinessError(
        `El equipo ${concurrentActivePermit.equipment.assetTag} ya tiene otro permiso activo.`,
      )
    }

    if (currentPermit.status !== "EXPIRED") {
      const expiredPermit = await tx.permit.updateMany({
        where: {
          id: permitId,
          status: currentPermit.status,
          departureAuthorized: currentPermit.departureAuthorized,
        },
        data: { status: "EXPIRED" },
      })

      if (expiredPermit.count === 0) {
        throw new BusinessError("El permiso cambió y ya no se puede renovar.")
      }
    }

    const renewedPermit = await tx.permit.create({
      data: {
        folio: newFolio,
        employeeId: currentPermit.employeeId,
        equipmentId: currentPermit.equipmentId,
        startDate,
        expirationDate,
        status: "ACTIVE",
      },
      include: {
        employee: true,
        equipment: true,
      },
    })

    if (currentPermit.status !== "EXPIRED") {
      await writeAuditEvent(tx, {
        actor,
        action: "PERMIT_RENEWED",
        entityType: "PERMIT",
        entityId: String(currentPermit.id),
        outcome: "SUCCESS",
        source: "permit.renewal",
        before: {
          folio: currentPermit.folio,
          employeeId: currentPermit.employeeId,
          equipmentId: currentPermit.equipmentId,
          startDate: currentPermit.startDate.toISOString(),
          expirationDate: currentPermit.expirationDate.toISOString(),
          status: currentPermit.status,
          departureAuthorized: currentPermit.departureAuthorized,
        },
        after: {
          folio: currentPermit.folio,
          employeeId: currentPermit.employeeId,
          equipmentId: currentPermit.equipmentId,
          startDate: currentPermit.startDate.toISOString(),
          expirationDate: currentPermit.expirationDate.toISOString(),
          status: "EXPIRED",
          departureAuthorized: currentPermit.departureAuthorized,
          replacementPermitId: renewedPermit.id,
        },
      })
    }

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_CREATED",
      entityType: "PERMIT",
      entityId: String(renewedPermit.id),
      outcome: "SUCCESS",
      source: "permit.renewal",
      after: {
        folio: renewedPermit.folio,
        employeeId: renewedPermit.employeeId,
        equipmentId: renewedPermit.equipmentId,
        startDate: renewedPermit.startDate.toISOString(),
        expirationDate: renewedPermit.expirationDate.toISOString(),
        status: renewedPermit.status,
        departureAuthorized: renewedPermit.departureAuthorized,
        renewedFromPermitId: currentPermit.id,
      },
    })

    return renewedPermit
  })
}

export async function cancelPermit(permitId: number, reason: string) {
  const actor = await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError("El permiso ya está cancelado.")
  }

  if (permit.status === "EXPIRED") {
    throw new BusinessError("No se puede cancelar un permiso que ya expiró.")
  }

  const cancellationReason = reason.trim()

  if (!cancellationReason) {
    throw new BusinessError("El motivo de cancelación es obligatorio.")
  }

  const cancelledAt = new Date()

  return prisma.$transaction(async (tx) => {
    const update = await tx.permit.updateMany({
      where: {
        id: permitId,
        status: permit.status,
        departureAuthorized: permit.departureAuthorized,
        cancelledAt: permit.cancelledAt,
      },
      data: {
        status: "CANCELLED",
        cancelledAt,
        cancellationReason,
      },
    })

    if (update.count === 0) {
      throw new BusinessError("El permiso cambió y ya no se puede cancelar.")
    }

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_CANCELLED",
      entityType: "PERMIT",
      entityId: String(permit.id),
      outcome: "SUCCESS",
      source: "permit.cancel",
      before: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: permit.departureAuthorized,
        cancelledAt: permit.cancelledAt?.toISOString() ?? null,
      },
      after: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: "CANCELLED",
        departureAuthorized: permit.departureAuthorized,
        cancelledAt: cancelledAt.toISOString(),
      },
    })

    return tx.permit.findUniqueOrThrow({
      where: { id: permitId },
      include: { employee: true, equipment: true },
    })
  })
}

export async function authorizeExceptionalDeparture(
  permitId: number,
  reason: string,
) {
  const actor = await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError(
      "No se puede autorizar la salida de un permiso cancelado.",
    )
  }

  if (permit.status === "EXPIRED") {
    throw new BusinessError(
      "No se puede autorizar la salida de un permiso expirado.",
    )
  }

  if (permit.departureAuthorized) {
    throw new BusinessError("La salida de este permiso ya está autorizada.")
  }

  const authorizationReason = reason.trim()

  if (!authorizationReason) {
    throw new BusinessError(
      "El motivo de la autorización excepcional es obligatorio.",
    )
  }

  const departureAuthorizedAt = new Date()

  return prisma.$transaction(async (tx) => {
    const update = await tx.permit.updateMany({
      where: {
        id: permitId,
        status: permit.status,
        departureAuthorized: false,
        departureAuthorizedAt: permit.departureAuthorizedAt,
      },
      data: {
        departureAuthorized: true,
        departureAuthorizedAt,
        departureAuthorizationReason: authorizationReason,
      },
    })

    if (update.count === 0) {
      throw new BusinessError(
        "El permiso cambió y no se pudo autorizar la salida excepcional.",
      )
    }

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_EXCEPTIONAL_DEPARTURE_AUTHORIZED",
      entityType: "PERMIT",
      entityId: String(permit.id),
      outcome: "SUCCESS",
      source: "permit.exceptional-departure",
      before: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: false,
        departureAuthorizedAt: permit.departureAuthorizedAt?.toISOString() ?? null,
      },
      after: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: true,
        departureAuthorizedAt: departureAuthorizedAt.toISOString(),
      },
    })

    return tx.permit.findUniqueOrThrow({
      where: { id: permitId },
      include: { employee: true, equipment: true },
    })
  })
}

export async function uploadSignedPermitPdf(permitId: number, file: File) {
  await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError(
      "No se puede subir un documento a un permiso cancelado.",
    )
  }

  return uploadSignedPermitPdfService(permitId, file)
}

export async function setPermitDepartureAuthorization(
  permitId: number,
  departureAuthorized: boolean,
) {
  const actor = await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError("No se puede modificar un permiso cancelado.")
  }

  if (permit.departureAuthorized === departureAuthorized) {
    return permit
  }

  return prisma.$transaction(async (tx) => {
    const update = await tx.permit.updateMany({
      where: {
        id: permitId,
        status: permit.status,
        departureAuthorized: permit.departureAuthorized,
      },
      data: { departureAuthorized },
    })

    if (update.count === 0) {
      throw new BusinessError(
        "El permiso cambió y no se pudo modificar la autorización.",
      )
    }

    await writeAuditEvent(tx, {
      actor,
      action: departureAuthorized
        ? "PERMIT_DEPARTURE_AUTHORIZED"
        : "PERMIT_DEPARTURE_AUTHORIZATION_REVOKED",
      entityType: "PERMIT",
      entityId: String(permit.id),
      outcome: "SUCCESS",
      source: "permit.departure-authorization",
      before: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: permit.departureAuthorized,
      },
      after: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized,
      },
    })

    return tx.permit.findUniqueOrThrow({ where: { id: permitId } })
  })
}

export async function authorizePermitDeparture(permitId: number) {
  const actor = await requireRole("ADMIN", "IT")

  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status !== "ACTIVE") {
    throw new BusinessError(
      "Solo se puede autorizar la salida de un permiso activo.",
    )
  }

  if (permit.departureAuthorized) {
    throw new BusinessError("La salida de este equipo ya está autorizada.")
  }

  return prisma.$transaction(async (tx) => {
    const update = await tx.permit.updateMany({
      where: {
        id: permitId,
        status: "ACTIVE",
        departureAuthorized: false,
      },
      data: { departureAuthorized: true },
    })

    if (update.count === 0) {
      throw new BusinessError("El permiso cambió y no se pudo autorizar la salida.")
    }

    await writeAuditEvent(tx, {
      actor,
      action: "PERMIT_DEPARTURE_AUTHORIZED",
      entityType: "PERMIT",
      entityId: String(permit.id),
      outcome: "SUCCESS",
      source: "permit.departure-authorization",
      before: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: false,
      },
      after: {
        folio: permit.folio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        status: permit.status,
        departureAuthorized: true,
      },
    })

    return tx.permit.findUniqueOrThrow({
      where: { id: permitId },
      include: { employee: true, equipment: true },
    })
  })
}

export async function listPermitsPaginated({
  page = 1,
  pageSize = 20,
  status,
  process,
  search,
}: ListPermitsInput = {}) {
  await requireRole("ADMIN", "IT")

  const where: Prisma.PermitWhereInput = {}

  if (search?.trim()) {
    const searchTerm = search.trim()

    where.OR = [
      {
        folio: {
          contains: searchTerm,
          mode: "insensitive",
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
    ]
  }

  switch (status) {
    case "active":
      where.status = "ACTIVE"
      break

    case "expired":
      where.status = "EXPIRED"
      break

    case "cancelled":
      where.status = "CANCELLED"
      break
  }

  switch (process) {
    case "pending-generation":
      where.generatedPdfPath = null
      break

    case "pending-signature":
      where.AND = [
        {
          generatedPdfPath: {
            not: null,
          },
        },
        {
          signedPdfPath: null,
        },
        {
          departureAuthorized: false,
        },
      ]
      break

    case "exception-authorized":
      where.AND = [
        {
          departureAuthorized: true,
        },
        {
          signedPdfPath: null,
        },
      ]
      break

    case "complete":
      where.AND = [
        {
          signedPdfPath: {
            not: null,
          },
        },
        {
          departureAuthorized: true,
        },
      ]
      break
  }

  const result = await findPermitsPaginated({
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
