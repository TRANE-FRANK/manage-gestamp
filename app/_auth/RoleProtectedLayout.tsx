import "server-only"

import type { ReactNode } from "react"
import type { UserRole } from "@/generated/prisma/client"

import { requirePageRole } from "@/lib/auth/page-guard"

export default async function RoleProtectedLayout({
  children,
  roles,
}: {
  children: ReactNode
  roles: UserRole[]
}) {
  await requirePageRole(...roles)
  return children
}
