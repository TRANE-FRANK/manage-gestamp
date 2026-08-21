"use server"

import { revalidatePath } from "next/cache"

import { generatePermitDocument } from "@/services/permit/document"
import { BusinessError } from "@/services/shared/errors"

import type { ActionResult } from "@/services/shared/types/action-result"

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
