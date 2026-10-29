"use server"

import { AccessControlError } from "@/lib/auth/authorization"
import {
  generateMaintenanceDocument,
} from "@/services/maintenance"
import { BusinessError } from "@/services/shared/errors"

export type MaintenanceDocumentActionResult = {
  success: boolean
  message?: string
}

export async function generateMaintenanceDocumentAction(
  maintenanceId: number,
): Promise<MaintenanceDocumentActionResult> {
  try {
    await generateMaintenanceDocument(maintenanceId)
    return { success: true }
  } catch (error) {
    if (error instanceof AccessControlError) {
      return {
        success: false,
        message:
          error.code === "UNAUTHENTICATED"
            ? "Debes iniciar sesión para generar el formato."
            : "No tienes permisos para generar el formato.",
      }
    }

    if (error instanceof BusinessError) {
      return { success: false, message: error.message }
    }

    console.error("Error al generar el formato de mantenimiento:", error)
    return {
      success: false,
      message: "No se pudo generar el formato imprimible. Inténtalo nuevamente.",
    }
  }
}
