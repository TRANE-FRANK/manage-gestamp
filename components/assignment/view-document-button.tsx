"use client"

import { Eye } from "lucide-react"

import type { DocumentType } from "@/services/document"

interface Props {
  assignmentId: number
  type: DocumentType
}

export default function ViewDocumentButton({ assignmentId, type }: Props) {
  function openDocument() {
    window.open(`/api/documents/assignment/${assignmentId}/${type}`, "_blank")
  }

  return (
    <button
      onClick={openDocument}
      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
    >
      <Eye size={16} />

      {type === "generated" ? "Ver generado" : "Ver firmado"}
    </button>
  )
}
