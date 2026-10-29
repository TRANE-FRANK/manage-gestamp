"use server"

import { equipmentTypeConfig } from "@/lib/equipment/config"

import { Prisma } from "@/generated/prisma/client"

import {
  Company,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"
import {
  AccessControlError,
  requireRole,
  type VerifiedUser,
} from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"

import { redirect } from "next/navigation"

import { revalidatePath } from "next/cache"

export type EquipmentFormState = {
  errors?: {
    assetTag?: string
    inventoryNumber?: string
    serialNumber?: string
    general?: string
  }
}

type EquipmentFormData = {
  assetTag: string | null
  barcode: string | null
  type: EquipmentType
  inventoryNumber: string | null
  serialNumber: string | null
  brand: string | null
  model: string | null
  company: Company
  status: EquipmentStatus
  ownership: EquipmentOwnership
  warrantyExpiresAt: Date | null
}

const equipmentAuditSelect = {
  id: true,
  assetTag: true,
  barcode: true,
  type: true,
  inventoryNumber: true,
  serialNumber: true,
  brand: true,
  model: true,
  company: true,
  status: true,
  ownership: true,
  warrantyExpiresAt: true,
} satisfies Prisma.EquipmentSelect

type EquipmentAuditRecord = Prisma.EquipmentGetPayload<{
  select: typeof equipmentAuditSelect
}>

function equipmentAuditSnapshot(equipment: EquipmentAuditRecord) {
  return {
    assetTag: equipment.assetTag,
    barcode: equipment.barcode,
    type: equipment.type,
    inventoryNumber: equipment.inventoryNumber,
    serialNumber: equipment.serialNumber,
    brand: equipment.brand,
    model: equipment.model,
    company: equipment.company,
    status: equipment.status,
    ownership: equipment.ownership,
    warrantyExpiresAt: equipment.warrantyExpiresAt?.toISOString() ?? null,
  }
}

function getEquipmentFormData(
  formData: FormData,
): EquipmentFormData | EquipmentFormState {
  const rawAssetTag = String(formData.get("assetTag") ?? "").trim()

  const type = formData.get("type") as EquipmentType
  const typeConfig = equipmentTypeConfig[type]

  const requiresAssetTag = typeConfig.requiresAssetTag

  if (requiresAssetTag && !rawAssetTag) {
    return {
      errors: {
        assetTag: "El Asset Tag es obligatorio para laptops y desktops.",
      },
    }
  }

  const assetTag = rawAssetTag || null

  // Regla de negocio: barcode = assetTag
  const barcode = assetTag

  const inventoryNumber =
    String(formData.get("inventoryNumber") ?? "").trim() || null

  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null

  const brand = String(formData.get("brand") ?? "").trim() || null

  const model = String(formData.get("model") ?? "").trim() || null

  const company = formData.get("company") as Company
  const status = formData.get("status") as EquipmentStatus
  const ownership = formData.get("ownership") as EquipmentOwnership

  const hasWarranty = typeConfig.hasWarranty

  const warrantyExpiresAtValue = hasWarranty
    ? String(formData.get("warrantyExpiresAt") ?? "").trim()
    : ""

  const warrantyExpiresAt = warrantyExpiresAtValue
    ? new Date(`${warrantyExpiresAtValue}T00:00:00`)
    : null

  return {
    assetTag,
    barcode,
    type,
    inventoryNumber,
    serialNumber,
    brand,
    model,
    company,
    status,
    ownership,
    warrantyExpiresAt,
  }
}

function hasErrors(
  value: EquipmentFormData | EquipmentFormState,
): value is EquipmentFormState {
  return "errors" in value
}

function getUniqueConstraintError(error: unknown): EquipmentFormState | null {
  if (
    !(
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
  ) {
    return null
  }

  const target = error.meta?.target

  let field: string | undefined

  if (Array.isArray(target)) {
    field = String(target[0])
  } else if (typeof target === "string") {
    field = target
  }

  const messages: Record<string, string> = {
    assetTag: "Ya existe un equipo registrado con este Asset Tag.",
    barcode: "Ya existe un equipo registrado con este Asset Tag.",
    inventoryNumber:
      "Ya existe un equipo registrado con este número de inventario.",
    serialNumber: "Ya existe un equipo registrado con este número de serie.",
  }

  const message =
    messages[field ?? ""] ??
    "Ya existe un equipo registrado con uno de estos datos únicos."

  if (field === "assetTag" || field === "barcode") {
    return {
      errors: {
        assetTag: message,
      },
    }
  }

  if (field === "inventoryNumber") {
    return {
      errors: {
        inventoryNumber: message,
      },
    }
  }

  if (field === "serialNumber") {
    return {
      errors: {
        serialNumber: message,
      },
    }
  }

  return {
    errors: {
      general: message,
    },
  }
}

function getUnexpectedError(): EquipmentFormState {
  return {
    errors: {
      general:
        "Ocurrió un error inesperado al guardar el equipo. Revisa los datos e inténtalo nuevamente.",
    },
  }
}

async function getEquipmentAuthorizationError(
  operation: "registrar" | "modificar",
): Promise<{ actor: VerifiedUser } | { error: EquipmentFormState }> {
  try {
    return { actor: await requireRole("ADMIN", "IT") }
  } catch (error) {
    if (error instanceof AccessControlError) {
      return {
        error: {
          errors: {
            general:
              error.code === "UNAUTHENTICATED"
                ? "Debes iniciar sesión para " + operation + " un equipo."
                : "No tienes permisos para " + operation + " equipos.",
          },
        },
      }
    }

    console.error("No se pudo verificar el acceso para " + operation + " equipos.")
    return { error: getUnexpectedError() }
  }
}

export async function createEquipment(
  _previousState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const authorization = await getEquipmentAuthorizationError("registrar")
  if ("error" in authorization) return authorization.error
  const { actor } = authorization

  const data = getEquipmentFormData(formData)

  if (hasErrors(data)) {
    return data
  }

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.equipment.create({
        data,
        select: equipmentAuditSelect,
      })

      await writeAuditEvent(tx, {
        actor,
        action: "EQUIPMENT_CREATED",
        entityType: "EQUIPMENT",
        entityId: String(created.id),
        outcome: "SUCCESS",
        source: "equipment.create",
        after: equipmentAuditSnapshot(created),
      })

      return created
    })
  } catch (error) {
    console.error("Error al registrar equipo:", error)

    const uniqueConstraintError = getUniqueConstraintError(error)

    if (uniqueConstraintError) {
      return uniqueConstraintError
    }

    return getUnexpectedError()
  }

  revalidatePath("/equipment")

  redirect("/equipment?created=true")
}

