import type { ReactNode } from "react"

interface Props {
  label: string
  children: ReactNode
}

export default function DetailItem({ label, children }: Props) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>

      <div className="mt-1 font-medium text-slate-800">{children}</div>
    </div>
  )
}
