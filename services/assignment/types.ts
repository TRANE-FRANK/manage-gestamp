import type { Assignment, Employee, Equipment } from "@/generated/prisma/client"

export interface AssignmentDetails extends Assignment {
  employee: Employee
  equipment: Equipment
}
