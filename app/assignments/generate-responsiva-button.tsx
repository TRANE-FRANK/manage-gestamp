"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { generateResponsivaAction } from "@/actions/assignment-document-actions"

export default function GenerateResponsivaButton({
  assignmentId,
}: {
  assignmentId: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function generate() {
    startTransition(async () => {
      try {
        toast.loading("Generando responsiva...", {
          id: "responsiva",
        })

        const result = await generateResponsivaAction(assignmentId)

        if (!result.success) {
          toast.error(result.message ?? "No fue posible generar la responsiva.", {
            id: "responsiva",
          })
          return
        }

        toast.success("Responsiva generada correctamente.", {
          id: "responsiva",
        })

        router.refresh()
      } catch {
        toast.error("No fue posible generar la responsiva.", {
          id: "responsiva",
        })
      }
    })
  }

  return (
    <button
      disabled={pending}
      onClick={generate}
      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Generando..." : "Generar Responsiva"}
    </button>
  )
}
