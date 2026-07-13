"use server"

import { revalidatePath } from "next/cache"

import { createAssignment } from "@/services/assignment"

import { BusinessError } from "@/services/shared/errors"
import type { ActionResult } from "@/services/shared/types/action-result"

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