import { findEmployees } from "./repository";
import { requireRole } from "@/lib/auth/authorization";

export async function listEmployees() {
  await requireRole("ADMIN", "IT");
  return findEmployees();
}
