import "server-only"

import { redirect } from "next/navigation"

import { AccessControlError, requireRole } from "@/lib/auth/authorization"
import type { UserRole } from "@/generated/prisma/client"

export async function requirePageRole(...roles: UserRole[]) {
  try {
    return await requireRole(...roles)
  } catch (error) {
    if (!(error instanceof AccessControlError)) throw error

    if (error.code === "UNAUTHENTICATED") {
      redirect("/login")
    }

    redirect("/security")
  }
}
