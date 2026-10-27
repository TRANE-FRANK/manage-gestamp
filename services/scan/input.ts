import { ValidationError } from "@/services/shared/errors"

import type { ScanEquipmentInput } from "./types"

export function parseScanEquipmentInput(value: unknown): ScanEquipmentInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("El cuerpo de la solicitud no es válido.")
  }

  const rawAssetTag = (value as { assetTag?: unknown }).assetTag
  if (typeof rawAssetTag !== "string") {
    throw new ValidationError("Debes proporcionar el Asset Tag del equipo.")
  }

  const assetTag = rawAssetTag.trim()
  if (!assetTag) {
    throw new ValidationError("Debes proporcionar el Asset Tag del equipo.")
  }

  if (
    assetTag.length > 100 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(assetTag)
  ) {
    throw new ValidationError("El Asset Tag no tiene un formato válido.")
  }

  return { assetTag }
}
