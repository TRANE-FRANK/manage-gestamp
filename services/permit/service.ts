import { prisma } from "@/lib/prisma"

import { BusinessError } from "@/services/shared/errors"

import {
  authorizeExceptionalDeparture as authorizeExceptionalDepartureRepository,
  cancelPermit as cancelPermitRepository,
  createPermit as createPermitRepository,
  findActivePermitByEquipmentId,
  findPermitByFolio,
  findPermitById,
  findPermits,
  updatePermitDepartureAuthorization,
} from "./repository"

import { uploadSignedPermitPdf as uploadSignedPermitPdfService } from "./upload"

import { generateNextPermitFolio } from "./folio"

import type { RenewPermitInput } from "./types"

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
