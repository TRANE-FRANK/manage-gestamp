"use server"

import { revalidatePath } from "next/cache"

import { generatePermitDocument } from "@/services/permit/document"
import { BusinessError } from "@/services/shared/errors"
import { AccessControlError } from "@/lib/auth/authorization"

import type { ActionResult } from "@/services/shared/types/action-result"

function getAuthorizationResult(
  error: unknown,
): ActionResult<{ relativePath: string }> | null {
  if (!(error instanceof AccessControlError)) return null

  return {
    success: false,
    message:
      error.code === "UNAUTHENTICATED"
        ? "Debes iniciar sesión para realizar esta operación."
        : "No tienes permisos para administrar permisos de salida.",
  }
}

export async function generatePermitDocumentAction(
  permitId: number,
): Promise<ActionResult<{ relativePath: string }>> {
  try {
    const document = await generatePermitDocument(permitId)

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}`)

    return {
      success: true,
      data: {
        relativePath: document.relativePath,
      },
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
      message: "Ha ocurrido un error interno al generar el formato.",
    }
  }
}
