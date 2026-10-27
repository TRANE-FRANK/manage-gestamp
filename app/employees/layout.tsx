import type { ReactNode } from "react"

import RoleProtectedLayout from "@/app/_auth/RoleProtectedLayout"

export default function EmployeesLayout({
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
