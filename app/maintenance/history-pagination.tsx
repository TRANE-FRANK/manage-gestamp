import Link from "next/link"

export default function MaintenanceHistoryPagination({
  page,
  totalPages,
  total,
  pageSize,
  search,
  from,
  to,
  provider,
  equipmentPage,
  equipmentSearch,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  search?: string
  from?: string
  to?: string
  provider?: string
  equipmentPage?: string
  equipmentSearch?: string
}) {
  function href(nextPage: number) {
    const params = new URLSearchParams()
    if (equipmentPage) params.set("page", equipmentPage)
    if (equipmentSearch) params.set("search", equipmentSearch)
    if (search) params.set("historySearch", search)
    if (from) params.set("historyFrom", from)
    if (to) params.set("historyTo", to)
    if (provider) params.set("historyProvider", provider)
    params.set("historyPage", String(nextPage))
    return `/maintenance?${params.toString()}`
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Mostrando {start}–{end} de {total} registro{total !== 1 ? "s" : ""}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? <Link href={href(page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Anterior</Link> : <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">Anterior</span>}
          <span className="px-3 text-sm text-slate-600">Página {page} de {totalPages}</span>
          {page < totalPages ? <Link href={href(page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Siguiente</Link> : <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400">Siguiente</span>}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
      )}
    </div>
  )
}
