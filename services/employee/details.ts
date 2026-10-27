import { findEmployeeByIdOrThrow } from "./repository"
import { requireRole } from "@/lib/auth/authorization"

export async function getEmployeeDetails(id: number) {
  await requireRole("ADMIN", "IT")
  return findEmployeeByIdOrThrow(id)
}
