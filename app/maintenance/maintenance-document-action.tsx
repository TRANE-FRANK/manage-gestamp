"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"

import {
  generateMaintenanceDocumentAction,
  uploadMaintenanceSignedPdfAction,
} from "@/actions/maintenance-document-actions"

export default function MaintenanceDocumentAction({
  maintenanceId,
  hasGeneratedDocument,
  hasSignedDocument,
}: {
  maintenanceId: number
  hasGeneratedDocument: boolean
  hasSignedDocument: boolean
}) {
  const [available, setAvailable] = useState(hasGeneratedDocument)
  const [signedAvailable, setSignedAvailable] = useState(hasSignedDocument)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAvailable(hasGeneratedDocument)
  }, [hasGeneratedDocument])

  useEffect(() => {
    setSignedAvailable(hasSignedDocument)
  }, [hasSignedDocument])

  const documentUrl = `/api/maintenance/${maintenanceId}/document`
  const signedDocumentUrl = `/api/maintenance/${maintenanceId}/signed-document`

  function generate() {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await generateMaintenanceDocumentAction(maintenanceId)

      if (result.success) {
        setAvailable(true)
        setSuccess("Formato generado correctamente.")
      } else {
        setError(result.message ?? "No se pudo generar el formato.")
      }
    })
  }

  function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await uploadMaintenanceSignedPdfAction(
        maintenanceId,
        formData,
      )

      if (result.success) {
        setSignedAvailable(true)
        setSuccess("Documento firmado cargado correctamente.")

        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setError(result.message ?? "No se pudo cargar el documento.")
      }
    })
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {available ? (
          <Link
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Abrir formato original
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
      </div>

      {available ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">
              Documento firmado:
            </span>

            {signedAvailable ? (
              <>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Cargado
                </span>

                <Link
                  href={signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
                >
                  Abrir documento firmado
                </Link>
              </>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pendiente
              </span>
            )}
          </div>

          {!signedAvailable ? (
            <form onSubmit={upload} className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept="application/pdf,.pdf"
                required
                disabled={isPending}
                className="block w-full max-w-xs text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isPending ? "Procesando…" : "Cargar PDF firmado"}
              </button>

              <p className="text-xs text-slate-500">
                PDF, máximo 10 MB. Una vez cargado no podrá reemplazarse desde
                esta pantalla.
              </p>
            </form>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="text-xs text-green-700">
          {success}
        </p>
      ) : null}
    </div>
  )
}
