import { findAssignmentHistory } from "./repository"

export async function listAssignmentHistory() {
  return findAssignmentHistory()
}
