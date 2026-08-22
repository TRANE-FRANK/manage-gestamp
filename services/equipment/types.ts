import type {
  Company,
  EquipmentStatus,
  EquipmentType,
} from "@/generated/prisma/client"

export interface ListEquipmentInput {
  page?: number
  pageSize?: number
  search?: string
  company?: Company
  status?: EquipmentStatus
  type?: EquipmentType
}

export interface PaginatedEquipmentResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
