"use client"

import { useState, useTransition } from "react"

import { toast } from "sonner"

import { cancelPermitAction } from "@/actions/permit-actions"

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

interface Props {
  permitId: number
}

export function CancelPermitButton({ permitId }: Props) {
  const [isPending, startTransition] = useTransition()

  const [reason, setReason] = useState("")

  function handleCancel() {
    const cancellationReason = reason.trim()

    if (!cancellationReason) {
      toast.error("Debes indicar el motivo de cancelación.")
      return
    }

    if (cancellationReason.length < 5) {
      toast.error("El motivo debe tener al menos 5 caracteres.")
      return
    }

    startTransition(async () => {
      const toastId = toast.loading("Cancelando permiso...")

      const result = await cancelPermitAction(permitId, cancellationReason)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Permiso cancelado correctamente.")

      window.location.href = "/permits"
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            Cancelar
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar este permiso?</AlertDialogTitle>

          <AlertDialogDescription>
            Al cancelar este permiso, el equipo dejará de estar autorizado para
            salir. Vigilancia rechazará cualquier intento de salida asociado a
            este permiso.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label
            htmlFor={`cancellation-reason-${permitId}`}
            className="text-sm font-medium"
          >
            Motivo de cancelación
          </label>

          <textarea
            id={`cancellation-reason-${permitId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej. Equipo retirado de planta..."
            rows={3}
            disabled={isPending}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="text-xs text-muted-foreground">
            El motivo quedará registrado en el historial del permiso.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Regresar</AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              handleCancel()
            }}
          >
            {isPending ? "Cancelando..." : "Sí, cancelar permiso"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
