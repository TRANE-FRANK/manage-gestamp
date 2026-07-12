import { findAssignmentByIdOrThrow } from "./repository"

export async function getAssignmentDetails(id: number) {
  return findAssignmentByIdOrThrow(id)
}
