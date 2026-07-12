import { findActiveAssignments } from "./repository"

export async function listActiveAssignments() {
  return findActiveAssignments()
}
