"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function SearchForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(() => {
    return searchParams.get("search") ?? ""
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams(searchParams.toString())
    const value = search.trim()

    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    params.delete("page")

    const query = params.toString()

    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
    >
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar usuario, SAP, equipo o serie..."
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 sm:w-72"
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
