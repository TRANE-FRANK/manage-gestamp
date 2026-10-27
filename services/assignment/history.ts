import { findAssignmentHistory } from "./repository"
import { requireRole } from "@/lib/auth/authorization"

export async function listAssignmentHistory() {
  await requireRole("ADMIN", "IT")
  return findAssignmentHistory()
}
