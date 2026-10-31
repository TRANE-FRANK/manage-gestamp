"use server"

import { revalidatePath } from "next/cache"

import { AccessControlError } from "@/lib/auth/authorization"
import {
  generateMaintenanceDocument,
  uploadMaintenanceSignedPdf,
} from "@/services/maintenance"
import { BusinessError } from "@/services/shared/errors"

export type MaintenanceDocumentActionResult = {
  success: boolean
  message?: string
}

function getActionErrorMessage(error: unknown, action: string) {
  if (error instanceof AccessControlError) {
    return error.code === "UNAUTHENTICATED"
      ? "Debes iniciar sesión para realizar esta operación."
      : "No tienes permisos para realizar esta operación."
  }

  if (error instanceof BusinessError) {
    return error.message
  }

  console.error(`Error al ${action} el documento de mantenimiento:`, error)

  return `No se pudo ${action} el documento. Inténtalo nuevamente.`
}

export async function generateMaintenanceDocumentAction(
  maintenanceId: number,
): Promise<MaintenanceDocumentActionResult> {
  try {
    await generateMaintenanceDocument(maintenanceId)
    revalidatePath("/maintenance")

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, "generar"),
    }
  }
}

export async function uploadMaintenanceSignedPdfAction(
  maintenanceId: number,
  formData: FormData,
): Promise<MaintenanceDocumentActionResult> {
  try {
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return {
        success: false,
        message: "Selecciona un archivo PDF.",
      }
    }

    await uploadMaintenanceSignedPdf(maintenanceId, file)
    revalidatePath("/maintenance")

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: getActionErrorMessage(error, "cargar"),
    }
  }
}
