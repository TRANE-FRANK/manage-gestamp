import type { ReactNode } from "react"

interface Props {
  children: ReactNode
}

export default function DetailGrid({ children }: Props) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
}
