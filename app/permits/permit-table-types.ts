import type { Company, PermitStatus } from "@/generated/prisma/enums"

export interface PermitRow {
  id: number
  folio: string
  startDate: Date
  expirationDate: Date
  status: PermitStatus

  generatedPdfPath: string | null
  signedPdfPath: string | null
  departureAuthorized: boolean

  employee: {
    id: number
    sapNumber: string
    firstName: string
    lastName: string
    department: string | null
    position: string | null
  }

  equipment: {
    id: number
    assetTag: string
    company: Company
    type: string | null
    brand: string | null
    model: string | null
    serialNumber: string | null
  }
}
