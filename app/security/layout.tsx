import type { ReactNode } from "react"

import RoleProtectedLayout from "@/app/_auth/RoleProtectedLayout"
import { ScanResultProvider } from "@/components/security/ScanResultContext"

export default function SecurityLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RoleProtectedLayout roles={["ADMIN", "IT", "SECURITY"]}>
      <ScanResultProvider>{children}</ScanResultProvider>
    </RoleProtectedLayout>
  )
}
