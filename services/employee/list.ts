import { findEmployees } from "./repository";

export async function listEmployees() {
  return findEmployees();
}