"use server"

import { Prisma } from "@/generated/prisma/client"

import {
  Company,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"

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

export async function createEquipment(
  _previousState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const rawAssetTag = String(formData.get("assetTag") ?? "").trim()

  const type = formData.get("type") as EquipmentType

  const requiresAssetTag = type === "LAPTOP" || type === "DESKTOP"

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
  const warrantyExpiresAtValue = String(
    formData.get("warrantyExpiresAt") ?? "",
  ).trim()

  const warrantyExpiresAt = warrantyExpiresAtValue
    ? new Date(`${warrantyExpiresAtValue}T00:00:00`)
    : null

  try {
    await prisma.equipment.create({
      data: {
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
      },
    })
  } catch (error) {
    console.error("Error al registrar equipo:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
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
        serialNumber:
          "Ya existe un equipo registrado con este número de serie.",
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

    return {
      errors: {
        general:
          "Ocurrió un error inesperado al registrar el equipo. Revisa los datos e inténtalo nuevamente.",
      },
    }
  }

  revalidatePath("/equipment")

  redirect("/equipment?created=true")
}