export async function updateEquipment(
  equipmentId: number,
  _previousState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const authorization = await getEquipmentAuthorizationError("modificar")
  if ("error" in authorization) return authorization.error
  const { actor } = authorization

  const data = getEquipmentFormData(formData)

  if (hasErrors(data)) {
    return data
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "Equipment"
        WHERE "id" = ${equipmentId}
        FOR UPDATE
      `
      const existing = await tx.equipment.findUnique({
        where: { id: equipmentId },
        select: equipmentAuditSelect,
      })

      if (!existing) {
        // Preserve Prisma's existing not-found error behavior for the action.
        await tx.equipment.update({
          where: { id: equipmentId },
          data,
        })
        return
      }

      const updated = await tx.equipment.update({
        where: { id: equipmentId },
        data,
        select: equipmentAuditSelect,
      })

      const before = equipmentAuditSnapshot(existing)
      const after = equipmentAuditSnapshot(updated)
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        await writeAuditEvent(tx, {
          actor,
          action: "EQUIPMENT_UPDATED",
          entityType: "EQUIPMENT",
          entityId: String(equipmentId),
          outcome: "SUCCESS",
          source: "equipment.update",
          before,
          after,
        })
      }
    })
  } catch (error) {
    console.error("Error al actualizar equipo:", error)

    const uniqueConstraintError = getUniqueConstraintError(error)

    if (uniqueConstraintError) {
      return uniqueConstraintError
    }

    return getUnexpectedError()
  }

  revalidatePath("/equipment")
  revalidatePath(`/equipment/${equipmentId}`)

  redirect(`/equipment/${equipmentId}?updated=true`)
}
