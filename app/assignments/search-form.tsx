"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") ?? ""

  const [search, setSearch] = useState(currentSearch)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()

    const value = search.trim()

    if (value) {
      params.set("search", value)
    }

    // Al hacer una nueva búsqueda siempre volvemos a la primera página
    router.push(
      `/assignments${params.toString() ? `?${params.toString()}` : ""}`,
    )
  }

  function handleClear() {
    setSearch("")
    router.push("/assignments")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar usuario, SAP o equipo..."
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 sm:w-72"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-9 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
        >
          Buscar
        </button>

        {(search || currentSearch) && (
          <button
            type="button"
            onClick={handleClear}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  )
}
