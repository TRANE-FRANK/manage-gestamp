"use client"

import { useRouter, useSearchParams } from "next/navigation"

type FilterName = "company" | "status" | "type" | "ownership"

export default function EquipmentFilters() {
  const router = useRouter()

  const searchParams = useSearchParams()

  function updateFilter(filterName: FilterName, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(filterName, value)
    } else {
      params.delete(filterName)
    }

    params.delete("page")

    const query = params.toString()

    router.push(query ? `/equipment?${query}` : "/equipment")
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select
        value={searchParams.get("company") ?? ""}
        onChange={(event) => updateFilter("company", event.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Todas las empresas</option>
        <option value="ORM">ORM</option>
        <option value="GP2">GP2</option>
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(event) => updateFilter("status", event.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Todos los estados</option>
        <option value="AVAILABLE">Disponible</option>
        <option value="ASSIGNED">Asignado</option>
        <option value="MAINTENANCE">Reparación</option>
        <option value="STORAGE">Almacén</option>
        <option value="RETIRED">Retirado</option>
      </select>

      <select
        value={searchParams.get("type") ?? ""}
        onChange={(event) => updateFilter("type", event.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Todos los tipos</option>
        <option value="LAPTOP">Laptop</option>
        <option value="DESKTOP">Desktop</option>
        <option value="SMARTPHONE">Smartphone</option>
        <option value="TABLET">Tablet</option>
        <option value="RADIO">Radio</option>
        <option value="PRINTER">Impresora</option>
      </select>

      <select
        value={searchParams.get("ownership") ?? ""}
        onChange={(event) => updateFilter("ownership", event.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Toda la propiedad</option>
        <option value="OWNED">Propio</option>
        <option value="RENTED">Rentado</option>
      </select>
    </div>
  )
}
