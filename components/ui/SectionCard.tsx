import Card from "./Card"

interface SectionCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function SectionCard({
  title,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <h2 className="mb-6 text-lg font-semibold text-slate-800">{title}</h2>

      {children}
    </Card>
  )
}
