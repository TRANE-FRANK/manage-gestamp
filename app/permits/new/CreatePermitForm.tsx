"use client"

import { useTransition } from "react"

import { toast } from "sonner"

import { createPermit } from "@/actions/permit-actions"

import { Button } from "@/components/ui/button"

interface Employee {
  id: number
  firstName: string
  lastName: string
}

interface Equipment {
  id: number
  assetTag: string
}

interface Props {
  employees: Employee[]
  equipment: Equipment[]
}

export default function CreatePermitForm({ employees, equipment }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const toastId = toast.loading("Creando permiso...")

      const result = await createPermit(formData)

      toast.dismiss(toastId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Permiso creado correctamente.")

      window.location.href = "/permits"
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input
        name="folio"
        placeholder="SI-PERMISO-551"
        required
        className="w-full rounded border p-3"
      />

      <select
        name="employeeId"
        required
        className="w-full rounded border p-3"
        defaultValue=""
      >
        <option value="" disabled>
          Seleccione empleado
        </option>

        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.firstName} {employee.lastName}
          </option>
        ))}
      </select>

      <select
        name="equipmentId"
        required
        className="w-full rounded border p-3"
        defaultValue=""
      >
        <option value="" disabled>
          Seleccione equipo
        </option>

        {equipment.map((item) => (
          <option key={item.id} value={item.id}>
            {item.assetTag}
          </option>
        ))}
      </select>

      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium">
          Fecha de inicio
        </label>

        <input
          id="startDate"
          type="date"
          name="startDate"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="expirationDate" className="text-sm font-medium">
          Fecha de vencimiento
        </label>

        <input
          id="expirationDate"
          type="date"
          name="expirationDate"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar Permiso de Salida de Equipo"}
      </Button>
    </form>
  )
}
