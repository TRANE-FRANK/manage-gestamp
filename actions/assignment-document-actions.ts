"use server"

import { revalidatePath } from "next/cache"

import { ActionResult } from "@/services/shared/types/action-result"

import { generateAssignmentDocument } from "@/services/assignment/document"
import { uploadSignedPdf } from "@/services/assignment/upload"

import { BusinessError, NotFoundError } from "@/services/shared/errors"

export async function generateResponsivaAction(assignmentId: number) {
  try {
    await generateAssignmentDocument(assignmentId)
    revalidatePath("/assignments")

    return {
      success: true,
    } satisfies ActionResult
  } catch (error) {
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
