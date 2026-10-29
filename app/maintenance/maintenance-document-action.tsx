"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import { generateMaintenanceDocumentAction } from "@/actions/maintenance-document-actions"

export default function MaintenanceDocumentAction({
  maintenanceId,
  hasGeneratedDocument,
}: {
  maintenanceId: number
  hasGeneratedDocument: boolean
}) {
  const [available, setAvailable] = useState(hasGeneratedDocument)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const documentUrl = `/api/maintenance/${maintenanceId}/document`

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateMaintenanceDocumentAction(maintenanceId)
      if (result.success) {
        setAvailable(true)
      } else {
        setError(result.message ?? "No se pudo generar el formato.")
      }
    })
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {available ? (
        <Link
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
        >
          Abrir formato imprimible
        </Link>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Generando formato…" : "Generar formato imprimible"}
        </button>
      )}
      {error ? (
        <span role="alert" className="basis-full text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  )
}
