"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function MaintenanceEquipmentPagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
}) {
  const searchParams = useSearchParams()

  function href(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(nextPage))
    return `/maintenance?${params.toString()}`
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Mostrando {start}–{end} de {total} equipos · Página {page} de {totalPages}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Anterior
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">
              Anterior
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={href(page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Siguiente
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">
              Siguiente
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
