"use server"

import { revalidatePath } from "next/cache"

import { createAssignment, returnAssignment } from "@/services/assignment"

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

export async function returnAssignmentAction(
  assignmentId: number,
): Promise<ActionResult> {
  try {
    const result = await returnAssignment(assignmentId)

    revalidatePath("/assignments")
    revalidatePath(`/assignments/${result.assignmentId}`)
    revalidatePath(`/employees/${result.employeeId}`)
    revalidatePath(`/equipment/${result.equipmentId}`)

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
