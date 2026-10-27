"use server"

import { revalidatePath } from "next/cache"

import { ActionResult } from "@/services/shared/types/action-result"

import { generateAssignmentDocument } from "@/services/assignment/document"
import { uploadSignedPdf } from "@/services/assignment/upload"

import { BusinessError, NotFoundError } from "@/services/shared/errors"
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

export async function generateResponsivaAction(assignmentId: number) {
  try {
    await generateAssignmentDocument(assignmentId)
    revalidatePath("/assignments")

    return {
      success: true,
    } satisfies ActionResult
  } catch (error) {
    const authorizationResult = getAuthorizationResult(error)
    if (authorizationResult) return authorizationResult

    if (error instanceof BusinessError) {
      return {
        success: false,
        message: error.message,
      } satisfies ActionResult
    }

    console.error(error)

    return {
      success: false,
      message: "Ha ocurrido un error interno.",
    } satisfies ActionResult
  }
}

export async function uploadSignedPdfAction(
  assignmentId: number,
  formData: FormData,
) {
  try {
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new NotFoundError("No se recibió ningún archivo.")
    }

    await uploadSignedPdf(assignmentId, file)

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
