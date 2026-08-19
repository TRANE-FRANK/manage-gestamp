"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Props = {
  total: number
  allowed: number
  denied: number
  uniqueEquipment: number
}

export default function HistoryStats({
  total,
  allowed,
  denied,
  uniqueEquipment,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleResultFilter(result?: "ALLOWED" | "DENIED") {
    const params = new URLSearchParams(searchParams.toString())

    if (result) {
      params.set("result", result)
    } else {
      params.delete("result")
    }

    params.delete("page")

    router.push(`${pathname}?${params.toString()}#scan-results`)
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <button
        type="button"
        onClick={() => handleResultFilter()}
        className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        <p className="text-sm font-medium text-slate-500">Total de escaneos</p>

        <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>

        <p className="mt-2 text-xs text-slate-400">Ver todos los registros</p>
      </button>

      <button
        type="button"
        onClick={() => handleResultFilter("ALLOWED")}
        className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-green-300 hover:shadow-md"
      >
        <p className="text-sm font-medium text-slate-500">
          Salidas autorizadas
        </p>

        <p className="mt-2 text-3xl font-bold text-green-600">{allowed}</p>

        <p className="mt-2 text-xs text-slate-400">Ver registros autorizados</p>
      </button>

      <button
        type="button"
        onClick={() => handleResultFilter("DENIED")}
        className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-300 hover:shadow-md"
      >
        <p className="text-sm font-medium text-slate-500">Salidas denegadas</p>

        <p className="mt-2 text-3xl font-bold text-red-600">{denied}</p>

        <p className="mt-2 text-xs text-slate-400">Ver registros denegados</p>
      </button>

      <button
        type="button"
        onClick={() => handleResultFilter()}
        className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        <p className="text-sm font-medium text-slate-500">Equipos escaneados</p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {uniqueEquipment}
        </p>

        <p className="mt-2 text-xs text-slate-400">Ver todos los registros</p>
      </button>
    </div>
  )
}
