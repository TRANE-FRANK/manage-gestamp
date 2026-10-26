import type { EquipmentType } from "@/generated/prisma/client"

export interface EquipmentTypeConfig {
  label: string
  requiresAssetTag: boolean
  hasWarranty: boolean
  requiresExitPermit: boolean
  hasResponsiva: boolean
}

export const equipmentTypeConfig: Record<EquipmentType, EquipmentTypeConfig> = {
  LAPTOP: {
    label: "Laptop",
    requiresAssetTag: true,
    hasWarranty: true,
    requiresExitPermit: true,
    hasResponsiva: true,
  },

  DESKTOP: {
    label: "Desktop",
    requiresAssetTag: true,
    hasWarranty: true,
    requiresExitPermit: false,
    hasResponsiva: true,
  },

  SMARTPHONE: {
    label: "Smartphone",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
    hasResponsiva: true,
  },

  TABLET: {
    label: "Tablet",
    requiresAssetTag: false,
    hasWarranty: true,
    requiresExitPermit: false,
    hasResponsiva: true,
  },

  RADIO: {
    label: "Radio",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
    hasResponsiva: false,
  },

  PRINTER: {
    label: "Impresora",
    requiresAssetTag: false,
    hasWarranty: false,
    requiresExitPermit: false,
    hasResponsiva: false,
  },
}
