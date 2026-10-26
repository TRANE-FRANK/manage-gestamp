"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { cancelAssignmentAction } from "@/actions/assignment-actions"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CancelAssignmentButtonProps {
  assignmentId: number
}

export function CancelAssignmentButton({
  assignmentId,
}: CancelAssignmentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    const cancellationReason = reason.trim()

    if (!cancellationReason) {
      toast.error("El motivo de anulación es obligatorio.")
      return
    }

    startTransition(async () => {
      const toastId = toast.loading("Anulando asignación...")
      const result = await cancelAssignmentAction(
        assignmentId,
        cancellationReason,
      )

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Asignación anulada correctamente.")
      setOpen(false)
      setReason("")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="destructive">Anular asignación</Button>}
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular asignación?</AlertDialogTitle>

          <AlertDialogDescription>
            La asignación se conservará en el historial y el equipo volverá a
            estar disponible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <label
            htmlFor="cancellation-reason"
            className="mb-2 block text-sm font-medium"
          >
            Motivo de anulación
          </label>

          <textarea
            id="cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-blue-500"
            placeholder="Describe el motivo de la anulación"
            required
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={isPending || !reason.trim()}
            onClick={handleCancel}
          >
            {isPending ? "Anulando..." : "Sí, anular"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
