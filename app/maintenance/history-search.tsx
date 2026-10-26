"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function MaintenanceHistorySearch({
  providers,
  error,
}: {
  providers: string[]
  error: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("historySearch") ?? ""
  const currentFrom = searchParams.get("historyFrom") ?? ""
  const currentTo = searchParams.get("historyTo") ?? ""
  const currentProvider = searchParams.get("historyProvider") ?? ""
  const [search, setSearch] = useState(currentSearch)
  const [from, setFrom] = useState(currentFrom)
  const [to, setTo] = useState(currentTo)
  const [provider, setProvider] = useState(currentProvider)

  useEffect(() => {
    setSearch(currentSearch)
    setFrom(currentFrom)
    setTo(currentTo)
    setProvider(currentProvider)
  }, [currentSearch, currentFrom, currentTo, currentProvider])

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const values = {
      historySearch: search.trim(),
      historyFrom: from,
      historyTo: to,
      historyProvider: provider,
    }

    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    params.delete("historyPage")
    router.push(`/maintenance?${params.toString()}`)
  }

  function clear() {
    setSearch("")
    setFrom("")
    setTo("")
    setProvider("")
    const params = new URLSearchParams(searchParams.toString())
    for (const key of [
      "historySearch",
      "historyFrom",
      "historyTo",
      "historyProvider",
      "historyPage",
    ]) {
      params.delete(key)
    }
    router.push(`/maintenance?${params.toString()}`)
  }

  const hasFilters = Boolean(
    currentSearch || currentFrom || currentTo || currentProvider,
  )

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_minmax(12rem,1fr)_repeat(2,minmax(9rem,1fr))_auto]">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="maintenance-history-search" className="mb-1 block text-xs font-medium text-slate-600">
            Búsqueda
          </label>
          <input
            id="maintenance-history-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Equipo, código de barras, proveedor, folio o notas"
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="maintenance-history-provider" className="mb-1 block text-xs font-medium text-slate-600">
            Proveedor
          </label>
          <select
            id="maintenance-history-provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todos los proveedores</option>
            {currentProvider && !providers.includes(currentProvider) ? (
              <option value={currentProvider}>{currentProvider}</option>
            ) : null}
            {providers.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="maintenance-history-from" className="mb-1 block text-xs font-medium text-slate-600">
            Fecha inicial
          </label>
          <input
            id="maintenance-history-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="maintenance-history-to" className="mb-1 block text-xs font-medium text-slate-600">
            Fecha final
          </label>
          <input
            id="maintenance-history-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
          <button type="submit" className="h-9 flex-1 rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800">
            Aplicar
          </button>
          <button type="button" onClick={clear} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Limpiar
          </button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
      ) : null}
      {hasFilters && !error ? (
        <p className="mt-2 text-xs text-slate-500">Filtros activos</p>
      ) : null}
    </div>
  )
}
