"use client"

import { useTransition } from "react"

import { toast } from "sonner"

import { renewPermitAction } from "@/actions/permit-actions"

import { Button } from "@/components/ui/button"

interface Props {
  permitId: number
}

export default function RenewPermitForm({ permitId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const toastId = toast.loading("Renovando permiso...")

      const result = await renewPermitAction(permitId, formData)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Permiso renovado correctamente.")

      window.location.href = "/permits"
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            Nueva fecha de inicio
          </label>

          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expirationDate" className="text-sm font-medium">
            Nueva fecha de vencimiento
          </label>

          <input
            id="expirationDate"
            name="expirationDate"
            type="date"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Renovando..." : "Renovar permiso"}
      </Button>
    </form>
  )
}
