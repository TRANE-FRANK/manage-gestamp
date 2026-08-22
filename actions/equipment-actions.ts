"use server"

import { Prisma } from "@/generated/prisma/client"

import {
  Company,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createEquipment(formData: FormData) {
  const assetTag = String(formData.get("assetTag") ?? "").trim()

  // Regla de negocio: barcode = assetTag
  const barcode = assetTag

  const type = formData.get("type") as EquipmentType

  const inventoryNumber =
    String(formData.get("inventoryNumber") ?? "").trim() || null

  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null

  const brand = String(formData.get("brand") ?? "").trim() || null

  const model = String(formData.get("model") ?? "").trim() || null

  const company = formData.get("company") as Company

  const status = formData.get("status") as EquipmentStatus

  if (!assetTag) {
    throw new Error("El número de equipo es obligatorio.")
  }

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
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target

      if (Array.isArray(target)) {
        const field = target[0]

        const messages: Record<string, string> = {
          assetTag: "Ya existe un equipo registrado con este número de equipo.",
          barcode: "Ya existe un equipo registrado con este código de barras.",
          inventoryNumber:
            "Ya existe un equipo registrado con este número de inventario.",
          serialNumber:
            "Ya existe un equipo registrado con este número de serie.",
        }

        throw new Error(
          messages[field] ??
            "Ya existe un equipo registrado con uno de estos datos.",
        )
      }

      throw new Error(
        "Ya existe un equipo registrado con uno de estos datos únicos.",
      )
    }

    throw error
  }

  revalidatePath("/equipment")

  redirect("/equipment?created=true")
}
