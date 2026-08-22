"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function SearchForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams(searchParams.toString())

    const searchValue = search.trim()

    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }

    // Siempre regresar a la primera página al realizar una búsqueda.
    params.delete("page")

    const query = params.toString()

    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleClear() {
    const params = new URLSearchParams(searchParams.toString())

    params.delete("search")
    params.delete("page")

    setSearch("")

    const query = params.toString()

    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const hasSearch = Boolean(searchParams.get("search"))

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar folio, usuario o equipo..."
        className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Buscar
      </button>

      {hasSearch && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Limpiar
        </button>
      )}
    </form>
  )
}
