import type { EquipmentType } from "@/generated/prisma/client"

export interface EquipmentTypeConfig {
  label: string
  requiresAssetTag: boolean
  hasWarranty: boolean
  requiresExitPermit: boolean
}

export const equipmentTypeConfig: Record<
  EquipmentType,
  EquipmentTypeConfig
> = {
  LAPTOP: {
    label: "Laptop",
    requiresAssetTag: true,
    hasWarranty: true,
    requiresExitPermit: true,
  },

  DESKTOP: {
    label: "Desktop",
    requiresAssetTag: true,
    hasWarranty: true,
    requiresExitPermit: false,
  },

  SMARTPHONE: {
    label: "Smartphone",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
  },

  TABLET: {
    label: "Tablet",
    requiresAssetTag: false,
    hasWarranty: true,
    requiresExitPermit: false,
  },

  RADIO: {
    label: "Radio",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
  },

  PRINTER: {
    label: "Impresora",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
  },
}