"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { returnAssignmentAction } from "@/actions/assignment-actions"

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

interface ReturnAssignmentButtonProps {
  assignmentId: number
}

export function ReturnAssignmentButton({
  assignmentId,
}: ReturnAssignmentButtonProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleReturn() {
    startTransition(async () => {
      const toastId = toast.loading("Registrando devolución...")

      const result = await returnAssignmentAction(assignmentId)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Equipo devuelto correctamente.")

      setOpen(false)

      router.push("/assignments")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="destructive">Devolver equipo</Button>}
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Devolver equipo?</AlertDialogTitle>

          <AlertDialogDescription>
            Esta acción finalizará la asignación y dejará el equipo disponible
            nuevamente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleReturn}
          >
            {isPending ? "Devolviendo..." : "Sí, devolver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
