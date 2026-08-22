"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  search?: string
  status?: string
  process?: string
  company?: string
  type?: string
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  search,
  status,
  process,
  company,
  type,
}: PaginationProps) {
  const pathname = usePathname()

  function createPageUrl(newPage: number) {
    const params = new URLSearchParams()

    if (search) {
      params.set("search", search)
    }

    if (status) {
      params.set("status", status)
    }

    if (process) {
      params.set("process", process)
    }

    if (company) {
      params.set("company", company)
    }

    if (type) {
      params.set("type", type)
    }

    params.set("page", String(newPage))

    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) {
    return (
      <div className="mt-4 text-sm text-slate-500">
        Mostrando {total} registro{total !== 1 ? "s" : ""}
      </div>
    )
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Mostrando {start}–{end} de {total} registros
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={createPageUrl(page - 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Anterior
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">
            Anterior
          </span>
        )}

        <span className="px-3 text-sm text-slate-600">
          Página {page} de {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={createPageUrl(page + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Siguiente
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">
            Siguiente
          </span>
        )}
      </div>
    </div>
  )
}