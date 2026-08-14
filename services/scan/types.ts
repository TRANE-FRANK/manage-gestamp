export interface ScanEquipmentInput {
  assetTag: string
}

export interface ScanEquipmentResult {
  allowed: boolean
  result: "ALLOWED" | "DENIED"
  message: string

  equipment: {
    id: number
    assetTag: string
    company: string
  } | null

  permit: {
    id: number
    folio: string
    status: "ACTIVE" | "EXPIRED" | "CANCELLED"
    startDate: Date
    expirationDate: Date
    cancelledAt: Date | null
    cancellationReason: string | null
    employee: {
      firstName: string
      lastName: string
      department: string | null
    }
  } | null
}