"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import * as React from "react"

import type { EmployeeOption, EquipmentOption } from "./types"

import { createAssignmentAction } from "@/actions/assignment-actions"

import EmployeeSelector from "./EmployeeSelector"
import EquipmentSelector from "./EquipmentSelector"

interface AssignmentFormProps {
  employees: EmployeeOption[]
  equipment: EquipmentOption[]
  employeeId?: string
}

export default function AssignmentForm({
  employees,
  equipment,
  employeeId,
}: AssignmentFormProps) {
  const initialEmployee =
    employees.find((e) => e.id === Number(employeeId)) ?? null

  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeOption | null>(initialEmployee)

  const [selectedEquipment, setSelectedEquipment] =
    React.useState<EquipmentOption | null>(null)

  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createAssignmentAction(formData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Asignación creada correctamente.")

      router.push("/assignments")
      router.refresh()
    })
  }

  return (
    <form action={submit} className="space-y-6">
      <input
        type="hidden"
        name="employeeId"
        value={selectedEmployee?.id ?? ""}
      />

      <input
        type="hidden"
        name="equipmentId"
        value={selectedEquipment?.id ?? ""}
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Empleado</label>

        <EmployeeSelector
          employees={employees}
          value={selectedEmployee}
          onValueChange={setSelectedEmployee}
          disabled={!!employeeId}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Equipo</label>

        <EquipmentSelector
          equipment={equipment}
          value={selectedEquipment}
          onValueChange={setSelectedEquipment}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar asignación"}
      </button>
    </form>
  )
}
