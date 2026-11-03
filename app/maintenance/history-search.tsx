"use client"

import { useRouter, useSearchParams } from "next/navigation"

type StatusCounts = {
  all: number
  signed: number
  pending: number
  notGenerated: number
}

export default function MaintenanceHistorySearch({
  providers,
  error,
  statusCounts,
  currentStatus,
}: {
  providers: string[]
  error: string | null
  statusCounts: StatusCounts
  currentStatus: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("historySearch") ?? ""
  const currentFrom = searchParams.get("historyFrom") ?? ""
  const currentTo = searchParams.get("historyTo") ?? ""
  const currentProvider = searchParams.get("historyProvider") ?? ""

  const currentDocumentStatus =
    searchParams.get("historyStatus") ?? currentStatus

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams(searchParams.toString())

    const values = {
      historySearch: String(formData.get("historySearch") ?? "").trim(),
      historyFrom: String(formData.get("historyFrom") ?? ""),
      historyTo: String(formData.get("historyTo") ?? ""),
      historyProvider: String(formData.get("historyProvider") ?? ""),
    }

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    const status = String(formData.get("historyStatus") ?? "all")

    if (status !== "all") {
      params.set("historyStatus", status)
    } else {
      params.delete("historyStatus")
    }

    params.delete("historyPage")
    navigateToHistory(params)
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())

    for (const key of [
      "historySearch",
      "historyFrom",
      "historyTo",
      "historyProvider",
      "historyStatus",
      "historyPage",
    ]) {
      params.delete(key)
    }

    navigateToHistory(params)
  }

  const hasFilters = Boolean(
    currentSearch ||
    currentFrom ||
    currentTo ||
    currentProvider ||
    currentDocumentStatus !== "all",
  )

  const counters = [
    {
      label: "Total",
      value: statusCounts.all,
      color: "text-slate-900",
      background: "bg-slate-50",
    },
    {
      label: "Firmados",
      value: statusCounts.signed,
      color: "text-green-700",
      background: "bg-green-50",
    },
    {
      label: "Pendientes",
      value: statusCounts.pending,
      color: "text-amber-700",
      background: "bg-amber-50",
    },
    {
      label: "Sin generar",
      value: statusCounts.notGenerated,
      color: "text-slate-600",
      background: "bg-slate-100",
    },
  ]

  function navigateToHistory(params: URLSearchParams) {
    router.push(`/maintenance?${params.toString()}#maintenance-history`)
  }

  return (
    <div className="mb-4 space-y-4">
      {/* Contadores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className={`rounded-lg border border-slate-200 p-3 ${counter.background}`}
          >
            <p className="text-xs font-medium text-slate-500">
              {counter.label}
            </p>
            <p className={`mt-1 text-2xl font-semibold ${counter.color}`}>
              {counter.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_minmax(12rem,1fr)_repeat(3,minmax(9rem,1fr))_auto]"
        >
          <div className="sm:col-span-2 xl:col-span-1">
            <label
              htmlFor="maintenance-history-search"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Búsqueda
            </label>
            <input
              id="maintenance-history-search"
              name="historySearch"
              defaultValue={currentSearch}
              placeholder="Equipo, código de barras, proveedor, folio o notas"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="maintenance-history-provider"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Proveedor
            </label>
            <select
              id="maintenance-history-provider"
              name="historyProvider"
              defaultValue={currentProvider}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Todos los proveedores</option>
              {currentProvider && !providers.includes(currentProvider) ? (
                <option value={currentProvider}>{currentProvider}</option>
              ) : null}
              {providers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="maintenance-history-status"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Estado documental
            </label>
            <select
              id="maintenance-history-status"
              name="historyStatus"
              defaultValue={currentDocumentStatus}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="signed">Firmados</option>
              <option value="pending">Pendientes de firma</option>
              <option value="not-generated">Sin generar</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="maintenance-history-from"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Fecha inicial
            </label>
            <input
              id="maintenance-history-from"
              name="historyFrom"
              type="date"
              defaultValue={currentFrom}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="maintenance-history-to"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Fecha final
            </label>
            <input
              id="maintenance-history-to"
              name="historyTo"
              type="date"
              defaultValue={currentTo}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
            <button
              type="submit"
              className="h-9 flex-1 rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clear}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Limpiar
            </button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {hasFilters && !error ? (
          <p className="mt-2 text-xs text-slate-500">Filtros activos</p>
        ) : null}
      </div>
    </div>
  )
}