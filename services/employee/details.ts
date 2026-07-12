import { findEmployeeByIdOrThrow } from "./repository"

export async function getEmployeeDetails(id: number) {
  return findEmployeeByIdOrThrow(id)
}
