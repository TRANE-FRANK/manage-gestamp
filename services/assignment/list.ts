import { findActiveAssignments } from "./repository"
import { requireRole } from "@/lib/auth/authorization"

export async function listActiveAssignments() {
  await requireRole("ADMIN", "IT")
  return findActiveAssignments()
}
