"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { authorizePermitDepartureAction } from "@/actions/permit-actions"

import { Button } from "@/components/ui/button"

interface Props {
  permitId: number
}

export default function AuthorizeDepartureButton({ permitId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAuthorize() {
    startTransition(async () => {
      const toastId = toast.loading("Autorizando salida...")

      const result = await authorizePermitDepartureAction(permitId)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Salida autorizada correctamente.")
    })
  }

  return (
    <Button type="button" onClick={handleAuthorize} disabled={isPending}>
      {isPending ? "Autorizando..." : "Autorizar salida"}
    </Button>
  )
}
