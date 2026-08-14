export type PermitRow = {
  id: number
  folio: string
  status: "ACTIVE" | "EXPIRED" | "CANCELLED"
  startDate: Date
  expirationDate: Date
  signedPdfPath: string | null
  cancelledAt: Date | null
  cancellationReason: string | null

  employee: {
    firstName: string
    lastName: string
  }
  equipment: {
    assetTag: string
    company: string
  }
}
