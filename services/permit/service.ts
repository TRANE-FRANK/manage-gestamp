import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

import { BusinessError } from "@/services/shared/errors"

import {
  authorizePermitDeparture as authorizePermitDepartureRepository,
  authorizeExceptionalDeparture as authorizeExceptionalDepartureRepository,
  cancelPermit as cancelPermitRepository,
  createPermit as createPermitRepository,
  findActivePermitByEquipmentId,
  findPermitByFolio,
  findPermitById,
  findPermits,
  updatePermitDepartureAuthorization,
  findPermitsPaginated,
} from "./repository"

import { uploadSignedPermitPdf as uploadSignedPermitPdfService } from "./upload"

import { generateNextPermitFolio } from "./folio"

import type { RenewPermitInput, ListPermitsInput } from "./types"

export async function listPermits() {
  return findPermits()
}

export async function getPermitDetails(id: number) {
  return findPermitById(id)
}

export async function getPermitByFolio(folio: string) {
  return findPermitByFolio(folio)
}

export async function createPermit(data: {
  folio: string
  employeeId: number
  equipmentId: number
  startDate: Date
  expirationDate: Date
}) {
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

  return createPermitRepository(data)
}

export async function renewPermit({
  permitId,
  startDate,
  expirationDate,
}: RenewPermitInput) {
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
    await tx.permit.update({
      where: {
        id: permitId,
      },
      data: {
        status: "EXPIRED",
      },
    })

    return tx.permit.create({
      data: {
        folio: newFolio,
        employeeId: permit.employeeId,
        equipmentId: permit.equipmentId,
        startDate,
        expirationDate,
        status: "ACTIVE",
      },
      include: {
        employee: true,
        equipment: true,
      },
    })
  })
}

export async function cancelPermit(permitId: number, reason: string) {
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

  return cancelPermitRepository(permitId, cancellationReason)
}

export async function authorizeExceptionalDeparture(
  permitId: number,
  reason: string,
) {
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

  return authorizeExceptionalDepartureRepository(permitId, authorizationReason)
}

export async function uploadSignedPermitPdf(permitId: number, file: File) {
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
  const permit = await findPermitById(permitId)

  if (!permit) {
    throw new BusinessError("El permiso no existe.")
  }

  if (permit.status === "CANCELLED") {
    throw new BusinessError("No se puede modificar un permiso cancelado.")
  }

  return updatePermitDepartureAuthorization(permitId, departureAuthorized)
}

export async function authorizePermitDeparture(permitId: number) {
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

  return authorizePermitDepartureRepository(permitId)
}

export async function listPermitsPaginated({
  page = 1,
  pageSize = 20,
  status,
  process,
  search,
}: ListPermitsInput = {}) {
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
