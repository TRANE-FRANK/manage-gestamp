"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Props = {
  period: string
  result?: "ALLOWED" | "DENIED"
  search?: string
}

export default function HistoryFilters({ period, result, search }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (window.location.hash !== "#scan-results") {
      return
    }

    requestAnimationFrame(() => {
      document
        .getElementById("scan-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [searchParams])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()

    const selectedPeriod = formData.get("period")?.toString()
    const selectedResult = formData.get("result")?.toString()
    const selectedSearch = formData.get("search")?.toString().trim()

    if (selectedPeriod) {
      params.set("period", selectedPeriod)
    }

    if (selectedResult) {
      params.set("result", selectedResult)
    }

    if (selectedSearch) {
      params.set("search", selectedSearch)
    }

    router.push(`${pathname}?${params.toString()}#scan-results`)
  }

  function handleClearFilters() {
    router.push(`${pathname}?period=today#scan-results`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 p-5 md:grid-cols-[180px_180px_minmax(0,1fr)_auto]"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Periodo
        </label>

        <select
          name="period"
          defaultValue={period}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Resultado
        </label>

        <select
          name="result"
          defaultValue={result ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Todos</option>
          <option value="ALLOWED">Permitidos</option>
          <option value="DENIED">Denegados</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Buscar
        </label>

        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Equipo, empleado o folio..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Aplicar filtros
        </button>

        {(period !== "today" || result || search) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  )
}
