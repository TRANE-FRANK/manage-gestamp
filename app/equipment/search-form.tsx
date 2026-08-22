"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function EquipmentSearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams(searchParams.toString())

    const searchValue = search.trim()

    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }

    params.delete("page")

    const query = params.toString()

    router.push(query ? `/equipment?${query}` : "/equipment")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar equipo, serial, inventario, marca o modelo..."
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:max-w-md"
      />

      <button
        type="submit"
        className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
      >
        Buscar
      </button>
    </form>
  )
}
