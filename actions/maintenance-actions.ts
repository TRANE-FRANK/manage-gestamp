"use server"

import { revalidatePath } from "next/cache"

import { registerMaintenanceBatch } from "@/services/maintenance"
import { BusinessError } from "@/services/shared/errors"
import { AccessControlError } from "@/lib/auth/authorization"

export interface MaintenanceRegistrationState {
  success?: boolean
  message?: string
  batchId?: number
  count?: number
}

export async function registerMaintenanceBatchAction(
  _previousState: MaintenanceRegistrationState,
  formData: FormData,
): Promise<MaintenanceRegistrationState> {
  try {
    const equipmentIds = formData.getAll("equipmentIds").map((value) =>
      typeof value === "string" ? Number(value) : Number.NaN,
    )
    const getTextValue = (key: string) => {
      const value = formData.get(key)
      return typeof value === "string" ? value : ""
    }

    const result = await registerMaintenanceBatch({
      maintenanceDate: getTextValue("maintenanceDate"),
      provider: getTextValue("provider"),
      notes: getTextValue("notes"),
      equipmentIds,
    })

    revalidatePath("/maintenance")

    return {
      success: true,
      batchId: result.batchId,
      count: result.count,
      message: `Se registraron ${result.count} mantenimiento${result.count === 1 ? "" : "s"}.`,
    }
  } catch (error) {
    if (error instanceof AccessControlError) {
      return {
        success: false,
        message:
          error.code === "UNAUTHENTICATED"
            ? "Debes iniciar sesión para registrar mantenimientos."
            : "No tienes permisos para registrar mantenimientos.",
      }
    }

    if (error instanceof BusinessError) {
      return {
        success: false,
        message: error.message,
      }
    }

    console.error("Error al registrar mantenimientos:", error)

    return {
      success: false,
      message: "Ocurrió un error al registrar los mantenimientos. Inténtalo nuevamente.",
    }
  }
}
