import { findAssignmentByIdOrThrow } from "./repository"
import { requireRole } from "@/lib/auth/authorization"

export async function getAssignmentDetails(id: number) {
  await requireRole("ADMIN", "IT")
  return findAssignmentByIdOrThrow(id)
}
