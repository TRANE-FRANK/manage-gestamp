"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { uploadSignedPermitPdfAction } from "@/actions/permit-actions"

import { Button } from "@/components/ui/button"

interface Props {
  permitId: number
}

export default function UploadSignedPermitForm({ permitId }: Props) {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      toast.error("Debes seleccionar un archivo PDF.")
      return
    }

    const formData = new FormData()

    formData.append("file", file)

    startTransition(async () => {
      const toastId = toast.loading("Subiendo PDF firmado...")

      const result = await uploadSignedPermitPdfAction(permitId, formData)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("PDF firmado subido correctamente.")

      setFile(null)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="signed-pdf" className="text-sm font-medium">
          PDF firmado
        </label>

        <input
          id="signed-pdf"
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          disabled={isPending}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <p className="text-xs text-muted-foreground">
          Sube el documento escaneado con todas las firmas correspondientes.
        </p>
      </div>

      <Button type="submit" disabled={!file || isPending}>
        {isPending ? "Subiendo..." : "Subir PDF firmado"}
      </Button>
    </form>
  )
}
