"use server"

import { revalidatePath } from "next/cache"

import {
  cancelPermit as cancelPermitService,
  createPermit as createPermitService,
  renewPermit,
  authorizeExceptionalDeparture,
  uploadSignedPermitPdf,
  setPermitDepartureAuthorization,
} from "@/services/permit"



import { BusinessError } from "@/services/shared/errors"

import type { ActionResult } from "@/services/shared/types/action-result"

export async function createPermit(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const folio = formData.get("folio")
    const employeeIdValue = formData.get("employeeId")
    const equipmentIdValue = formData.get("equipmentId")
    const startDateValue = formData.get("startDate")
    const expirationDateValue = formData.get("expirationDate")

    if (
      typeof folio !== "string" ||
      typeof employeeIdValue !== "string" ||
      typeof equipmentIdValue !== "string" ||
      typeof startDateValue !== "string" ||
      typeof expirationDateValue !== "string"
    ) {
      throw new BusinessError("Todos los campos son obligatorios.")
    }

    const employeeId = Number(employeeIdValue)
    const equipmentId = Number(equipmentIdValue)

    if (!Number.isInteger(employeeId) || !Number.isInteger(equipmentId)) {
      throw new BusinessError("El empleado o equipo seleccionado no es válido.")
    }

    const startDate = new Date(`${startDateValue}T00:00:00`)

    const expirationDate = new Date(`${expirationDateValue}T00:00:00`)

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(expirationDate.getTime())
    ) {
      throw new BusinessError("Las fechas proporcionadas no son válidas.")
    }

    await createPermitService({
      folio,
      employeeId,
      equipmentId,
      startDate,
      expirationDate,
    })

    revalidatePath("/permits")

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

export async function renewPermitAction(
  permitId: number,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const startDateValue = formData.get("startDate")
    const expirationDateValue = formData.get("expirationDate")

    if (
      typeof startDateValue !== "string" ||
      typeof expirationDateValue !== "string"
    ) {
      throw new BusinessError("Las fechas de renovación son obligatorias.")
    }

    const startDate = new Date(`${startDateValue}T00:00:00`)

    const expirationDate = new Date(`${expirationDateValue}T00:00:00`)

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(expirationDate.getTime())
    ) {
      throw new BusinessError("Las fechas proporcionadas no son válidas.")
    }

    await renewPermit({
      permitId,
      startDate,
      expirationDate,
    })

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}/renew`)

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

export async function cancelPermitAction(
  permitId: number,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const cancellationReason = reason.trim()

    if (!cancellationReason) {
      throw new BusinessError("Debes indicar el motivo de cancelación.")
    }

    if (cancellationReason.length < 5) {
      throw new BusinessError(
        "El motivo de cancelación debe tener al menos 5 caracteres.",
      )
    }

    await cancelPermitService(permitId, cancellationReason)

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}`)

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

export async function authorizeExceptionalDepartureAction(
  permitId: number,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const reason = formData.get("reason")

    if (typeof reason !== "string") {
      throw new BusinessError(
        "Debes indicar el motivo de la autorización excepcional.",
      )
    }

    const authorizationReason = reason.trim()

    if (!authorizationReason) {
      throw new BusinessError(
        "Debes indicar el motivo de la autorización excepcional.",
      )
    }

    if (authorizationReason.length < 5) {
      throw new BusinessError(
        "El motivo de la autorización debe tener al menos 5 caracteres.",
      )
    }

    await authorizeExceptionalDeparture(permitId, authorizationReason)

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}`)

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

export async function uploadSignedPermitPdfAction(
  permitId: number,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new BusinessError("Debes seleccionar un archivo PDF.")
    }

    await uploadSignedPermitPdf(permitId, file)

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}`)

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

export async function setPermitDepartureAuthorizationAction(
  permitId: number,
  departureAuthorized: boolean,
): Promise<ActionResult<void>> {
  try {
    await setPermitDepartureAuthorization(permitId, departureAuthorized)

    revalidatePath("/permits")
    revalidatePath(`/permits/${permitId}`)

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


