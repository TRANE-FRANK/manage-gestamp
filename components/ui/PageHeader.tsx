import Link from "next/link"

interface PageHeaderProps {
  title: string
  buttonText?: string
  buttonHref?: string
  actions?: React.ReactNode
}

export default function PageHeader({
  title,
  buttonText,
  buttonHref,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-slate-800">{title}</h1>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : (
        buttonText &&
        buttonHref && (
          <Link
            href={buttonHref}
            className="rounded-xl bg-blue-700 px-4 py-2 text-white transition hover:bg-blue-800"
          >
            {buttonText}
          </Link>
        )
      )}
    </div>
  )
}
