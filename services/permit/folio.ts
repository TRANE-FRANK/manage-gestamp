import { BusinessError } from "@/services/shared/errors"

export function generateNextPermitFolio(currentFolio: string) {
  const match = currentFolio.match(/^(.*?)(\d+)$/)

  if (!match) {
    throw new BusinessError(
      `No se pudo generar automáticamente el siguiente folio a partir de "${currentFolio}".`,
    )
  }

  const prefix = match[1]
  const currentNumber = Number(match[2])

  if (!Number.isInteger(currentNumber)) {
    throw new BusinessError(
      `El folio "${currentFolio}" no tiene un consecutivo válido.`,
    )
  }

  const nextNumber = currentNumber + 1

  return `${prefix}${nextNumber}`
}
