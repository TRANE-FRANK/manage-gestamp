"use client"

import { usePathname } from "next/navigation"

import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === "/login") return children

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="min-h-0 flex-1 overflow-auto bg-slate-100 p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
