import type { ReactNode } from "react"

import RoleProtectedLayout from "@/app/_auth/RoleProtectedLayout"

export default async function PermitsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RoleProtectedLayout roles={["ADMIN", "IT"]}>
      {children}
    </RoleProtectedLayout>
  )
}
