import type { Assignment, Employee, Equipment } from "@/generated/prisma/client"

export interface AssignmentDetails extends Assignment {
  employee: Employee
  equipment: Equipment
}

export interface AssignmentListItem extends Assignment {
  employee: Employee
  equipment: Equipment
}

export interface CreateAssignmentDto {
  employeeId: number
  equipmentId: number
}

export interface UpdateAssignmentDto {
  employeeId: number
  equipmentId: number
}

export interface ReturnAssignmentDto {
  returnedAt?: Date
  replacementReason?: string
}

export interface ListAssignmentsInput {
  page?: number
  pageSize?: number
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
