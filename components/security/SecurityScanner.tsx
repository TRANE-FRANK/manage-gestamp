"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useScanResult } from "@/components/security/ScanResultContext"

export default function SecurityScanner() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { setResult, setSearchedAssetTag } = useScanResult()

  const [assetTag, setAssetTag] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function searchEquipment(value: string) {
    const normalizedValue = value.trim()

    if (!normalizedValue || isSearching) {
      return
    }

    setIsSearching(true)
    setError(null)
    setResult(null)
    setSearchedAssetTag(null)

    try {
      const response = await fetch("/api/permits/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetTag: normalizedValue }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.message ?? "No fue posible verificar el equipo.")
        return
      }

      setResult(payload)
      setSearchedAssetTag(normalizedValue)
      router.push("/security/search")
    } catch {
      setError("No fue posible conectar con el servicio de verificación.")
    } finally {
      setIsSearching(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    searchEquipment(assetTag)
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="assetTag"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Escanear equipo
        </label>

        <input
          ref={inputRef}
          id="assetTag"
          name="assetTag"
          type="text"
          value={assetTag}
          onChange={(event) => setAssetTag(event.target.value)}
          placeholder="Escanee la etiqueta del equipo..."
          autoComplete="off"
          autoFocus
          disabled={isSearching}
          className="w-full rounded-lg border border-slate-300 px-4 py-4 text-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
        />
      </div>

      <button
        type="submit"
        disabled={!assetTag.trim() || isSearching}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSearching ? "Verificando..." : "Verificar salida"}
      </button>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-slate-500">
        Escanee la etiqueta del equipo con el lector.
      </p>
    </form>
  )
}
