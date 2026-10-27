"use server"

import { revalidatePath } from "next/cache"

import {
  cancelAssignment,
  createAssignment,
  returnAssignment,
} from "@/services/assignment"

import { BusinessError } from "@/services/shared/errors"
import type { ActionResult } from "@/services/shared/types/action-result"
import { AccessControlError } from "@/lib/auth/authorization"

function getAuthorizationResult(error: unknown): ActionResult | null {
  if (!(error instanceof AccessControlError)) return null

  return {
    success: false,
    message:
      error.code === "UNAUTHENTICATED"
        ? "Debes iniciar sesión para realizar esta operación."
        : "No tienes permisos para gestionar asignaciones.",
  }
}

export async function createAssignmentAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const employeeId = Number(formData.get("employeeId"))
    const equipmentId = Number(formData.get("equipmentId"))

    await createAssignment({
      employeeId,
      equipmentId,
    })

    revalidatePath("/assignments")

    return {
      success: true,
    }
  } catch (error) {
    const authorizationResult = getAuthorizationResult(error)
    if (authorizationResult) return authorizationResult

    if (error instanceof BusinessError) {
      return {
        success: false,
        message: error.message,
      }
    }

    console.error(error)

    return {
      success: false,
      message: "Ha ocurrido un error interno.",
    }
  }
}

export async function returnAssignmentAction(
  assignmentId: number,
): Promise<ActionResult> {
  try {
    const result = await returnAssignment(assignmentId)

    revalidatePath("/assignments")
    revalidatePath("/assignments/history")
    revalidatePath(`/assignments/${result.assignmentId}`)
    revalidatePath(`/employees/${result.employeeId}`)
    revalidatePath(`/equipment/${result.equipmentId}`)

    return {
      success: true,
    }
  } catch (error) {
    const authorizationResult = getAuthorizationResult(error)
    if (authorizationResult) return authorizationResult

    if (error instanceof BusinessError) {
      return {
        success: false,
        message: error.message,
      }
    }

    console.error(error)

    return {
      success: false,
      message: "Ha ocurrido un error interno.",
    }
  }
}

export async function cancelAssignmentAction(
  assignmentId: number,
  reason: string,
): Promise<ActionResult> {
  try {
    const result = await cancelAssignment(assignmentId, reason)

    revalidatePath("/assignments")
    revalidatePath("/assignments/history")
    revalidatePath(`/assignments/${result.assignmentId}`)
    revalidatePath(`/employees/${result.employeeId}`)
    revalidatePath(`/equipment/${result.equipmentId}`)

    return {
      success: true,
    }
  } catch (error) {
    const authorizationResult = getAuthorizationResult(error)
    if (authorizationResult) return authorizationResult

    if (error instanceof BusinessError) {
      return {
        success: false,
        message: error.message,
      }
    }

    console.error(error)

    return {
      success: false,
      message: "Ha ocurrido un error interno.",
    }
  }
}
