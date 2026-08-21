"use client"

import { useState } from "react"
import { toast } from "sonner"

import { generatePermitDocumentAction } from "@/actions/permit-document-actions"

export default function GeneratePermitDocumentButton({
  permitId,
}: {
  permitId: number
}) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)

    const result = await generatePermitDocumentAction(permitId)

    setLoading(false)

    if (!result.success) {
      toast.error(result.message ?? "No se pudo generar el formato.")
      return
    }

    toast.success("Formato generado correctamente.")
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? "Generando..." : "Generar formato"}
    </button>
  )
}
