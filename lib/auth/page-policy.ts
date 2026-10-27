import type { UserRole } from "@/generated/prisma/client"

const ADMIN_ROLES: UserRole[] = ["ADMIN", "IT"]
const SECURITY_ROLES: UserRole[] = ["ADMIN", "IT", "SECURITY"]
const LOCAL_ORIGIN = "https://manage-gestamp.invalid"

export type PageAccessDecision =
  | "public"
  | "allowed"
  | "unauthenticated"
  | "forbidden"

export function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "IT" || value === "SECURITY"
}

export function getPageAccessDecision(
  pathname: string,
  role: unknown,
): PageAccessDecision {
  if (pathname === "/login") return "public"
  if (!isUserRole(role)) return "unauthenticated"

  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return role === "ADMIN" ? "allowed" : "forbidden"
  }

  const allowedRoles =
    pathname === "/security" || pathname.startsWith("/security/")
      ? SECURITY_ROLES
      : ADMIN_ROLES

  return allowedRoles.includes(role) ? "allowed" : "forbidden"
}

export function getRoleHomePath(role: unknown): string {
  return role === "SECURITY" ? "/security" : "/"
}

export function sanitizeCallbackUrl(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/"
  }

  try {
    const url = new URL(value, LOCAL_ORIGIN)

    if (
      url.origin !== LOCAL_ORIGIN ||
      url.pathname === "/login" ||
      url.pathname.startsWith("/api/")
    ) {
      return "/"
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/"
  }
}
